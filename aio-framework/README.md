# AIO

**All-In-One LLM Framework** - Multi-provider LLM integration với auto-fallback, priority management, multimodal support và structured outputs cho JavaScript/TypeScript.

## ✨ Tính năng

- 🔄 **Multi-Provider**: Hỗ trợ 4 providers (OpenRouter, Groq, Cerebras, Google AI)
- 🎯 **Priority Management**: Quản lý độ ưu tiên cho providers, models và API keys
- 🔁 **Auto Fallback**: Tự động chuyển sang provider/model khác khi fail
- 🔑 **Key Rotation**: Tự động thử các API keys khác khi key hiện tại fail
- 🖼️ **Multimodal Support**: Hỗ trợ images, video, audio, PDF (Google AI)
- 📊 **Structured Outputs**: JSON mode và JSON Schema validation
- 🛠️ **Tool Calling**: Text-based tool calling với streaming, validation, retry
- 🌊 **Streaming**: Hỗ trợ streaming responses với abort
- 🛑 **Abort Control**: Cancel requests bất kỳ lúc nào
- 💪 **TypeScript**: Full TypeScript support với type definitions
- 📝 **Logging & Validation**: Winston logger và Zod validation
- 🔄 **Retry Logic**: Exponential backoff retry với error classification

## 📦 Cài đặt

```bash
npm install aio
```

## 🚀 Quick Start

### 1. Basic Usage

```typescript
import { AIO } from "aio";

const aio = new AIO({
  providers: [
    {
      provider: "openrouter",
      apiKeys: [{ key: "sk-or-v1-xxx" }],
      models: [{ modelId: "arcee-ai/trinity-large-preview:free" }],
    },
  ],
});

const response = await aio.chatCompletion({
  provider: "openrouter",
  model: "arcee-ai/trinity-large-preview:free",
  messages: [{ role: "user", content: "Hello!" }],
});

console.log(response.choices[0].message.content);
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
await aio.streamChatCompletion(
  {
    provider: "openrouter",
    model: "arcee-ai/trinity-large-preview:free",
    messages: [{ role: "user", content: "Write a poem" }],
  },
  (chunk) => {
    process.stdout.write(chunk.choices[0]?.delta?.content || "");
  },
  (error) => {
    if (error) console.error("Error:", error);
    else console.log("\nDone!");
  }
);
```

### 5. Multimodal Input (Google AI Only)

```typescript
// Image from base64
const response = await aio.chatCompletion({
  provider: "google-ai",
  model: "gemini-1.5-flash",
  messages: [
    {
      role: "user",
      content: [
        { type: "text", text: "Describe this image" },
        {
          type: "image",
          source: {
            type: "base64",
            media_type: "image/jpeg",
            data: "base64_encoded_image_data",
          },
        },
      ],
    },
  ],
});

// Image from URL
const response2 = await aio.chatCompletion({
  provider: "google-ai",
  model: "gemini-1.5-flash",
  messages: [
    {
      role: "user",
      content: [
        { type: "text", text: "What's in this image?" },
        {
          type: "image",
          source: {
            type: "url",
            media_type: "image/jpeg",
            url: "https://example.com/image.jpg",
          },
        },
      ],
    },
  ],
});

// PDF, Video, Audio
const response3 = await aio.chatCompletion({
  provider: "google-ai",
  model: "gemini-1.5-flash",
  messages: [
    {
      role: "user",
      content: [
        { type: "text", text: "Summarize this PDF" },
        {
          type: "file",
          source: {
            type: "base64",
            media_type: "application/pdf",
            data: "base64_encoded_pdf_data",
          },
        },
      ],
    },
  ],
});
```

### 6. Structured Outputs (JSON Mode)

```typescript
// JSON Object Mode
const response = await aio.chatCompletion({
  provider: "openrouter",
  model: "arcee-ai/trinity-large-preview:free",
  messages: [
    {
      role: "user",
      content: "Return a JSON with name, age, city for John, 25, New York",
    },
  ],
  response_format: { type: "json_object" },
});

const data = JSON.parse(response.choices[0].message.content);
console.log(data); // { name: "John", age: 25, city: "New York" }
```

### 7. Structured Outputs (JSON Schema)

```typescript
const response = await aio.chatCompletion({
  provider: "openrouter",
  model: "arcee-ai/trinity-large-preview:free",
  messages: [
    {
      role: "user",
      content: "Extract: iPhone 15 Pro - Great camera, expensive. Rating: 4.5/5",
    },
  ],
  response_format: {
    type: "json_schema",
    json_schema: {
      name: "product_review",
      strict: true,
      schema: {
        type: "object",
        properties: {
          product_name: { type: "string" },
          rating: { type: "number" },
          sentiment: {
            type: "string",
            enum: ["positive", "negative", "neutral"],
          },
          key_features: {
            type: "array",
            items: { type: "string" },
          },
        },
        required: ["product_name", "rating", "sentiment", "key_features"],
        additionalProperties: false,
      },
    },
  },
});

const data = JSON.parse(response.choices[0].message.content);
// Guaranteed to match schema!
```

### 8. System Prompt

```typescript
const response = await aio.chatCompletion({
  provider: "openrouter",
  model: "arcee-ai/trinity-large-preview:free",
  systemPrompt: "You are a helpful assistant that always responds in JSON format",
  messages: [{ role: "user", content: "What is 2+2?" }],
});
```

### 9. Advanced Parameters

```typescript
const response = await aio.chatCompletion({
  provider: "google-ai",
  model: "gemini-1.5-flash",
  messages: [{ role: "user", content: "Tell me a story" }],
  temperature: 0.7,
  max_tokens: 1000,
  top_p: 0.9,
  top_k: 40, // Only for Google AI and OpenRouter
  stop: ["END", "STOP"],
});
```

## 🛠️ Tool Calling (NEW in v1.0.1)

AIO Framework hỗ trợ **text-based tool calling** với streaming real-time. Framework tự động parse `[tool]...[/tool]` tags, validate parameters, retry on errors, và track execution metadata.

### Quick Start

```typescript
import { AIO } from "aio";

const aio = new AIO({
  providers: [
    {
      provider: "google-ai",
      apiKeys: [{ key: "your-api-key" }],
      models: [{ modelId: "gemini-flash-latest" }],
    },
  ],
});

// 1. Define tools
const tools = [
  {
    name: "get_weather",
    description: "Get current weather for a city",
    parameters: {
      city: {
        type: "string",
        description: "City name",
        required: true,
      },
      unit: {
        type: "string",
        description: "Temperature unit",
        required: false,
        enum: ["celsius", "fahrenheit"],
        default: "celsius", // Auto-applied if not provided
      },
    },
  },
];

// 2. Implement tool handler
async function handleToolCall(call) {
  console.log(`🔧 Calling: ${call.name}`, call.params);
  
  if (call.name === "get_weather") {
    // Your tool logic here
    return {
      temperature: 22,
      condition: "Sunny",
      unit: call.params.unit,
    };
  }
  
  throw new Error(`Unknown tool: ${call.name}`);
}

// 3. Start streaming with tools
const stream = await aio.chatCompletionStream({
  provider: "google-ai",
  model: "gemini-flash-latest",
  messages: [
    { role: "user", content: "What's the weather in Tokyo?" }
  ],
  tools,
  onToolCall: handleToolCall,
  maxToolIterations: 5, // Default: 5
});

// 4. Process events
stream.on("data", (chunk) => {
  const data = JSON.parse(chunk.toString().slice(6));
  
  if (data.tool_call) {
    // Tool call event: pending, executing, success, error
    console.log("Tool:", data.tool_call.type);
  } else if (data.choices[0].delta.content) {
    // Text content
    process.stdout.write(data.choices[0].delta.content);
  }
});

stream.on("end", () => console.log("\n✅ Done!"));
```

### Automatic Features

#### 1. Parameter Validation

Framework tự động validate:
- ✅ Required parameters
- ✅ Enum values
- ✅ Unknown parameters

```typescript
// Tool definition
{
  name: "set_temperature",
  parameters: {
    value: { type: "number", required: true },
    unit: { type: "string", enum: ["C", "F"], required: true }
  }
}

// AI calls with invalid enum
[tool]{"name": "set_temperature", "params": {"value": 25, "unit": "Kelvin"}}[/tool]

// Framework returns error
[tool_result]
Tool: set_temperature
Success: false
Error: Invalid value for unit. Must be one of: C, F
Suggestion: Check the tool definition and provide all required parameters.
[/tool_result]
```

#### 2. Default Values

```typescript
{
  parameters: {
    limit: { type: "number", default: 10 },
    unit: { type: "string", enum: ["celsius", "fahrenheit"], default: "celsius" }
  }
}

// AI calls without defaults
{"name": "search", "params": {"query": "test"}}

// Framework applies automatically
{"name": "search", "params": {"query": "test", "limit": 10}}
```

#### 3. Retry Logic

Framework automatically retries up to 3 times với exponential backoff:

```typescript
async function handleToolCall(call) {
  // Simulate transient error
  if (Math.random() < 0.5) {
    throw new Error("Temporary network error");
  }
  return { success: true };
}

// Framework retries:
// Attempt 1: Immediate
// Attempt 2: Wait 1s
// Attempt 3: Wait 2s
// Attempt 4: Wait 4s (max 5s)
```

#### 4. Execution Metadata

```typescript
[tool_result]
Tool: get_weather
Success: true
Data: {"temperature": 22, "condition": "Sunny"}
Execution Time: 1234ms
Retries: 1
[/tool_result]
```

### Multi-Step Tool Chaining

AI tự động chain tools để hoàn thành complex tasks:

```typescript
const tools = [
  {
    name: "search_docs",
    description: "Search documentation",
    parameters: {
      query: { type: "string", required: true }
    }
  },
  {
    name: "read_file",
    description: "Read file content",
    parameters: {
      path: { type: "string", required: true }
    }
  }
];

// User: "Find and read the authentication guide"

// AI automatically:
// 1. Calls search_docs → Gets file path
// 2. Calls read_file → Gets content
// 3. Answers question with content
```

### Tool Call Events

Framework emits SSE events cho mỗi tool call:

```typescript
// 1. Tool Call Pending
{
  "tool_call": {
    "type": "pending"
  }
}

// 2. Tool Call Executing
{
  "tool_call": {
    "type": "executing",
    "call": {
      "name": "get_weather",
      "params": {"city": "Tokyo", "unit": "celsius"}
    }
  }
}

// 3. Tool Call Success
{
  "tool_call": {
    "type": "success",
    "call": {...},
    "result": {
      "temperature": 22,
      "condition": "Sunny"
    }
  }
}

// 4. Tool Call Error
{
  "tool_call": {
    "type": "error",
    "call": {...},
    "error": "Weather API temporarily unavailable"
  }
}
```

### Advanced Tool Definition

```typescript
{
  name: "search_database",
  description: "Search database with filters",
  parameters: {
    query: {
      type: "string",
      description: "Search query",
      required: true,
    },
    limit: {
      type: "number",
      description: "Max results",
      required: false,
      default: 10, // Auto-applied
    },
    sort_by: {
      type: "string",
      description: "Sort field",
      required: false,
      enum: ["date", "relevance", "popularity"], // Validated
      default: "relevance",
    },
    filters: {
      type: "object",
      description: "Additional filters",
      required: false,
    },
  },
  requireReasoning: true, // Force AI to explain why calling this tool
}
```

### Configuration

```typescript
const stream = await aio.chatCompletionStream({
  messages: [...],
  tools: [...],
  onToolCall: handleToolCall,
  maxToolIterations: 10, // Default: 5 (max tool call loops)
  signal: abortController.signal, // Cancel anytime
});
```

### Best Practices

1. **Force Reasoning** - Require explanation parameter:
```typescript
{
  name: "delete_file",
  parameters: {
    path: { type: "string", required: true },
    reasoning: { 
      type: "string", 
      description: "Explain why you need to delete this file",
      required: true 
    }
  }
}
```

2. **Clear Descriptions** - Be specific:
```typescript
// ✅ Good
description: "Search codebase for function definitions matching the query"

// ❌ Bad
description: "Search stuff"
```

3. **Use Enums** - Prevent invalid values:
```typescript
{
  sort_by: {
    type: "string",
    enum: ["date", "relevance", "popularity"],
    default: "relevance"
  }
}
```

4. **Provide Suggestions** - Help AI recover from errors:
```typescript
async function handleToolCall(call) {
  if (call.name === "read_file") {
    if (!fs.existsSync(call.params.path)) {
      throw new Error(
        `File not found: ${call.params.path}. ` +
        `Did you mean: ${suggestSimilarFiles(call.params.path).join(", ")}?`
      );
    }
  }
}
```

### Documentation

- 📖 [Tool Calling User Guide](./docs/TOOL-CALLING.md) - Detailed usage guide
- 🏗️ [Tool Calling Architecture](./docs/TOOL-CALLING-ARCHITECTURE.md) - Architecture comparison với Cursor, OpenAI
- 📝 [Tool Calling History](./docs/TOOL-CALLING-HISTORY.md) - How AI remembers tool calls and results
- 💡 [Improvements Summary](./docs/IMPROVEMENTS.md) - What's new and why

### Examples

- `examples/tool-test-simple.ts` - Basic tool calling
- `examples/tool-calling.ts` - Complex multi-tool example
- `examples/tool-test-validation.ts` - Validation & retry example
- `examples/tool-test-history.ts` - History management demonstration

### Comparison with Native Function Calling

| Feature | AIO Text-based | OpenAI Function Calling |
|---------|----------------|-------------------------|
| **Provider Support** | ✅ Any LLM | ❌ OpenAI, Anthropic only |
| **Streaming** | ✅ Yes (only) | ✅ Yes |
| **Validation** | ✅ Built-in | ✅ JSON Schema |
| **Retry** | ✅ Automatic (3x) | ❌ Manual |
| **Metadata** | ✅ Execution time, retry count | ❌ No |
| **Default Values** | ✅ Automatic | ❌ Manual |
| **Format** | Text tags | Native API |

---

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


## 🛑 Abort/Cancel Requests

### Cancel Non-Streaming Request

```typescript
const controller = new AbortController();

// Cancel after 5 seconds
setTimeout(() => controller.abort(), 5000);

try {
  const response = await aio.chatCompletion({
    provider: "openrouter",
    model: "openrouter/pony-alpha",
    messages: [{ role: "user", content: "Long task..." }],
    signal: controller.signal, // Pass abort signal
  });
} catch (error) {
  if (error.message.includes("cancel")) {
    console.log("Request was cancelled");
  }
}
```

### Cancel Streaming Request

```typescript
const controller = new AbortController();

const stream = await aio.chatCompletionStream({
  provider: "openrouter",
  model: "openrouter/pony-alpha",
  messages: [{ role: "user", content: "Count to 100" }],
  signal: controller.signal,
});

let chunks = 0;
for await (const chunk of stream) {
  chunks++;
  if (chunks >= 10) {
    controller.abort(); // Cancel after 10 chunks
    break;
  }
}
```

### Pre-cancelled Request

```typescript
const controller = new AbortController();
controller.abort(); // Cancel before calling

try {
  await aio.chatCompletion({
    provider: "openrouter",
    model: "openrouter/pony-alpha",
    messages: [{ role: "user", content: "Test" }],
    signal: controller.signal,
  });
} catch (error) {
  console.log("Request was pre-cancelled");
}
```

## 📊 Key Statistics

```typescript
// Get key stats for a provider
const stats = aio.getKeyStats("openrouter");
console.log(stats);
// {
//   total: 3,
//   active: 2,
//   disabled: 1,
//   totalUsage: 150,
//   totalErrors: 5
// }

// Reset daily counters (call this daily)
aio.resetDailyCounters();

// Get config summary
const summary = aio.getConfigSummary();
console.log(summary);
// {
//   providers: 2,
//   totalKeys: 5,
//   totalModels: 8,
//   autoMode: true,
//   maxRetries: 3
// }
```

## 🔧 Configuration Options

```typescript
interface AIOConfig {
  providers: ProviderConfig[];
  autoMode?: boolean; // Default: false
  maxRetries?: number; // Default: 3
  retryDelay?: number; // Default: 1000ms
  enableLogging?: boolean; // Default: true
  enableValidation?: boolean; // Default: true
}

interface ApiKey {
  key: string;
  priority?: number; // Higher = preferred (default: 0)
  isActive?: boolean; // Default: true
  dailyLimit?: number; // Max requests per day
  requestsToday?: number; // Current usage
  errorCount?: number; // Consecutive errors
  lastError?: string; // Last error message
  lastUsed?: Date; // Last usage timestamp
}
```

## 🎯 Error Classification

Framework tự động phân loại lỗi:

- **rate_limit**: Rate limit exceeded (retryable, rotate key)
- **auth**: Authentication failed (not retryable, rotate key)
- **invalid_request**: Bad request (not retryable, don't rotate)
- **server**: Server error 5xx (retryable, don't rotate)
- **network**: Network timeout (retryable, don't rotate)
- **unknown**: Unknown error

```typescript
const errorInfo = AIOError.classify(error);
console.log(errorInfo);
// {
//   isRetryable: true,
//   shouldRotateKey: true,
//   category: "rate_limit"
// }
```

## 📁 Project Structure

```
aio-framework/
├── src/
│   ├── aio.ts                 # Main AIO class (284 lines)
│   ├── types.ts               # TypeScript types
│   ├── index.ts               # Public exports
│   ├── core/                  # Core logic modules
│   │   ├── auto-mode.ts       # Auto fallback logic
│   │   ├── direct-mode.ts     # Direct mode with retry
│   │   └── stream-handler.ts  # Streaming logic
│   ├── providers/             # Provider implementations
│   │   ├── base.ts
│   │   ├── openrouter.ts
│   │   ├── groq.ts
│   │   ├── cerebras.ts
│   │   └── google-ai.ts
│   └── utils/                 # Utilities
│       ├── logger.ts          # Winston logger
│       ├── retry.ts           # Retry logic
│       ├── validation.ts      # Zod schemas
│       ├── key-manager.ts     # Key management
│       └── abort-manager.ts   # Abort controller manager
└── examples/
    ├── basic.ts
    ├── streaming.ts
    ├── auto-mode.ts
    ├── priority.ts
    ├── test-simple.ts
    ├── test-new-features.ts
    └── test-abort-simple.ts
```

## 🧪 Testing

```bash
# Simple test
npm run build
npx tsx examples/test-simple.ts

# Test all new features
npx tsx examples/test-new-features.ts

# Test abort functionality
npx tsx examples/test-abort-simple.ts
```

## 📝 License

MIT
