/**
 * AIO Framework Types
 * All-In-One LLM Framework for multi-provider integration
 */

export type Provider = "openrouter" | "groq" | "cerebras" | "google-ai";

export interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ApiKey {
  key: string;
  priority?: number; // Cao hơn = ưu tiên hơn (default: 0)
  isActive?: boolean; // Default: true
  dailyLimit?: number; // Giới hạn request/ngày
  requestsToday?: number; // Số request đã dùng hôm nay
}

export interface ModelConfig {
  modelId: string; // Model ID từ provider (vd: "gpt-4", "claude-3-opus")
  priority?: number; // Cao hơn = ưu tiên hơn (default: 0)
  isActive?: boolean; // Default: true
}

export interface ProviderConfig {
  provider: Provider;
  apiKeys: ApiKey[]; // Danh sách API keys với priority
  models: ModelConfig[]; // Danh sách models với priority
  priority?: number; // Priority của provider (default: 0)
  isActive?: boolean; // Default: true
}

export interface AIOConfig {
  providers: ProviderConfig[];
  autoMode?: boolean; // Tự động chọn provider/model theo priority (default: false)
  maxRetries?: number; // Số lần retry tối đa (default: 3)
  retryDelay?: number; // Delay giữa các retry (ms) (default: 1000)
}

export interface ChatCompletionRequest {
  messages: Message[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  stream?: boolean;
  stop?: string[];
  
  // Chế độ chỉ định cụ thể
  provider?: Provider; // Chỉ định provider cụ thể
  model?: string; // Chỉ định model cụ thể
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
  
  // Thông tin fallback (nếu có)
  auto_fallback?: {
    original_provider: string;
    original_model: string;
    final_provider: string;
    final_model: string;
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

export class AIOError extends Error {
  constructor(
    message: string,
    public provider?: Provider,
    public model?: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = "AIOError";
  }
}
