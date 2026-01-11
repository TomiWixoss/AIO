// ============================================
// UNIFIED REQUEST/RESPONSE TYPES
// ============================================

export type Provider =
  | "openrouter"
  | "google-ai"
  | "groq"
  | "cerebras"
  | "auto";

export interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatCompletionRequest {
  provider: Provider;
  model: string;
  messages: Message[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  stream?: boolean;
  stop?: string[];
  tool_ids?: number[]; // IDs của tools từ DB
}

export interface ChatCompletionResponse {
  id: string;
  provider: Provider;
  model: string;
  choices: {
    index: number;
    message: Message;
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  created: number;
  // Auto mode info
  auto_selected?: {
    original_provider: string;
    original_model: string;
    fallback_count: number;
  };
}

export interface StreamChunk {
  id: string;
  provider: Provider;
  model: string;
  choices: {
    index: number;
    delta: {
      role?: string;
      content?: string;
    };
    finish_reason: string | null;
  }[];
}

export interface ModelInfo {
  id: string;
  provider: Provider;
  name: string;
  description?: string;
  context_length?: number;
  pricing?: {
    input: number;
    output: number;
  };
}

export interface ProviderConfig {
  name: Provider;
  baseUrl: string;
  apiKey: string;
  models: string[];
}
