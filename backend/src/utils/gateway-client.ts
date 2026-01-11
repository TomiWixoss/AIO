import { config } from "../config/index.js";
import { Response } from "express";

const BASE_URL = config.services.gateway;

interface ChatResponse {
  id: string;
  choices: { message: { content: string } }[];
  usage?: { prompt_tokens: number; completion_tokens: number };
  auto_fallback?: {
    original_provider: string;
    original_model: string;
    final_provider: string;
    final_model: string;
    fallback_count: number;
  };
}

export async function chatCompletion(
  data: {
    provider: string;
    model: string;
    messages: { role: string; content: string }[];
    temperature?: number;
    max_tokens?: number;
    stream?: boolean;
    tool_ids?: number[];
    auto_mode?: boolean; // Chế độ auto fallback
  },
  signal?: AbortSignal
): Promise<ChatResponse> {
  const res = await fetch(`${BASE_URL}/v1/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    signal,
  });
  if (!res.ok) {
    const error = (await res
      .json()
      .catch(() => ({ error: res.statusText }))) as {
      error?: { message?: string };
    };
    throw new Error(error.error?.message || "Gateway request failed");
  }
  return res.json() as Promise<ChatResponse>;
}

export async function chatCompletionStream(
  data: {
    provider: string;
    model: string;
    messages: { role: string; content: string }[];
    temperature?: number;
    max_tokens?: number;
    tool_ids?: number[];
    auto_mode?: boolean; // Chế độ auto fallback
  },
  res: Response,
  signal?: AbortSignal,
  onChunk?: (content: string) => void
): Promise<void> {
  const gatewayRes = await fetch(`${BASE_URL}/v1/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...data, stream: true }),
    signal,
  });

  if (!gatewayRes.ok) {
    const error = (await gatewayRes
      .json()
      .catch(() => ({ error: gatewayRes.statusText }))) as {
      error?: { message?: string };
    };
    throw new Error(error.error?.message || "Gateway request failed");
  }

  // Pipe stream từ gateway về client
  if (!gatewayRes.body) {
    throw new Error("No response body");
  }

  const reader = gatewayRes.body.getReader();
  const decoder = new TextDecoder();

  try {
    while (true) {
      // Check if aborted
      if (signal?.aborted) {
        reader.cancel();
        throw new DOMException("Stream cancelled", "AbortError");
      }

      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      res.write(chunk);

      // Extract content from SSE chunks và call callback
      if (onChunk) {
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ") && !line.includes("[DONE]")) {
            try {
              const data = JSON.parse(line.slice(6));
              const content = data.choices?.[0]?.delta?.content;
              if (content) {
                onChunk(content);
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export async function getModels(provider?: string) {
  const path = provider ? `/v1/models/${provider}` : "/v1/models";
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) {
    throw new Error("Failed to get models");
  }
  return res.json();
}
