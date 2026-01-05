import { Router } from "express";
import { dbGet, dbPost } from "../utils/db-client.js";
import { chatCompletion } from "../utils/gateway-client.js";

export const chatRoutes = Router();

interface Session {
  id: number;
  session_key: string;
  title: string;
}

interface Provider {
  id: number;
  name: string;
}

interface Model {
  id: number;
  model_id: string;
}

interface DBMessage {
  id: number;
  role: string;
  content: string;
}

// POST /chat - Main chat endpoint (no auth for web chatbot)
chatRoutes.post("/", async (req, res) => {
  try {
    const {
      session_key,
      provider,
      model,
      message,
      messages: clientMessages,
      system_prompt,
      temperature,
      max_tokens,
    } = req.body;

    // Hỗ trợ cả 2 format: message (single) hoặc messages (array)
    const userMessage =
      message || clientMessages?.[clientMessages.length - 1]?.content;

    if (!provider || !model || !userMessage) {
      return res
        .status(400)
        .json({ error: "provider, model, message required" });
    }

    // Get or create session
    let session: Session | null = null;
    let historyMessages: { role: string; content: string }[] = [];

    if (session_key) {
      session = await dbGet<Session>(`/chat-sessions/key/${session_key}`).catch(
        () => null
      );

      // Load history từ DB nếu có session
      if (session) {
        const dbMessages = await dbGet<DBMessage[]>(
          `/chat-messages/session/${session.id}`
        ).catch(() => []);
        historyMessages = dbMessages.map((m) => ({
          role: m.role as "user" | "assistant" | "system",
          content: m.content,
        }));
      }
    }

    if (!session) {
      const newKey = session_key || crypto.randomUUID();
      const created = await dbPost<{ id: number }>("/chat-sessions", {
        session_key: newKey,
        title: userMessage.slice(0, 50) || "New Chat",
      });
      session = { id: created.id, session_key: newKey, title: "" };
    }

    // Save user message to DB
    await dbPost("/chat-messages", {
      session_id: session.id,
      role: "user",
      content: userMessage,
    });

    // Build messages array for LLM
    const llmMessages: { role: string; content: string }[] = [];

    // 1. System prompt (nếu có)
    if (system_prompt) {
      llmMessages.push({ role: "system", content: system_prompt });
    }

    // 2. History từ DB
    llmMessages.push(...historyMessages);

    // 3. User message mới
    llmMessages.push({ role: "user", content: userMessage });

    // Call LLM Gateway với full history
    const response = await chatCompletion({
      provider,
      model,
      messages: llmMessages,
      temperature,
      max_tokens,
    });

    // Save assistant message
    const assistantContent = response.choices?.[0]?.message?.content;
    if (assistantContent) {
      // Get provider and model IDs from DB
      const providerData = await dbGet<Provider>(
        `/providers/name/${provider}`
      ).catch(() => null);
      const modelData = providerData
        ? await dbGet<Model>(
            `/models/provider/${providerData.id}/model/${encodeURIComponent(
              model
            )}`
          ).catch(() => null)
        : null;

      await dbPost("/chat-messages", {
        session_id: session.id,
        role: "assistant",
        content: assistantContent,
        provider_id: providerData?.id,
        model_id: modelData?.id,
      });

      // Log usage
      await dbPost("/usage-logs", {
        session_id: session.id,
        provider_id: providerData?.id,
        model_id: modelData?.id,
        prompt_tokens: response.usage?.prompt_tokens || 0,
        completion_tokens: response.usage?.completion_tokens || 0,
        status: "success",
      });
    }

    res.json({
      ...response,
      session_key: session.session_key,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /chat/sessions - Get all sessions (admin)
chatRoutes.get("/sessions", async (_req, res) => {
  try {
    const sessions = await dbGet("/chat-sessions");
    res.json(sessions);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /chat/sessions/:key - Get session with messages
chatRoutes.get("/sessions/:key", async (req, res) => {
  try {
    const session = await dbGet<Session>(
      `/chat-sessions/key/${req.params.key}`
    );
    const messages = await dbGet(`/chat-messages/session/${session.id}`);
    res.json({ ...session, messages });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
