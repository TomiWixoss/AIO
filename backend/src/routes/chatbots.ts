import { Router } from "express";
import { dbGet, dbPost, dbPut, dbDelete } from "../utils/db-client.js";
import {
  chatCompletion,
  chatCompletionStream,
} from "../utils/gateway-client.js";
import { authMiddleware } from "../middleware/auth.js";

export const chatbotRoutes = Router();

interface Chatbot {
  id: number;
  name: string;
  slug: string;
  description: string;
  provider_id: number | null;
  model_id: number | null;
  provider_name: string | null;
  model_name: string | null;
  auto_mode: boolean;
  system_prompt: string;
  temperature: number;
  max_tokens: number;
  tool_ids: number[] | string | null;
  knowledge_base_ids: number[] | string | null;
  welcome_message: string;
  placeholder_text: string;
  is_public: boolean;
  api_key: string;
  allowed_origins: string[] | string | null;
  is_active: boolean;
}

// Helper để parse JSON fields
function parseChatbot(chatbot: Chatbot): Chatbot {
  return {
    ...chatbot,
    tool_ids:
      typeof chatbot.tool_ids === "string"
        ? JSON.parse(chatbot.tool_ids)
        : chatbot.tool_ids,
    knowledge_base_ids:
      typeof chatbot.knowledge_base_ids === "string"
        ? JSON.parse(chatbot.knowledge_base_ids)
        : chatbot.knowledge_base_ids,
    allowed_origins:
      typeof chatbot.allowed_origins === "string"
        ? JSON.parse(chatbot.allowed_origins)
        : chatbot.allowed_origins,
  };
}

// ============ ADMIN ROUTES (cần auth) ============

// GET /chatbots - Lấy tất cả chatbots (admin)
chatbotRoutes.get("/", authMiddleware, async (_req, res) => {
  try {
    const chatbots = await dbGet<Chatbot[]>("/chatbots");
    res.json({ success: true, data: chatbots.map(parseChatbot) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /chatbots/:id - Lấy chatbot theo ID (admin)
chatbotRoutes.get("/:id", authMiddleware, async (req, res) => {
  try {
    const chatbot = await dbGet<Chatbot>(`/chatbots/${req.params.id}`);
    res.json({ success: true, data: parseChatbot(chatbot) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /chatbots - Tạo chatbot mới (admin)
chatbotRoutes.post("/", authMiddleware, async (req, res) => {
  try {
    const result = await dbPost("/chatbots", req.body);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /chatbots/:id - Cập nhật chatbot (admin)
chatbotRoutes.put("/:id", authMiddleware, async (req, res) => {
  try {
    const result = await dbPut(`/chatbots/${req.params.id}`, req.body);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /chatbots/:id/regenerate-key - Tạo API key mới (admin)
chatbotRoutes.post("/:id/regenerate-key", authMiddleware, async (req, res) => {
  try {
    const result = await dbPost(
      `/chatbots/${req.params.id}/regenerate-key`,
      {}
    );
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /chatbots/:id - Xóa chatbot (admin)
chatbotRoutes.delete("/:id", authMiddleware, async (req, res) => {
  try {
    await dbDelete(`/chatbots/${req.params.id}`);
    res.json({ success: true, message: "Deleted" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============ PUBLIC ROUTES (dùng API key hoặc slug) ============

// GET /chatbots/public/:slug - Lấy config chatbot public
chatbotRoutes.get("/public/:slug", async (req, res) => {
  try {
    const chatbot = await dbGet<Chatbot>(`/chatbots/slug/${req.params.slug}`);

    if (!chatbot.is_public && !chatbot.is_active) {
      return res.status(404).json({ error: "Chatbot not found" });
    }

    // Trả về config public (không bao gồm api_key)
    const { api_key, ...publicConfig } = parseChatbot(chatbot);
    res.json({ success: true, data: publicConfig });
  } catch (error: any) {
    res.status(404).json({ error: "Chatbot not found" });
  }
});

// POST /chatbots/public/:slug/chat - Chat với chatbot (public)
chatbotRoutes.post("/public/:slug/chat", async (req, res) => {
  try {
    const chatbot = await dbGet<Chatbot>(`/chatbots/slug/${req.params.slug}`);

    if (!chatbot.is_active) {
      return res.status(404).json({ error: "Chatbot not found" });
    }

    // Check API key nếu không public
    if (!chatbot.is_public) {
      const apiKey = req.headers["x-api-key"] || req.query.api_key;
      if (apiKey !== chatbot.api_key) {
        return res.status(401).json({ error: "Invalid API key" });
      }
    }

    // Check CORS origin
    const origin = req.headers.origin;
    const allowedOrigins =
      typeof chatbot.allowed_origins === "string"
        ? JSON.parse(chatbot.allowed_origins)
        : chatbot.allowed_origins;

    if (allowedOrigins && allowedOrigins.length > 0 && origin) {
      if (!allowedOrigins.includes(origin) && !allowedOrigins.includes("*")) {
        return res.status(403).json({ error: "Origin not allowed" });
      }
    }

    const { message, session_key, stream = false } = req.body;

    if (!message) {
      return res.status(400).json({ error: "message is required" });
    }

    // Parse tool_ids và knowledge_base_ids
    const toolIds =
      typeof chatbot.tool_ids === "string"
        ? JSON.parse(chatbot.tool_ids)
        : chatbot.tool_ids;

    // Build request
    const chatRequest = {
      provider: chatbot.provider_name || "google-ai",
      model: chatbot.model_name || "gemini-2.0-flash",
      messages: [
        ...(chatbot.system_prompt
          ? [{ role: "system", content: chatbot.system_prompt }]
          : []),
        { role: "user", content: message },
      ],
      temperature: chatbot.temperature,
      max_tokens: chatbot.max_tokens,
      tool_ids: toolIds || [],
      auto_mode: chatbot.auto_mode,
      stream,
    };

    if (stream) {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      await chatCompletionStream(chatRequest as any, res);
      res.end();
    } else {
      const response = await chatCompletion(chatRequest as any);
      res.json({
        ...response,
        chatbot_slug: chatbot.slug,
      });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============ CODE EXPORT ============

// GET /chatbots/:id/export-code - Xuất code mẫu
chatbotRoutes.get("/:id/export-code", authMiddleware, async (req, res) => {
  try {
    const chatbot = await dbGet<Chatbot>(`/chatbots/${req.params.id}`);
    const parsed = parseChatbot(chatbot);

    const baseUrl = process.env.PUBLIC_API_URL || "http://localhost:4000";
    const chatEndpoint = `${baseUrl}/chatbots/public/${chatbot.slug}/chat`;
    const configEndpoint = `${baseUrl}/chatbots/public/${chatbot.slug}`;

    const code = {
      // cURL
      curl: `curl -X POST "${chatEndpoint}" \\
  -H "Content-Type: application/json" \\
${!parsed.is_public ? `  -H "X-API-Key: ${chatbot.api_key}" \\` : ""}
  -d '{
    "message": "Xin chào!",
    "stream": false
  }'`,

      // JavaScript Fetch
      javascript: `// Gửi tin nhắn đến chatbot
async function sendMessage(message) {
  const response = await fetch("${chatEndpoint}", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
${!parsed.is_public ? `      "X-API-Key": "${chatbot.api_key}",` : ""}
    },
    body: JSON.stringify({
      message: message,
      stream: false,
    }),
  });
  
  const data = await response.json();
  return data.choices[0].message.content;
}

// Sử dụng
sendMessage("Xin chào!").then(console.log);`,

      // JavaScript Stream
      javascript_stream: `// Gửi tin nhắn với streaming
async function sendMessageStream(message, onChunk) {
  const response = await fetch("${chatEndpoint}", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
${!parsed.is_public ? `      "X-API-Key": "${chatbot.api_key}",` : ""}
    },
    body: JSON.stringify({
      message: message,
      stream: true,
    }),
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split("\\n");

    for (const line of lines) {
      if (line.startsWith("data: ") && !line.includes("[DONE]")) {
        try {
          const data = JSON.parse(line.slice(6));
          const content = data.choices?.[0]?.delta?.content;
          if (content) onChunk(content);
        } catch {}
      }
    }
  }
}

// Sử dụng
sendMessageStream("Xin chào!", (chunk) => process.stdout.write(chunk));`,

      // Python
      python: `import requests

def send_message(message):
    response = requests.post(
        "${chatEndpoint}",
        headers={
            "Content-Type": "application/json",
${!parsed.is_public ? `            "X-API-Key": "${chatbot.api_key}",` : ""}
        },
        json={
            "message": message,
            "stream": False,
        },
    )
    data = response.json()
    return data["choices"][0]["message"]["content"]

# Sử dụng
print(send_message("Xin chào!"))`,

      // React Component
      react: `import { useState } from "react";

export function Chatbot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      const response = await fetch("${chatEndpoint}", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
${!parsed.is_public ? `          "X-API-Key": "${chatbot.api_key}",` : ""}
        },
        body: JSON.stringify({ message: userMessage }),
      });

      const data = await response.json();
      const assistantMessage = data.choices[0].message.content;
      setMessages((prev) => [...prev, { role: "assistant", content: assistantMessage }]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chatbot">
      <div className="messages">
        {messages.map((msg, i) => (
          <div key={i} className={\`message \${msg.role}\`}>
            {msg.content}
          </div>
        ))}
      </div>
      <div className="input-area">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="${parsed.placeholder_text || "Nhập tin nhắn..."}"
          disabled={loading}
        />
        <button onClick={sendMessage} disabled={loading}>
          {loading ? "..." : "Gửi"}
        </button>
      </div>
    </div>
  );
}`,

      // HTML Widget
      html_widget: `<!-- Chatbot Widget -->
<div id="chatbot-widget"></div>
<script>
(function() {
  const CHATBOT_URL = "${chatEndpoint}";
  const API_KEY = "${!parsed.is_public ? chatbot.api_key : ""}";
  
  // Tạo widget UI
  const widget = document.getElementById("chatbot-widget");
  widget.innerHTML = \`
    <div style="border: 1px solid #ccc; border-radius: 8px; width: 350px; height: 500px; display: flex; flex-direction: column;">
      <div style="padding: 12px; background: #007bff; color: white; border-radius: 8px 8px 0 0;">
        <strong>${parsed.name}</strong>
      </div>
      <div id="chat-messages" style="flex: 1; overflow-y: auto; padding: 12px;"></div>
      <div style="padding: 12px; border-top: 1px solid #ccc; display: flex; gap: 8px;">
        <input id="chat-input" type="text" placeholder="${
          parsed.placeholder_text
        }" style="flex: 1; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
        <button id="chat-send" style="padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">Gửi</button>
      </div>
    </div>
  \`;

  const messagesDiv = document.getElementById("chat-messages");
  const input = document.getElementById("chat-input");
  const sendBtn = document.getElementById("chat-send");

  ${
    parsed.welcome_message
      ? `
  // Welcome message
  messagesDiv.innerHTML += '<div style="margin-bottom: 8px; padding: 8px; background: #f0f0f0; border-radius: 8px;">${parsed.welcome_message}</div>';
  `
      : ""
  }

  async function sendMessage() {
    const message = input.value.trim();
    if (!message) return;

    input.value = "";
    messagesDiv.innerHTML += \`<div style="margin-bottom: 8px; padding: 8px; background: #007bff; color: white; border-radius: 8px; margin-left: 20%;">\${message}</div>\`;

    try {
      const response = await fetch(CHATBOT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ${!parsed.is_public ? '"X-API-Key": API_KEY,' : ""}
        },
        body: JSON.stringify({ message }),
      });

      const data = await response.json();
      const reply = data.choices[0].message.content;
      messagesDiv.innerHTML += \`<div style="margin-bottom: 8px; padding: 8px; background: #f0f0f0; border-radius: 8px; margin-right: 20%;">\${reply}</div>\`;
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
    } catch (error) {
      console.error(error);
    }
  }

  sendBtn.onclick = sendMessage;
  input.onkeydown = (e) => e.key === "Enter" && sendMessage();
})();
</script>`,

      // API Info
      api_info: {
        endpoint: chatEndpoint,
        config_endpoint: configEndpoint,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(!parsed.is_public && { "X-API-Key": chatbot.api_key }),
        },
        body: {
          message: "string (required)",
          session_key: "string (optional)",
          stream: "boolean (optional, default: false)",
        },
      },
    };

    res.json({ success: true, data: code });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
