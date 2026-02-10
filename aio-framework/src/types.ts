/**
 * AIO Framework Types
 * All-In-One LLM Framework for multi-provider integration
 */

export type Provider = "openrouter" | "groq" | "cerebras" | "google-ai";

export interface Message {
  role: "system" | "user" | "assistant";
  content: string | MessageContent[]; // Hỗ trợ multimodal cho Google AI
}

// Multimodal content types (CHỈ cho Google AI)
export type MessageContent = TextContent | ImageContent | FileContent;

export interface TextContent {
  type: "text";
  text: string;
}

export interface ImageContent {
  type: "image";
  source: {
    type: "base64" | "url";
    media_type: string; // MIME type: image/jpeg, image/png, image/webp
    data?: string; // base64 string (nếu type = "base64")
    url?: string; // URL (nếu type = "url")
  };
}

export interface FileContent {
  type: "file";
  source: {
    type: "base64" | "url";
    media_type: string; // MIME type: video/mp4, audio/mp3, application/pdf, etc.
    data?: string; // base64 string (nếu type = "base64")
    url?: string; // URL (nếu type = "url")
  };
}

export interface ApiKey {
  key: string;
  priority?: number; // Cao hơn = ưu tiên hơn (default: 0)
  isActive?: boolean; // Default: true
  dailyLimit?: number; // Giới hạn request/ngày
  requestsToday?: number; // Số request đã dùng hôm nay
  errorCount?: number; // Số lỗi liên tiếp
  lastError?: string; // Lỗi gần nhất
  lastUsed?: Date; // Lần sử dụng cuối
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
  enableLogging?: boolean; // Bật/tắt logging (default: true)
  enableValidation?: boolean; // Bật/tắt validation (default: true)
}

export interface ChatCompletionRequest {
  messages: Message[];
  systemPrompt?: string; // System prompt - sẽ tự động convert cho từng provider
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  top_k?: number; // Top-K sampling (chỉ OpenRouter và Google AI hỗ trợ)
  stream?: boolean;
  stop?: string[];
  
  // JSON Response Format
  response_format?: ResponseFormat;
  
  // Tool calling support (streaming only)
  tools?: ToolDefinition[];
  onToolCall?: ToolCallHandler;
  maxToolIterations?: number; // Default: 5
  
  // Chế độ chỉ định cụ thể
  provider?: Provider; // Chỉ định provider cụ thể
  model?: string; // Chỉ định model cụ thể
  
  // Abort signal để cancel request
  signal?: AbortSignal;
}

// Response format types
export type ResponseFormat =
  | { type: "text" } // Default - plain text
  | { type: "json_object" } // JSON mode - valid JSON without schema
  | {
      type: "json_schema"; // Structured outputs - JSON with schema validation
      json_schema: {
        name: string;
        strict?: boolean; // true = guaranteed schema compliance (OpenRouter, Groq, Cerebras)
        schema: Record<string, any>; // JSON Schema object
        description?: string;
      };
    };

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
  // Tool call events
  tool_call?: ToolCallEvent;
}

// Tool calling types
export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, ToolParameter>;
}

export interface ToolParameter {
  type: string;
  description: string;
  required?: boolean;
}

export interface ToolCall {
  name: string;
  params: Record<string, any>;
}

export interface ToolCallEvent {
  type: "pending" | "executing" | "success" | "error";
  call?: ToolCall;
  result?: any;
  error?: string;
}

export type ToolCallHandler = (call: ToolCall) => Promise<any>;

export class AIOError extends Error {
  constructor(
    message: string,
    public provider?: Provider,
    public model?: string,
    public statusCode?: number,
    public isRetryable: boolean = false
  ) {
    super(message);
    this.name = "AIOError";
  }

  /**
   * Classify error type
   */
  static classify(error: any): {
    isRetryable: boolean;
    shouldRotateKey: boolean;
    category: "rate_limit" | "auth" | "invalid_request" | "server" | "network" | "unknown";
  } {
    const msg = (error.message || String(error)).toLowerCase();

    // Rate limit errors
    if (msg.includes("rate") || msg.includes("429") || msg.includes("quota")) {
      return { isRetryable: true, shouldRotateKey: true, category: "rate_limit" };
    }

    // Auth errors
    if (
      msg.includes("auth") ||
      msg.includes("403") ||
      msg.includes("401") ||
      msg.includes("api key") ||
      msg.includes("unauthorized") ||
      msg.includes("permission")
    ) {
      return { isRetryable: false, shouldRotateKey: true, category: "auth" };
    }

    // Invalid request
    if (
      msg.includes("400") ||
      msg.includes("invalid") ||
      msg.includes("bad request")
    ) {
      return { isRetryable: false, shouldRotateKey: false, category: "invalid_request" };
    }

    // Server errors
    if (
      msg.includes("500") ||
      msg.includes("502") ||
      msg.includes("503") ||
      msg.includes("504")
    ) {
      return { isRetryable: true, shouldRotateKey: false, category: "server" };
    }

    // Network errors
    if (
      msg.includes("timeout") ||
      msg.includes("econnreset") ||
      msg.includes("network")
    ) {
      return { isRetryable: true, shouldRotateKey: false, category: "network" };
    }

    return { isRetryable: false, shouldRotateKey: false, category: "unknown" };
  }
}
