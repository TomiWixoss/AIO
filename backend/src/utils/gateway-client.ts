import { config } from "../config/index.js";

const BASE_URL = config.services.gateway;

interface ChatResponse {
  id: string;
  choices: { message: { content: string } }[];
  usage?: { prompt_tokens: number; completion_tokens: number };
}

export async function chatCompletion(data: {
  provider: string;
  model: string;
  messages: { role: string; content: string }[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}): Promise<ChatResponse> {
  const res = await fetch(`${BASE_URL}/v1/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
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

export async function getModels(provider?: string) {
  const path = provider ? `/v1/models/${provider}` : "/v1/models";
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) {
    throw new Error("Failed to get models");
  }
  return res.json();
}
