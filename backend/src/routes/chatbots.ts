import { Router } from "express";
import { dbGet, dbPost, dbPut, dbDelete } from "../utils/db-client.js";
import {
  chatCompletion,
  chatCompletionStream,
} from "../utils/gateway-client.js";
import { streamManager } from "../utils/stream-manager.js";

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
  welcome_message: string;
  placeholder_text: string;
  is_public: boolean;
  api_key: string;
  allowed_origins: string[] | string | null;
  is_active: boolean;
}

interface Session {
  id: number;
  session_key: string;
  title: string;
}

interface DBMessage {
  id: number;
  role: string;
  content: string;
}

// Helper để parse JSON fields
function parseChatbot(chatbot: Chatbot): Chatbot {
  return {
    ...chatbot,
    tool_ids:
      typeof chatbot.tool_ids === "string"
        ? JSON.parse(chatbot.tool_ids)
        : chatbot.tool_ids,
    allowed_origins:
      typeof chatbot.allowed_origins === "string"
        ? JSON.parse(chatbot.allowed_origins)
        : chatbot.allowed_origins,
  };
}

// Helper để lưu assistant message
async function saveAssistantMessage(
  sessionId: number,
  content: string
): Promise<void> {
  await dbPost("/chat-messages", {
    session_id: sessionId,
    role: "assistant",
    content,
  });
}

// ============ CRUD ROUTES ============

chatbotRoutes.get("/", async (_req, res) => {
  try {
    const chatbots = await dbGet<Chatbot[]>("/chatbots");
    res.json({ success: true, data: chatbots.map(parseChatbot) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

chatbotRoutes.get("/:id", async (req, res) => {
  if (req.params.id === "public")
    return res.status(404).json({ error: "Not found" });

  try {
    const chatbot = await dbGet<Chatbot>(`/chatbots/${req.params.id}`);
    res.json({ success: true, data: parseChatbot(chatbot) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

chatbotRoutes.post("/", async (req, res) => {
  try {
    const result = await dbPost("/chatbots", req.body);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

chatbotRoutes.put("/:id", async (req, res) => {
  try {
    const result = await dbPut(`/chatbots/${req.params.id}`, req.body);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

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

chatbotRoutes.delete("/:id", async (req, res) => {
  try {
    await dbDelete(`/chatbots/${req.params.id}`);
    res.json({ success: true, message: "Deleted" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============ PUBLIC ROUTES ============

chatbotRoutes.get("/public/:slug", async (req, res) => {
  try {
    const chatbot = await dbGet<Chatbot>(`/chatbots/slug/${req.params.slug}`);

    if (!chatbot.is_active) {
      return res.status(404).json({ error: "Chatbot not found" });
    }

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

// POST /chatbots/public/:slug/chat - Chat với chatbot (có session)
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

    const { message, session_key, stream = false } = req.body;

    if (!message) {
      return res.status(400).json({ error: "message is required" });
    }

    // Get or create session
    let session: Session | null = null;
    let historyMessages: { role: string; content: string }[] = [];

    if (session_key) {
      session = await dbGet<Session>(`/chat-sessions/key/${session_key}`).catch(
        () => null
      );

      if (session) {
        const dbMessages = await dbGet<DBMessage[]>(
          `/chat-messages/session/${session.id}`
        ).catch(() => []);
        historyMessages = dbMessages.map((m) => ({
          role: m.role,
          content: m.content,
        }));
      }
    }

    if (!session) {
      const newKey = session_key || crypto.randomUUID();
      const created = await dbPost<{ id: number }>("/chat-sessions", {
        session_key: newKey,
        title: message.slice(0, 50) || "New Chat",
      });
      session = { id: created.id, session_key: newKey, title: "" };
    }

    // Save user message
    await dbPost("/chat-messages", {
      session_id: session.id,
      role: "user",
      content: message,
    });

    // Build messages for LLM
    const toolIds =
      typeof chatbot.tool_ids === "string"
        ? JSON.parse(chatbot.tool_ids)
        : chatbot.tool_ids;

    const llmMessages: { role: string; content: string }[] = [];

    // 1. System prompt
    if (chatbot.system_prompt) {
      llmMessages.push({ role: "system", content: chatbot.system_prompt });
    }

    // 2. History (không bao gồm system)
    llmMessages.push(...historyMessages.filter((m) => m.role !== "system"));

    // 3. User message mới
    llmMessages.push({ role: "user", content: message });

    const provider = chatbot.provider_name || "google-ai";
    const model = chatbot.model_name || "gemini-2.0-flash";

    const chatRequest = {
      provider,
      model,
      messages: llmMessages,
      temperature: Number(chatbot.temperature) || 0.7,
      max_tokens: Number(chatbot.max_tokens) || 2048,
      tool_ids: toolIds || [],
      auto_mode: Boolean(chatbot.auto_mode),
    };

    if (stream) {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      // Gửi session_key ngay đầu stream để client lưu lại
      res.write(
        `data: ${JSON.stringify({ session_key: session.session_key })}\n\n`
      );

      const controller = streamManager.register(
        session.session_key,
        session.id,
        res,
        true,
        provider,
        model
      );

      try {
        await chatCompletionStream(
          chatRequest as any,
          res,
          controller.signal,
          (content) => streamManager.appendContent(session.session_key, content)
        );

        const fullContent = streamManager.getStreamedContent(
          session.session_key
        );
        if (fullContent) {
          await saveAssistantMessage(session.id, fullContent);
        }
      } catch (error: any) {
        if (error.name === "AbortError") {
          const partialContent = streamManager.getStreamedContent(
            session.session_key
          );
          if (partialContent) {
            await saveAssistantMessage(
              session.id,
              partialContent + " [cancelled]"
            );
          }
          res.write(`data: {"cancelled": true}\n\n`);
        } else {
          throw error;
        }
      } finally {
        streamManager.unregister(session.session_key);
      }

      res.end();
    } else {
      const controller = streamManager.register(
        session.session_key,
        session.id,
        undefined,
        false,
        provider,
        model
      );

      try {
        const response = await chatCompletion(
          chatRequest as any,
          controller.signal
        );
        const assistantContent = response.choices?.[0]?.message?.content;

        if (assistantContent) {
          await saveAssistantMessage(session.id, assistantContent);
        }

        res.json({
          ...response,
          session_key: session.session_key,
          chatbot_slug: chatbot.slug,
        });
      } catch (error: any) {
        if (error.name === "AbortError") {
          return res
            .status(499)
            .json({ error: "Request cancelled", cancelled: true });
        }
        throw error;
      } finally {
        streamManager.unregister(session.session_key);
      }
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /chatbots/:id/test-chat - Test chat trong builder (có session)
chatbotRoutes.post("/:id/test-chat", async (req, res) => {
  try {
    const chatbot = await dbGet<Chatbot>(`/chatbots/${req.params.id}`);
    const { message, session_key, stream = false } = req.body;

    if (!message) {
      return res.status(400).json({ error: "message is required" });
    }

    // Get or create session
    let session: Session | null = null;
    let historyMessages: { role: string; content: string }[] = [];

    if (session_key) {
      session = await dbGet<Session>(`/chat-sessions/key/${session_key}`).catch(
        () => null
      );

      if (session) {
        const dbMessages = await dbGet<DBMessage[]>(
          `/chat-messages/session/${session.id}`
        ).catch(() => []);
        historyMessages = dbMessages.map((m) => ({
          role: m.role,
          content: m.content,
        }));
      }
    }

    if (!session) {
      const newKey = session_key || crypto.randomUUID();
      const created = await dbPost<{ id: number }>("/chat-sessions", {
        session_key: newKey,
        title: message.slice(0, 50) || "Test Chat",
      });
      session = { id: created.id, session_key: newKey, title: "" };
    }

    // Save user message
    await dbPost("/chat-messages", {
      session_id: session.id,
      role: "user",
      content: message,
    });

    // Build messages for LLM
    const toolIds =
      typeof chatbot.tool_ids === "string"
        ? JSON.parse(chatbot.tool_ids)
        : chatbot.tool_ids;

    const llmMessages: { role: string; content: string }[] = [];

    if (chatbot.system_prompt) {
      llmMessages.push({ role: "system", content: chatbot.system_prompt });
    }

    llmMessages.push(...historyMessages.filter((m) => m.role !== "system"));
    llmMessages.push({ role: "user", content: message });

    const provider = chatbot.provider_name || "google-ai";
    const model = chatbot.model_name || "gemini-2.0-flash";

    const chatRequest = {
      provider,
      model,
      messages: llmMessages,
      temperature: Number(chatbot.temperature) || 0.7,
      max_tokens: Number(chatbot.max_tokens) || 2048,
      tool_ids: toolIds || [],
      auto_mode: Boolean(chatbot.auto_mode),
    };

    if (stream) {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      // Gửi session_key ngay đầu stream để client lưu lại
      res.write(
        `data: ${JSON.stringify({ session_key: session.session_key })}\n\n`
      );

      const controller = streamManager.register(
        session.session_key,
        session.id,
        res,
        true,
        provider,
        model
      );

      try {
        await chatCompletionStream(
          chatRequest as any,
          res,
          controller.signal,
          (content) => streamManager.appendContent(session.session_key, content)
        );

        const fullContent = streamManager.getStreamedContent(
          session.session_key
        );
        if (fullContent) {
          await saveAssistantMessage(session.id, fullContent);
        }
      } catch (error: any) {
        if (error.name === "AbortError") {
          const partialContent = streamManager.getStreamedContent(
            session.session_key
          );
          if (partialContent) {
            await saveAssistantMessage(
              session.id,
              partialContent + " [cancelled]"
            );
          }
          res.write(`data: {"cancelled": true}\n\n`);
        } else {
          throw error;
        }
      } finally {
        streamManager.unregister(session.session_key);
      }

      res.end();
    } else {
      const controller = streamManager.register(
        session.session_key,
        session.id,
        undefined,
        false,
        provider,
        model
      );

      try {
        const response = await chatCompletion(
          chatRequest as any,
          controller.signal
        );
        const assistantContent = response.choices?.[0]?.message?.content;

        if (assistantContent) {
          await saveAssistantMessage(session.id, assistantContent);
        }

        res.json({
          ...response,
          session_key: session.session_key,
        });
      } catch (error: any) {
        if (error.name === "AbortError") {
          return res
            .status(499)
            .json({ error: "Request cancelled", cancelled: true });
        }
        throw error;
      } finally {
        streamManager.unregister(session.session_key);
      }
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============ CODE EXPORT ============

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
  -d '{"message": "Xin chào!", "session_key": "my-session-123", "stream": false}'`,

      javascript: `// Chatbot với session để giữ history
class ChatbotClient {
  constructor() {
    this.sessionKey = null;
  }

  async sendMessage(message) {
    const response = await fetch("${chatEndpoint}", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
${!parsed.is_public ? `        "X-API-Key": "${chatbot.api_key}",` : ""}
      },
      body: JSON.stringify({
        message,
        session_key: this.sessionKey,
        stream: false
      }),
    });
    const data = await response.json();
    
    // Lưu session_key để giữ history
    if (data.session_key) {
      this.sessionKey = data.session_key;
    }
    
    return data.choices[0].message.content;
  }

  clearSession() {
    this.sessionKey = null;
  }
}

const chatbot = new ChatbotClient();
chatbot.sendMessage("Xin chào!").then(console.log);
chatbot.sendMessage("Tên tôi là An").then(console.log);
chatbot.sendMessage("Tên tôi là gì?").then(console.log); // AI sẽ nhớ tên`,

      javascript_stream: `// Streaming với session
class ChatbotStreamClient {
  constructor() {
    this.sessionKey = null;
  }

  async sendMessageStream(message, onChunk) {
    const response = await fetch("${chatEndpoint}", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
${!parsed.is_public ? `        "X-API-Key": "${chatbot.api_key}",` : ""}
      },
      body: JSON.stringify({
        message,
        session_key: this.sessionKey,
        stream: true
      }),
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
            // Lưu session_key
            if (data.session_key && !this.sessionKey) {
              this.sessionKey = data.session_key;
            }
            const content = data.choices?.[0]?.delta?.content;
            if (content) onChunk(content);
          } catch {}
        }
      }
    }
  }
}`,

      python: `import requests

class ChatbotClient:
    def __init__(self):
        self.session_key = None
    
    def send_message(self, message):
        response = requests.post(
            "${chatEndpoint}",
            headers={
                "Content-Type": "application/json",
${!parsed.is_public ? `                "X-API-Key": "${chatbot.api_key}",` : ""}
            },
            json={
                "message": message,
                "session_key": self.session_key,
                "stream": False
            },
        )
        data = response.json()
        
        # Lưu session_key để giữ history
        if "session_key" in data:
            self.session_key = data["session_key"]
        
        return data["choices"][0]["message"]["content"]
    
    def clear_session(self):
        self.session_key = None

chatbot = ChatbotClient()
print(chatbot.send_message("Xin chào!"))
print(chatbot.send_message("Tên tôi là An"))
print(chatbot.send_message("Tên tôi là gì?"))  # AI sẽ nhớ tên`,

      react: `import { useState, useRef } from "react";

export function Chatbot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const sessionKeyRef = useRef(null);

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
        body: JSON.stringify({
          message: userMessage,
          session_key: sessionKeyRef.current,
          stream: false
        }),
      });
      const data = await response.json();
      
      // Lưu session_key để giữ history
      if (data.session_key) {
        sessionKeyRef.current = data.session_key;
      }
      
      setMessages(prev => [...prev, { role: "assistant", content: data.choices[0].message.content }]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    sessionKeyRef.current = null;
    setMessages([]);
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
      <button onClick={clearChat}>Xóa chat</button>
    </div>
  );
}`,

      html_widget: `<div id="chatbot-widget"></div>
<script>
(function() {
  const URL = "${chatEndpoint}";
  ${!parsed.is_public ? `const API_KEY = "${chatbot.api_key}";` : ""}
  let sessionKey = null;
  
  const widget = document.getElementById("chatbot-widget");
  widget.innerHTML = \`
    <div style="border:1px solid #ccc;border-radius:8px;width:350px;height:500px;display:flex;flex-direction:column">
      <div style="padding:12px;background:#007bff;color:white;border-radius:8px 8px 0 0;display:flex;justify-content:space-between">
        <strong>${parsed.name}</strong>
        <button id="clear" style="background:none;border:none;color:white;cursor:pointer">🗑️</button>
      </div>
      <div id="msgs" style="flex:1;overflow-y:auto;padding:12px"></div>
      <div style="padding:12px;border-top:1px solid #ccc;display:flex;gap:8px">
        <input id="inp" placeholder="${
          parsed.placeholder_text
        }" style="flex:1;padding:8px;border:1px solid #ccc;border-radius:4px">
        <button id="btn" style="padding:8px 16px;background:#007bff;color:white;border:none;border-radius:4px">Gửi</button>
      </div>
    </div>\`;
  
  const msgs=document.getElementById("msgs"),inp=document.getElementById("inp"),btn=document.getElementById("btn"),clear=document.getElementById("clear");
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
    }},body:JSON.stringify({message:m,session_key:sessionKey})});
    const d=await r.json();
    if(d.session_key)sessionKey=d.session_key;
    msgs.innerHTML+=\`<div style="margin-bottom:8px;padding:8px;background:#f0f0f0;border-radius:8px;margin-right:20%">\${d.choices[0].message.content}</div>\`;
    msgs.scrollTop=msgs.scrollHeight;
  }
  
  clear.onclick=()=>{sessionKey=null;msgs.innerHTML='${
    parsed.welcome_message
      ? `<div style="margin-bottom:8px;padding:8px;background:#f0f0f0;border-radius:8px">${parsed.welcome_message}</div>`
      : ""
  }';};
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
        body: {
          message: "string (required)",
          session_key: "string (optional - để giữ history)",
          stream: "boolean (optional)",
        },
      },
    };

    res.json({ success: true, data: code });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
