# AIO Framework

**All-In-One LLM Framework** - Multi-provider LLM integration với auto-fallback và priority management cho JavaScript/TypeScript.

## ✨ Tính năng

- 🔄 **Multi-Provider**: Hỗ trợ 4 providers (OpenRouter, Groq, Cerebras, Google AI)
- 🎯 **Priority Management**: Quản lý độ ưu tiên cho providers, models và API keys
- 🔁 **Auto Fallback**: Tự động chuyển sang provider/model khác khi fail
- 🔑 **Key Rotation**: Tự động thử các API keys khác khi key hiện tại fail
- 📊 **Flexible Modes**: 
  - **Auto Mode**: Tự động chọn provider/model theo priority
  - **Direct Mode**: Chỉ định cụ thể provider và model
- 🌊 **Streaming**: Hỗ trợ streaming responses
- 💪 **TypeScript**: Full TypeScript support với type definitions

## 📦 Cài đặt

```bash
npm install @aio/llm-framework
```

## 🚀 Quick Start

### 1. Basic Usage (Direct Mode)

```typescript
import { AIO } from "@aio/llm-framework";

const aio = new AIO({
  providers: [
    {
      provider: "groq",
      apiKeys: [{ key: "gsk_xxx" }],
      models: [{ modelId: "llama-3.3-70b-versatile" }],
    },
  ],
  autoMode: false,
});

const response = await aio.chatCompletion({
  provider: "groq",
  modelId: "llama-3.3-70b-versatile",
  messages: [
    { role: "user", content: "Hello!" },
  ],
});

console.log(response.content);
```

### 2. Auto Mode với Fallback

```typescript
const aio = new AIO({
  providers: [
    {
      provider: "groq",
      apiKeys: [{ key: "gsk_xxx" }],
      models: [{ modelId: "llama-3.3-70b-versatile" }],
      priority: 10, // Ưu tiên cao nhất
    },
    {
      provider: "cerebras",
      apiKeys: [{ key: "csk_xxx" }],
      models: [{ modelId: "llama3.1-8b" }],
      priority: 8, // Fallback
    },
  ],
  autoMode: true, // Bật auto mode
});

// Không cần chỉ định provider/model
const response = await aio.chatCompletion({
  messages: [
    { role: "user", content: "Hello!" },
  ],
});

// AIO tự động chọn Groq trước, nếu fail sẽ fallback sang Cerebras
```

### 3. Priority Management

```typescript
const aio = new AIO({
  providers: [
    {
      provider: "groq",
      apiKeys: [
        { key: "gsk_primary", priority: 100 }, // Key chính
        { key: "gsk_backup1", priority: 50 },  // Backup 1
        { key: "gsk_backup2", priority: 10 },  // Backup 2
      ],
      models: [
        { modelId: "llama-3.3-70b-versatile", priority: 100 }, // Model tốt nhất
        { modelId: "llama-3.1-8b-instant", priority: 50 },     // Model nhanh hơn
      ],
      priority: 100, // Provider priority
    },
  ],
  autoMode: true,
});

// AIO sẽ thử theo thứ tự:
// 1. groq:llama-3.3-70b-versatile với gsk_primary
// 2. Nếu fail → thử gsk_backup1
// 3. Nếu fail → thử gsk_backup2
// 4. Nếu fail → thử groq:llama-3.1-8b-instant
```

### 4. Streaming

```typescript
for await (const chunk of aio.chatCompletionStream({
  provider: "groq",
  modelId: "llama-3.3-70b-versatile",
  messages: [
    { role: "user", content: "Write a poem" },
  ],
})) {
  if (!chunk.done) {
    process.stdout.write(chunk.content);
  }
}
```

## 📚 API Reference

### `AIO` Class

#### Constructor

```typescript
new AIO(config: AIOConfig)
```

#### Methods

- `chatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse>`
- `chatCompletionStream(request: ChatCompletionRequest): AsyncGenerator<StreamChunk>`
- `validateApiKey(provider: Provider, apiKey: string): Promise<boolean>`

### Types

#### `AIOConfig`

```typescript
interface AIOConfig {
  providers: ProviderConfig[];
  autoMode?: boolean;        // Default: false
  maxRetries?: number;       // Default: 3
  retryDelay?: number;       // Default: 1000ms
}
```

#### `ProviderConfig`

```typescript
interface ProviderConfig {
  provider: Provider;        // "openrouter" | "groq" | "cerebras" | "google-ai"
  apiKeys: ApiKey[];
  models: ModelConfig[];
  priority?: number;         // Default: 0 (cao hơn = ưu tiên hơn)
  isActive?: boolean;        // Default: true
}
```

#### `ApiKey`

```typescript
interface ApiKey {
  key: string;
  priority?: number;         // Default: 0
  isActive?: boolean;        // Default: true
  dailyLimit?: number;
  requestsToday?: number;
}
```

#### `ModelConfig`

```typescript
interface ModelConfig {
  modelId: string;
  priority?: number;         // Default: 0
  isActive?: boolean;        // Default: true
}
```

#### `ChatCompletionRequest`

```typescript
interface ChatCompletionRequest {
  messages: Message[];
  temperature?: number;
  maxTokens?: number;
  
  // Direct mode
  provider?: Provider;
  modelId?: string;
}
```

## 🎯 Supported Providers

| Provider | Base URL | Models |
|----------|----------|--------|
| OpenRouter | https://openrouter.ai/api/v1 | 30+ free models |
| Groq | https://api.groq.com/openai/v1 | llama-3.3-70b, llama-3.1-8b, etc. |
| Cerebras | https://api.cerebras.ai/v1 | llama3.1-8b, llama3.1-70b |
| Google AI | https://generativelanguage.googleapis.com | gemini-1.5-flash, gemini-1.5-pro |

## 📖 Examples

Xem thêm examples trong thư mục `examples/`:

- `basic.ts` - Basic usage với direct mode
- `auto-mode.ts` - Auto mode với fallback
- `priority.ts` - Priority management
- `streaming.ts` - Streaming responses

Chạy examples:

```bash
npm run example:basic
npm run example:auto
npm run example:priority
```

## 🛠️ Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run examples
npm run dev
```

## 📄 License

MIT

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
