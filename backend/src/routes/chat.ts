import { Router } from "express";
import { dbGet, dbPost } from "../utils/db-client.js";
import {
  chatCompletion,
  chatCompletionStream,
} from "../utils/gateway-client.js";
import { streamManager } from "../utils/stream-manager.js";

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

// Helper function để lưu assistant message
async function saveAssistantMessage(
  sessionId: number,
  content: string,
  provider: string,
  model: string
): Promise<void> {
  // Get provider and model IDs from DB
  const providerData = await dbGet<Provider>(
    `/providers/name/${provider}`
  ).catch(() => null);
  const modelData = providerData
    ? await dbGet<Model>(
        `/models/provider/${providerData.id}/model/${encodeURIComponent(model)}`
      ).catch(() => null)
    : null;

  await dbPost("/chat-messages", {
    session_id: sessionId,
    role: "assistant",
    content,
    provider_id: providerData?.id,
    model_id: modelData?.id,
  });
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
      stream = false,
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

    // 1. System prompt (nếu có) - PHẢI ĐẶT ĐẦU TIÊN
    if (system_prompt) {
      llmMessages.push({ role: "system", content: system_prompt });
    }

    // 2. History từ DB (không bao gồm system messages cũ)
    llmMessages.push(...historyMessages.filter((m) => m.role !== "system"));

    // 3. User message mới
    llmMessages.push({ role: "user", content: userMessage });

    // Handle streaming
    if (stream) {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      // Register stream với session_key và session info
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
          {
            provider,
            model,
            messages: llmMessages,
            temperature,
            max_tokens,
          },
          res,
          controller.signal,
          // Callback để track content
          (content) => {
            streamManager.appendContent(session.session_key, content);
          }
        );

        // Stream hoàn thành - lưu full content
        const fullContent = streamManager.getStreamedContent(
          session.session_key
        );
        if (fullContent) {
          await saveAssistantMessage(session.id, fullContent, provider, model);
        }
      } catch (error: any) {
        if (error.name === "AbortError") {
          // Stream was cancelled - lưu partial content
          const partialContent = streamManager.getStreamedContent(
            session.session_key
          );
          if (partialContent) {
            await saveAssistantMessage(
              session.id,
              partialContent + " [cancelled]",
              provider,
              model
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
      return;
    }

    // Non-streaming response - Register để có thể cancel
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
        {
          provider,
          model,
          messages: llmMessages,
          temperature,
          max_tokens,
        },
        controller.signal
      );

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
      if (error.name === "AbortError") {
        // Request was cancelled
        return res.status(499).json({
          error: "Request cancelled",
          cancelled: true,
        });
      }
      throw error;
    } finally {
      streamManager.unregister(session.session_key);
    }
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

// POST /chat/cancel/:sessionKey - Cancel active request
chatRoutes.post("/cancel/:sessionKey", async (req, res) => {
  try {
    const { sessionKey } = req.params;

    // Check if request exists
    if (!streamManager.isActive(sessionKey)) {
      return res.status(404).json({
        success: false,
        error: "No active request found for this session",
      });
    }

    // Get info before cancelling
    const requestInfo = streamManager.getRequestInfo(sessionKey);

    // Cancel the request - stream handler sẽ tự lưu content
    const cancelled = streamManager.cancel(sessionKey);

    if (cancelled) {
      res.json({
        success: true,
        message: "Request cancelled successfully",
        sessionKey,
        wasStreaming: requestInfo?.isStreaming || false,
      });
    } else {
      res.status(404).json({
        success: false,
        error: "Failed to cancel request",
      });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /chat/streams/active - Get all active requests (admin)
chatRoutes.get("/streams/active", async (_req, res) => {
  try {
    const activeRequests = streamManager.getActiveRequests();
    const requestsInfo = activeRequests.map((key: string) =>
      streamManager.getRequestInfo(key)
    );
    res.json({
      count: activeRequests.length,
      requests: requestsInfo,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /chat/messages/:messageId - Get message content by ID
chatRoutes.get("/messages/:messageId", async (req, res) => {
  try {
    const { messageId } = req.params;

    try {
      const message = await dbGet<DBMessage>(`/chat-messages/${messageId}`);

      res.json({
        id: message.id,
        role: message.role,
        content: message.content,
      });
    } catch (dbError: any) {
      // Database service trả về 404
      if (
        dbError.message?.includes("not found") ||
        dbError.message?.includes("Not found")
      ) {
        return res.status(404).json({ error: "Message not found" });
      }
      throw dbError;
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
