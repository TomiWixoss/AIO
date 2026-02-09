# 🏗️ KIẾN TRÚC DỰ ÁN AIO-LLM

## 📋 Tổng quan

AIO-LLM Framework được thiết kế theo kiến trúc modular, dễ mở rộng và bảo trì. Dự án sử dụng TypeScript với ES2022 modules.

---

## 📁 Cấu trúc thư mục

```
aio-llm/
├── src/                          # Source code
│   ├── aio.ts                    # Main AIO class (284 lines)
│   ├── types.ts                  # TypeScript type definitions
│   ├── index.ts                  # Public exports
│   │
│   ├── core/                     # Core logic modules
│   │   ├── auto-mode.ts          # Auto fallback logic
│   │   ├── direct-mode.ts        # Direct mode with retry
│   │   └── stream-handler.ts     # Streaming logic
│   │
│   ├── providers/                # Provider implementations
│   │   ├── base.ts               # Abstract base provider
│   │   ├── openrouter.ts         # OpenRouter integration
│   │   ├── groq.ts               # Groq integration
│   │   ├── cerebras.ts           # Cerebras integration
│   │   └── google-ai.ts          # Google AI integration
│   │
│   └── utils/                    # Utility modules
│       ├── logger.ts             # Winston logger
│       ├── retry.ts              # Retry logic with backoff
│       ├── validation.ts         # Zod schemas
│       ├── key-manager.ts        # API key management
│       ├── message-converter.ts  # Message format conversion
│       └── abort-manager.ts      # Abort controller manager
│
├── examples/                     # Example usage
│   ├── basic.ts                  # Basic usage
│   ├── auto-mode.ts              # Auto mode example
│   ├── priority.ts               # Priority management
│   ├── streaming.ts              # Streaming example
│   └── test-*.ts                 # Test files
│
├── dist/                         # Compiled JavaScript (generated)
├── docs/                         # Documentation
├── node_modules/                 # Dependencies
│
├── package.json                  # NPM package config
├── tsconfig.json                 # TypeScript config
├── .env                          # Environment variables (gitignored)
├── .env.example                  # Example env file
├── .gitignore                    # Git ignore rules
└── README.md                     # Main documentation
```

---

## 🎯 Kiến trúc tổng quan

### 1. Layered Architecture

```
┌─────────────────────────────────────────┐
│         Application Layer               │
│    (User code using AIO class)          │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│          Core Layer                     │
│  ┌─────────────────────────────────┐   │
│  │      AIO Main Class             │   │
│  │  - Config management            │   │
│  │  - Provider orchestration       │   │
│  │  - Public API                   │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│        Business Logic Layer             │
│  ┌──────────────┐  ┌─────────────────┐ │
│  │  Auto Mode   │  │  Direct Mode    │ │
│  │  Handler     │  │  Handler        │ │
│  └──────────────┘  └─────────────────┘ │
│  ┌──────────────────────────────────┐  │
│  │     Stream Handler               │  │
│  └──────────────────────────────────┘  │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│        Provider Layer                   │
│  ┌──────────┐ ┌──────────┐ ┌─────────┐ │
│  │OpenRouter│ │   Groq   │ │Cerebras │ │
│  └──────────┘ └──────────┘ └─────────┘ │
│  ┌──────────────────────────────────┐  │
│  │        Google AI                 │  │
│  └──────────────────────────────────┘  │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│         Utility Layer                   │
│  ┌────────┐ ┌────────┐ ┌────────────┐  │
│  │ Logger │ │ Retry  │ │ Validation │  │
│  └────────┘ └────────┘ └────────────┘  │
│  ┌────────────┐ ┌──────────────────┐   │
│  │Key Manager │ │ Abort Manager    │   │
│  └────────────┘ └──────────────────┘   │
└─────────────────────────────────────────┘
```

---

## 🔧 Chi tiết các module

### 1. AIO Main Class (`src/aio.ts`)

**Trách nhiệm:**
- Khởi tạo và quản lý configuration
- Orchestrate providers và models
- Expose public API
- Validate config và requests
- Route requests đến handlers phù hợp

**Key methods:**
- `constructor(config)`: Khởi tạo với validation
- `chatCompletion()`: Non-streaming chat
- `chatCompletionStream()`: Streaming chat
- `getKeyStats()`: Lấy thống kê keys
- `resetDailyCounters()`: Reset daily usage
- `getConfigSummary()`: Lấy tóm tắt config

**Dependencies:**
- Core handlers (auto-mode, direct-mode, stream-handler)
- Provider instances
- Validation schemas
- Logger

### 2. Core Handlers

#### Auto Mode Handler (`src/core/auto-mode.ts`)

**Trách nhiệm:**
- Tự động chọn provider/model theo priority
- Fallback khi provider/model fail
- Track fallback history

**Logic flow:**
```
1. Sort providers by priority (cao → thấp)
2. For each provider:
   3. Sort models by priority (cao → thấp)
   4. For each model:
      5. Try chatCompletion()
      6. If success → return với fallback info
      7. If fail → classify error
      8. If retryable → continue to next
      9. If not retryable → throw error
10. If all exhausted → throw AIOError
```

#### Direct Mode Handler (`src/core/direct-mode.ts`)

**Trách nhiệm:**
- Execute request với provider/model cụ thể
- Retry với exponential backoff
- Key rotation khi cần

**Logic flow:**
```
1. Get sorted API keys by priority
2. For each key:
   3. Try chatCompletion() với retry logic
   4. If success → increment usage, return
   5. If fail → classify error
   6. If should rotate → continue to next key
   7. If not retryable → throw error
8. If all keys failed → throw AIOError
```

#### Stream Handler (`src/core/stream-handler.ts`)

**Trách nhiệm:**
- Handle streaming responses
- Auto fallback cho streaming
- Abort signal support

**Logic flow:**
```
1. Create Readable stream
2. Create mock Response object
3. Setup abort listener
4. Call provider.streamChatCompletion()
5. Stream chunks to Readable
6. Handle errors và cleanup
```

### 3. Provider Layer

#### Base Provider (`src/providers/base.ts`)

Abstract class định nghĩa interface cho tất cả providers:

```typescript
abstract class BaseProvider {
  abstract readonly name: Provider;
  
  abstract chatCompletion(
    request: ChatCompletionRequest,
    apiKey: string
  ): Promise<ChatCompletionResponse>;
  
  abstract streamChatCompletion(
    request: ChatCompletionRequest,
    res: Response,
    apiKey: string
  ): Promise<void>;
}
```

#### OpenRouter Provider (`src/providers/openrouter.ts`)

**Đặc điểm:**
- Sử dụng OpenAI SDK
- Base URL: `https://openrouter.ai/api/v1`
- System prompt trong messages array
- Hỗ trợ reasoning models
- Convert multimodal → text only

#### Groq Provider (`src/providers/groq.ts`)

**Đặc điểm:**
- Sử dụng Groq SDK
- Base URL: `https://api.groq.com/openai/v1`
- System prompt trong messages array
- Fast inference speed

#### Cerebras Provider (`src/providers/cerebras.ts`)

**Đặc điểm:**
- Sử dụng OpenAI SDK
- Base URL: `https://api.cerebras.ai/v1`
- System prompt trong messages array
- Cost-effective

#### Google AI Provider (`src/providers/google-ai.ts`)

**Đặc điểm:**
- Sử dụng @google/genai SDK
- Role mapping: assistant → model
- System prompt qua systemInstruction
- Multimodal support (images, video, audio, PDF)
- Response format: responseMimeType + responseSchema

**Message conversion:**
```typescript
// Input (AIO format)
{
  role: "user",
  content: [
    { type: "text", text: "Describe" },
    { type: "image", source: {...} }
  ]
}

// Output (Google AI format)
{
  role: "user",
  parts: [
    { text: "Describe" },
    { inlineData: { mimeType: "image/jpeg", data: "..." } }
  ]
}
```

### 4. Utility Layer

#### Logger (`src/utils/logger.ts`)

**Trách nhiệm:**
- Winston logger với multiple transports
- Log levels: error, warn, info, debug
- Structured logging với metadata

**Configuration:**
```typescript
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" }),
  ],
});
```

#### Retry Logic (`src/utils/retry.ts`)

**Trách nhiệm:**
- Exponential backoff retry
- Error classification
- Configurable retry patterns

**Algorithm:**
```
delay = baseDelay × (backoffMultiplier ^ (attempt - 1))

Example với baseDelay=1000ms, multiplier=2:
- Attempt 1: 1000ms
- Attempt 2: 2000ms
- Attempt 3: 4000ms
```

#### Validation (`src/utils/validation.ts`)

**Trách nhiệm:**
- Zod schemas cho config và requests
- Type-safe validation
- Detailed error messages

**Schemas:**
- `AIOConfigSchema`: Validate AIO config
- `ChatCompletionRequestSchema`: Validate requests
- `MessageSchema`: Validate messages
- `ApiKeySchema`: Validate API keys
- `ModelConfigSchema`: Validate model configs

#### Key Manager (`src/utils/key-manager.ts`)

**Trách nhiệm:**
- Track key usage và errors
- Daily limit enforcement
- Auto-disable problematic keys
- Key statistics

**Features:**
- Priority-based key selection
- Usage tracking (requestsToday)
- Error tracking (errorCount)
- Auto-disable after 3 consecutive errors
- Daily counter reset

#### Abort Manager (`src/utils/abort-manager.ts`)

**Trách nhiệm:**
- Manage AbortControllers
- Cancel requests by ID
- Cleanup resources

**API:**
```typescript
const manager = new AbortManager();

// Create controller
const controller = manager.create("request-1");

// Cancel request
manager.cancel("request-1");

// Cleanup
manager.cleanup("request-1");
```

---

## 🔄 Data Flow

### Non-Streaming Request Flow

```
User Code
   ↓
AIO.chatCompletion(request)
   ↓
Validate request (Zod)
   ↓
Auto mode?
   ├─ Yes → AutoModeHandler.autoChatCompletion()
   │         ↓
   │      Loop providers by priority
   │         ↓
   │      Loop models by priority
   │         ↓
   │      DirectModeHandler.directChatCompletion()
   │
   └─ No → DirectModeHandler.directChatCompletion()
              ↓
           Get sorted API keys
              ↓
           Loop keys by priority
              ↓
           withRetry(() => {
              ↓
           provider.chatCompletion(request, key)
              ↓
           OpenAI/Groq/Cerebras/Google API
              ↓
           })
              ↓
           Success? → Increment usage → Return response
              ↓
           Fail? → Classify error → Rotate key or throw
```

### Streaming Request Flow

```
User Code
   ↓
AIO.chatCompletionStream(request)
   ↓
Auto mode?
   ├─ Yes → StreamHandler.autoStreamChatCompletion()
   │         ↓
   │      Loop providers/models
   │         ↓
   │      StreamHandler.directStreamChatCompletion()
   │
   └─ No → StreamHandler.directStreamChatCompletion()
              ↓
           Create Readable stream
              ↓
           Create mock Response object
              ↓
           Setup abort listener
              ↓
           withRetry(() => {
              ↓
           provider.streamChatCompletion(request, res, key)
              ↓
           Stream chunks → Readable stream
              ↓
           })
              ↓
           Return Readable stream to user
```

### Error Handling Flow

```
Error occurs
   ↓
AIOError.classify(error)
   ↓
Determine:
   - isRetryable
   - shouldRotateKey
   - category
   ↓
If retryable:
   ├─ Retry with exponential backoff
   └─ If shouldRotateKey → try next key
   ↓
If not retryable:
   └─ Throw error immediately
   ↓
If all attempts exhausted:
   └─ Throw AIOError with details
```

---

## 🎨 Design Patterns

### 1. Strategy Pattern

Mỗi provider là một strategy implementation của BaseProvider interface.

```typescript
interface BaseProvider {
  chatCompletion(...): Promise<Response>;
  streamChatCompletion(...): Promise<void>;
}

class OpenRouterProvider implements BaseProvider {...}
class GroqProvider implements BaseProvider {...}
class CerebrasProvider implements BaseProvider {...}
class GoogleAIProvider implements BaseProvider {...}
```

**Ưu điểm:**
- Dễ thêm provider mới
- Tách biệt logic của từng provider
- Testable

### 2. Factory Pattern

AIO class tạo và quản lý provider instances.

```typescript
class AIO {
  private providerInstances: Map<Provider, BaseProvider>;
  
  private initializeProviders() {
    this.providerInstances.set("openrouter", new OpenRouterProvider());
    this.providerInstances.set("groq", new GroqProvider());
    this.providerInstances.set("cerebras", new CerebrasProvider());
    this.providerInstances.set("google-ai", new GoogleAIProvider());
  }
}
```

### 3. Chain of Responsibility

Auto mode thử providers/models theo thứ tự priority.

```typescript
for (const provider of sortedProviders) {
  for (const model of sortedModels) {
    try {
      return await directChatCompletion(provider, model);
    } catch (error) {
      // Continue to next in chain
      continue;
    }
  }
}
```

### 4. Decorator Pattern

Retry logic wraps provider calls.

```typescript
await withRetry(
  () => provider.chatCompletion(request, key),
  { maxAttempts: 3, delayMs: 1000 }
);
```

### 5. Observer Pattern

Streaming sử dụng Node.js EventEmitter.

```typescript
stream.on("data", (chunk) => {...});
stream.on("end", () => {...});
stream.on("error", (error) => {...});
```

### 6. Singleton Pattern

Logger là singleton instance.

```typescript
// utils/logger.ts
export const logger = winston.createLogger({...});

// Sử dụng ở mọi nơi
import { logger } from "./utils/logger.js";
```

---

## 🔐 Security Considerations

### 1. API Key Management

- **Không hardcode keys**: Sử dụng environment variables
- **Rotation**: Tự động rotate keys khi fail
- **Rate limiting**: Daily limits để tránh abuse
- **Error tracking**: Disable keys sau nhiều errors

### 2. Input Validation

- **Zod schemas**: Validate tất cả inputs
- **Type safety**: TypeScript types
- **Sanitization**: Clean user inputs trước khi gửi

### 3. Error Handling

- **Không expose sensitive info**: Error messages không chứa API keys
- **Logging**: Log errors nhưng mask sensitive data
- **Graceful degradation**: Fallback khi errors

### 4. Abort Control

- **User control**: User có thể cancel requests
- **Timeout**: Implement timeouts để tránh hanging
- **Cleanup**: Proper cleanup khi abort

---

## 📊 Performance Optimization

### 1. Key Selection

- **Priority-based**: Chọn key tốt nhất trước
- **Usage-based**: Prefer less-used keys
- **Error-aware**: Avoid keys với nhiều errors

### 2. Retry Strategy

- **Exponential backoff**: Tránh overwhelm servers
- **Smart retry**: Chỉ retry retryable errors
- **Max attempts**: Giới hạn số lần retry

### 3. Streaming

- **Memory efficient**: Stream thay vì buffer toàn bộ
- **Real-time**: User thấy response ngay
- **Cancellable**: Có thể cancel giữa chừng

### 4. Caching (User implementation)

Framework không có built-in caching, nhưng user có thể implement:

```typescript
const cache = new Map();

async function getCachedResponse(prompt) {
  if (cache.has(prompt)) return cache.get(prompt);
  
  const response = await aio.chatCompletion({...});
  cache.set(prompt, response);
  return response;
}
```

---

## 🧪 Testing Strategy

### 1. Unit Tests

Test từng module riêng lẻ:

```typescript
// Test KeyManager
describe("KeyManager", () => {
  it("should select key with highest priority", () => {
    const keys = [
      { key: "key1", priority: 10 },
      { key: "key2", priority: 20 },
    ];
    const selected = KeyManager.getActiveKey(keys);
    expect(selected.key).toBe("key2");
  });
});
```

### 2. Integration Tests

Test tích hợp giữa các modules:

```typescript
// Test AIO với mock providers
describe("AIO Integration", () => {
  it("should fallback to next provider on error", async () => {
    const aio = new AIO({
      providers: [
        { provider: "groq", ... },
        { provider: "cerebras", ... },
      ],
      autoMode: true,
    });
    
    // Mock groq to fail
    // Expect cerebras to be used
  });
});
```

### 3. E2E Tests

Test với real API calls:

```typescript
// Test với real providers
describe("E2E Tests", () => {
  it("should complete chat with OpenRouter", async () => {
    const aio = new AIO({
      providers: [
        {
          provider: "openrouter",
          apiKeys: [{ key: process.env.OPENROUTER_API_KEY }],
          models: [{ modelId: "arcee-ai/trinity-large-preview:free" }],
        },
      ],
    });
    
    const response = await aio.chatCompletion({
      provider: "openrouter",
      model: "arcee-ai/trinity-large-preview:free",
      messages: [{ role: "user", content: "Hello" }],
    });
    
    expect(response.choices[0].message.content).toBeTruthy();
  });
});
```

---

## 🚀 Deployment

### 1. Build Process

```bash
# Install dependencies
npm install

# Build TypeScript → JavaScript
npm run build

# Output: dist/ folder
```

### 2. NPM Package

```json
{
  "name": "aio-llm",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "type": "module",
  "files": [
    "dist",
    "README.md",
    "LICENSE"
  ]
}
```

### 3. Environment Setup

```bash
# Production
NODE_ENV=production
OPENROUTER_API_KEY=sk-or-v1-xxxxx
GROQ_API_KEY=gsk_xxxxx
CEREBRAS_API_KEY=csk_xxxxx
GOOGLE_AI_API_KEY=AIzaSyxxxxx
```

### 4. Docker (Optional)

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist ./dist

CMD ["node", "dist/index.js"]
```

---

## 📈 Monitoring & Observability

### 1. Logging

```typescript
// Winston logger với multiple transports
logger.info("Request completed", {
  provider: "openrouter",
  model: "arcee-ai/trinity-large-preview:free",
  tokens: 150,
  duration: 1200,
});
```

### 2. Metrics

Track key metrics:

- **Request count**: Số requests per provider/model
- **Error rate**: Tỷ lệ errors
- **Latency**: Response time
- **Token usage**: Tokens consumed
- **Key usage**: Requests per key

### 3. Alerts

Setup alerts cho:

- High error rate (> 10%)
- Key approaching daily limit (> 80%)
- Slow response time (> 5s)
- All providers down

---

## 🔄 Extensibility

### Thêm Provider mới

1. Tạo file `src/providers/new-provider.ts`

```typescript
import { BaseProvider } from "./base.js";

export class NewProvider extends BaseProvider {
  readonly name = "new-provider";
  
  async chatCompletion(request, apiKey) {
    // Implementation
  }
  
  async streamChatCompletion(request, res, apiKey) {
    // Implementation
  }
}
```

2. Update `src/types.ts`

```typescript
type Provider = "openrouter" | "groq" | "cerebras" | "google-ai" | "new-provider";
```

3. Register trong `src/aio.ts`

```typescript
private initializeProviders() {
  this.providerInstances.set("new-provider", new NewProvider());
}
```

### Thêm Utility mới

1. Tạo file `src/utils/new-util.ts`

```typescript
export class NewUtil {
  static doSomething() {
    // Implementation
  }
}
```

2. Export trong `src/index.ts`

```typescript
export * from "./utils/new-util.js";
```

---

## 📚 Dependencies

### Production Dependencies

```json
{
  "@google/genai": "^1.34.0",      // Google AI SDK
  "groq-sdk": "^0.37.0",           // Groq SDK
  "openai": "^6.15.0",             // OpenAI SDK (cho OpenRouter, Cerebras)
  "winston": "^3.19.0",            // Logging
  "zod": "^4.3.6",                 // Validation
  "uuid": "^13.0.0",               // UUID generation
  "express": "^5.2.1"              // Response type (streaming)
}
```

### Dev Dependencies

```json
{
  "@types/node": "^25.0.3",        // Node.js types
  "@types/express": "^5.0.6",      // Express types
  "@types/uuid": "^10.0.0",        // UUID types
  "typescript": "^5.9.3",          // TypeScript compiler
  "tsx": "^4.21.0",                // TypeScript executor
  "dotenv": "^17.2.4"              // Environment variables
}
```

---

## 🎯 Future Enhancements

### 1. Additional Providers

- Anthropic (Claude)
- Cohere
- Mistral AI
- Hugging Face Inference API

### 2. Advanced Features

- **Caching layer**: Built-in response caching
- **Rate limiting**: Built-in rate limiter
- **Cost tracking**: Track costs per provider
- **Analytics**: Usage analytics dashboard
- **Webhooks**: Event notifications

### 3. Developer Experience

- **CLI tool**: Command-line interface
- **Web UI**: Configuration dashboard
- **Playground**: Test interface
- **Documentation site**: Interactive docs

### 4. Performance

- **Connection pooling**: Reuse HTTP connections
- **Request batching**: Batch multiple requests
- **Parallel requests**: Execute requests in parallel
- **Smart caching**: Intelligent cache invalidation

---

## 📝 Code Style & Conventions

### 1. Naming Conventions

- **Classes**: PascalCase (`AIO`, `BaseProvider`)
- **Functions**: camelCase (`chatCompletion`, `getKeyStats`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RETRIES`)
- **Interfaces**: PascalCase (`ChatCompletionRequest`)
- **Types**: PascalCase (`Provider`, `Message`)

### 2. File Organization

- **One class per file**: Mỗi file chứa một class chính
- **Grouped imports**: Group imports theo category
- **Export at bottom**: Export ở cuối file (hoặc index.ts)

### 3. TypeScript Best Practices

- **Strict mode**: Enable strict TypeScript
- **Type annotations**: Explicit types cho public APIs
- **Interfaces over types**: Prefer interfaces
- **Avoid any**: Sử dụng unknown thay vì any

### 4. Error Handling

- **Custom errors**: Sử dụng AIOError class
- **Error classification**: Classify errors properly
- **Meaningful messages**: Clear error messages
- **Stack traces**: Preserve stack traces

### 5. Documentation

- **JSDoc comments**: Document public APIs
- **README**: Comprehensive README
- **Examples**: Provide usage examples
- **Inline comments**: Explain complex logic

---

**Tài liệu này cung cấp cái nhìn tổng quan về kiến trúc và cấu trúc của AIO-LLM Framework. Để biết thêm chi tiết, xem source code và documentation khác.**
