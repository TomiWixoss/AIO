import { Router } from "express";
import { dbGet, dbPost, dbPut, dbDelete } from "../utils/db-client.js";
import {
  chatCompletion,
  chatCompletionStream,
} from "../utils/gateway-client.js";

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

// Helper để build chat request với type conversion đúng
function buildChatRequest(chatbot: Chatbot, message: string, stream: boolean) {
  const toolIds =
    typeof chatbot.tool_ids === "string"
      ? JSON.parse(chatbot.tool_ids)
      : chatbot.tool_ids;

  return {
    provider: chatbot.provider_name || "google-ai",
    model: chatbot.model_name || "gemini-2.0-flash",
    messages: [
      ...(chatbot.system_prompt
        ? [{ role: "system" as const, content: chatbot.system_prompt }]
        : []),
      { role: "user" as const, content: message },
    ],
    temperature: Number(chatbot.temperature) || 0.7,
    max_tokens: Number(chatbot.max_tokens) || 2048,
    tool_ids: toolIds || [],
    auto_mode: Boolean(chatbot.auto_mode),
    stream,
  };
}

// ============ CRUD ROUTES (không cần auth) ============

// GET /chatbots - Lấy tất cả chatbots
chatbotRoutes.get("/", async (_req, res) => {
  try {
    const chatbots = await dbGet<Chatbot[]>("/chatbots");
    res.json({ success: true, data: chatbots.map(parseChatbot) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /chatbots/:id - Lấy chatbot theo ID
chatbotRoutes.get("/:id", async (req, res) => {
  // Skip nếu là route public
  if (req.params.id === "public")
    return res.status(404).json({ error: "Not found" });

  try {
    const chatbot = await dbGet<Chatbot>(`/chatbots/${req.params.id}`);
    res.json({ success: true, data: parseChatbot(chatbot) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /chatbots - Tạo chatbot mới
chatbotRoutes.post("/", async (req, res) => {
  try {
    const result = await dbPost("/chatbots", req.body);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /chatbots/:id - Cập nhật chatbot
chatbotRoutes.put("/:id", async (req, res) => {
  try {
    const result = await dbPut(`/chatbots/${req.params.id}`, req.body);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /chatbots/:id/regenerate-key - Tạo API key mới
chatbotRoutes.post("/:id/regenerate-key", async (req, res) => {
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

// DELETE /chatbots/:id - Xóa chatbot
chatbotRoutes.delete("/:id", async (req, res) => {
  try {
    await dbDelete(`/chatbots/${req.params.id}`);
    res.json({ success: true, message: "Deleted" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============ PUBLIC ROUTES ============

// GET /chatbots/public/:slug - Lấy config chatbot public
chatbotRoutes.get("/public/:slug", async (req, res) => {
  try {
    const chatbot = await dbGet<Chatbot>(`/chatbots/slug/${req.params.slug}`);

    if (!chatbot.is_active) {
      return res.status(404).json({ error: "Chatbot not found" });
    }

    // Trả về config public (không bao gồm api_key nếu private)
    const parsed = parseChatbot(chatbot);
    if (!parsed.is_public) {
      const { api_key, ...publicConfig } = parsed;
      return res.json({ success: true, data: publicConfig });
    }

    res.json({ success: true, data: parsed });
  } catch (error: any) {
    res.status(404).json({ error: "Chatbot not found" });
  }
});

// POST /chatbots/public/:slug/chat - Chat với chatbot
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

    const { message, stream = false } = req.body;

    if (!message) {
      return res.status(400).json({ error: "message is required" });
    }

    const chatRequest = buildChatRequest(chatbot, message, stream);

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

// POST /chatbots/:id/test-chat - Test chat trong builder (không cần slug)
chatbotRoutes.post("/:id/test-chat", async (req, res) => {
  try {
    const chatbot = await dbGet<Chatbot>(`/chatbots/${req.params.id}`);
    const { message, stream = false } = req.body;

    if (!message) {
      return res.status(400).json({ error: "message is required" });
    }

    const chatRequest = buildChatRequest(chatbot, message, stream);

    if (stream) {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      await chatCompletionStream(chatRequest as any, res);
      res.end();
    } else {
      const response = await chatCompletion(chatRequest as any);
      res.json(response);
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============ CODE EXPORT ============

// GET /chatbots/:id/export-code - Xuất code mẫu
chatbotRoutes.get("/:id/export-code", async (req, res) => {
  try {
    const chatbot = await dbGet<Chatbot>(`/chatbots/${req.params.id}`);
    const parsed = parseChatbot(chatbot);

    const baseUrl = process.env.PUBLIC_API_URL || "http://localhost:4000";
    const chatEndpoint = `${baseUrl}/chatbots/public/${chatbot.slug}/chat`;
    const configEndpoint = `${baseUrl}/chatbots/public/${chatbot.slug}`;

    const code = {
      curl: `curl -X POST "${chatEndpoint}" \\
  -H "Content-Type: application/json" \\
${!parsed.is_public ? `  -H "X-API-Key: ${chatbot.api_key}" \\` : ""}
  -d '{"message": "Xin chào!", "stream": false}'`,

      javascript: `async function sendMessage(message) {
  const response = await fetch("${chatEndpoint}", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
${!parsed.is_public ? `      "X-API-Key": "${chatbot.api_key}",` : ""}
    },
    body: JSON.stringify({ message, stream: false }),
  });
  const data = await response.json();
  return data.choices[0].message.content;
}

sendMessage("Xin chào!").then(console.log);`,

      javascript_stream: `async function sendMessageStream(message, onChunk) {
  const response = await fetch("${chatEndpoint}", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
${!parsed.is_public ? `      "X-API-Key": "${chatbot.api_key}",` : ""}
    },
    body: JSON.stringify({ message, stream: true }),
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value);
    for (const line of chunk.split("\\n")) {
      if (line.startsWith("data: ") && !line.includes("[DONE]")) {
        try {
          const data = JSON.parse(line.slice(6));
          const content = data.choices?.[0]?.delta?.content;
          if (content) onChunk(content);
        } catch {}
      }
    }
  }
}`,

      python: `import requests

def send_message(message):
    response = requests.post(
        "${chatEndpoint}",
        headers={
            "Content-Type": "application/json",
${!parsed.is_public ? `            "X-API-Key": "${chatbot.api_key}",` : ""}
        },
        json={"message": message, "stream": False},
    )
    data = response.json()
    return data["choices"][0]["message"]["content"]

print(send_message("Xin chào!"))`,

      react: `import { useState } from "react";

export function Chatbot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMessage = input;
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
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
      setMessages(prev => [...prev, { role: "assistant", content: data.choices[0].message.content }]);
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
          <div key={i} className={\`message \${msg.role}\`}>{msg.content}</div>
        ))}
      </div>
      <input value={input} onChange={e => setInput(e.target.value)} 
        onKeyDown={e => e.key === "Enter" && sendMessage()} 
        placeholder="${
          parsed.placeholder_text || "Nhập tin nhắn..."
        }" disabled={loading} />
      <button onClick={sendMessage} disabled={loading}>{loading ? "..." : "Gửi"}</button>
    </div>
  );
}`,

      html_widget: `<div id="chatbot-widget"></div>
<script>
(function() {
  const URL = "${chatEndpoint}";
  ${!parsed.is_public ? `const API_KEY = "${chatbot.api_key}";` : ""}
  const widget = document.getElementById("chatbot-widget");
  widget.innerHTML = \`
    <div style="border:1px solid #ccc;border-radius:8px;width:350px;height:500px;display:flex;flex-direction:column">
      <div style="padding:12px;background:#007bff;color:white;border-radius:8px 8px 0 0"><strong>${
        parsed.name
      }</strong></div>
      <div id="msgs" style="flex:1;overflow-y:auto;padding:12px"></div>
      <div style="padding:12px;border-top:1px solid #ccc;display:flex;gap:8px">
        <input id="inp" placeholder="${
          parsed.placeholder_text
        }" style="flex:1;padding:8px;border:1px solid #ccc;border-radius:4px">
        <button id="btn" style="padding:8px 16px;background:#007bff;color:white;border:none;border-radius:4px">Gửi</button>
      </div>
    </div>\`;
  const msgs=document.getElementById("msgs"),inp=document.getElementById("inp"),btn=document.getElementById("btn");
  ${
    parsed.welcome_message
      ? `msgs.innerHTML='<div style="margin-bottom:8px;padding:8px;background:#f0f0f0;border-radius:8px">${parsed.welcome_message}</div>';`
      : ""
  }
  async function send(){
    const m=inp.value.trim();if(!m)return;inp.value="";
    msgs.innerHTML+=\`<div style="margin-bottom:8px;padding:8px;background:#007bff;color:white;border-radius:8px;margin-left:20%">\${m}</div>\`;
    const r=await fetch(URL,{method:"POST",headers:{"Content-Type":"application/json"${
      !parsed.is_public ? ',"X-API-Key":API_KEY' : ""
    }},body:JSON.stringify({message:m})});
    const d=await r.json();
    msgs.innerHTML+=\`<div style="margin-bottom:8px;padding:8px;background:#f0f0f0;border-radius:8px;margin-right:20%">\${d.choices[0].message.content}</div>\`;
    msgs.scrollTop=msgs.scrollHeight;
  }
  btn.onclick=send;inp.onkeydown=e=>e.key==="Enter"&&send();
})();
</script>`,

      api_info: {
        endpoint: chatEndpoint,
        config_endpoint: configEndpoint,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(!parsed.is_public && { "X-API-Key": chatbot.api_key }),
        },
        body: { message: "string (required)", stream: "boolean (optional)" },
      },
    };

    res.json({ success: true, data: code });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
