# 📚 HƯỚNG DẪN SỬ DỤNG AIO-LLM FRAMEWORK

## 📖 Mục lục

1. [Giới thiệu](#giới-thiệu)
2. [Cài đặt](#cài-đặt)
3. [Khởi tạo cơ bản](#khởi-tạo-cơ-bản)
4. [Các chế độ hoạt động](#các-chế-độ-hoạt-động)
5. [Tính năng nâng cao](#tính-năng-nâng-cao)
6. [API Reference](#api-reference)
7. [Examples](#examples)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 Giới thiệu

**AIO-LLM** (All-In-One LLM Framework) là một framework TypeScript/JavaScript mạnh mẽ giúp bạn tích hợp nhiều nhà cung cấp LLM (Large Language Model) một cách dễ dàng với các tính năng:

### ✨ Tính năng chính

- **Multi-Provider Support**: Hỗ trợ 4 providers phổ biến
  - OpenRouter (30+ free models)
  - Groq (llama-3.3-70b, llama-3.1-8b, etc.)
  - Cerebras (llama3.1-8b, llama3.1-70b)
  - Google AI (gemini-1.5-flash, gemini-1.5-pro)

- **Auto Fallback**: Tự động chuyển sang provider/model khác khi gặp lỗi
- **Priority Management**: Quản lý độ ưu tiên cho providers, models và API keys
- **Key Rotation**: Tự động thử các API keys khác khi key hiện tại fail
- **Multimodal Support**: Hỗ trợ images, video, audio, PDF (Google AI)
- **Structured Outputs**: JSON mode và JSON Schema validation
- **Streaming**: Real-time streaming responses
- **Abort Control**: Cancel requests bất kỳ lúc nào
- **Retry Logic**: Exponential backoff retry với error classification
- **Validation**: Zod schema validation cho config và requests
- **Logging**: Winston logger với multiple levels

---

## 📦 Cài đặt

```bash
npm install aio-llm
```

### Dependencies

Framework sử dụng các dependencies sau:

```json
{
  "@google/genai": "^1.34.0",
  "groq-sdk": "^0.37.0",
  "openai": "^6.15.0",
  "winston": "^3.19.0",
  "zod": "^4.3.6"
}
```

---

## 🚀 Khởi tạo cơ bản

### 1. Chuẩn bị API Keys

Tạo file `.env` trong thư mục gốc của project:

```env
# OpenRouter
OPENROUTER_API_KEY=sk-or-v1-xxxxx

# Groq
GROQ_API_KEY=gsk_xxxxx

# Cerebras
CEREBRAS_API_KEY=csk_xxxxx

# Google AI
GOOGLE_AI_API_KEY=AIzaSyxxxxx
```

### 2. Import và khởi tạo

```typescript
import { AIO } from "aio-llm";
import dotenv from "dotenv";

dotenv.config();

const aio = new AIO({
  providers: [
    {
      provider: "openrouter",
      apiKeys: [{ key: process.env.OPENROUTER_API_KEY }],
      models: [{ modelId: "arcee-ai/trinity-large-preview:free" }],
    },
  ],
});
```

### 3. Gửi request đầu tiên

```typescript
const response = await aio.chatCompletion({
  provider: "openrouter",
  model: "arcee-ai/trinity-large-preview:free",
  messages: [
    { role: "user", content: "Xin chào! Bạn là ai?" }
  ],
});

console.log(response.choices[0].message.content);
```

---

## 🎮 Các chế độ hoạt động

### 1. Direct Mode (Chế độ chỉ định cụ thể)

Chỉ định rõ provider và model bạn muốn sử dụng.

```typescript
const aio = new AIO({
  providers: [
    {
      provider: "groq",
      apiKeys: [{ key: process.env.GROQ_API_KEY }],
      models: [{ modelId: "llama-3.3-70b-versatile" }],
    },
  ],
  autoMode: false, // Mặc định là false
});

// Phải chỉ định provider và model
const response = await aio.chatCompletion({
  provider: "groq",
  model: "llama-3.3-70b-versatile",
  messages: [{ role: "user", content: "Hello!" }],
});
```

**Ưu điểm:**
- Kiểm soát hoàn toàn provider/model được sử dụng
- Phù hợp khi bạn muốn test một model cụ thể

**Nhược điểm:**
- Không có fallback tự động
- Phải handle errors manually

### 2. Auto Mode (Chế độ tự động)

Framework tự động chọn provider/model theo priority và fallback khi fail.

```typescript
const aio = new AIO({
  providers: [
    {
      provider: "groq",
      apiKeys: [{ key: process.env.GROQ_API_KEY }],
      models: [
        { modelId: "llama-3.3-70b-versatile", priority: 100 },
        { modelId: "llama-3.1-8b-instant", priority: 50 },
      ],
      priority: 100, // Groq ưu tiên cao nhất
    },
    {
      provider: "cerebras",
      apiKeys: [{ key: process.env.CEREBRAS_API_KEY }],
      models: [{ modelId: "llama3.1-8b", priority: 80 }],
      priority: 80, // Cerebras là fallback
    },
  ],
  autoMode: true, // Bật auto mode
});

// Không cần chỉ định provider/model
const response = await aio.chatCompletion({
  messages: [{ role: "user", content: "Hello!" }],
});

// Kiểm tra có fallback không
if (response.auto_fallback) {
  console.log("Đã fallback từ:", response.auto_fallback.original_provider);
  console.log("Sang:", response.auto_fallback.final_provider);
}
```

**Ưu điểm:**
- Tự động fallback khi provider/model fail
- Tối ưu reliability và uptime
- Không cần handle errors phức tạp

**Nhược điểm:**
- Ít kiểm soát hơn
- Có thể tốn thời gian nếu nhiều fallback

---

## 🔑 Priority Management

### Cách hoạt động của Priority

Priority càng cao = ưu tiên càng cao (số lớn hơn được thử trước).

Framework có 3 cấp độ priority:

1. **Provider Priority**: Chọn provider nào trước
2. **Model Priority**: Trong cùng provider, chọn model nào trước
3. **API Key Priority**: Trong cùng provider, chọn key nào trước

### Ví dụ Priority đầy đủ

```typescript
const aio = new AIO({
  providers: [
    {
      provider: "groq",
      priority: 100, // Provider priority cao nhất
      apiKeys: [
        { key: "gsk_primary", priority: 100 },   // Key chính
        { key: "gsk_backup1", priority: 50 },    // Backup 1
        { key: "gsk_backup2", priority: 10 },    // Backup 2
      ],
      models: [
        { modelId: "llama-3.3-70b-versatile", priority: 100 }, // Model tốt nhất
        { modelId: "llama-3.1-8b-instant", priority: 50 },     // Model nhanh hơn
      ],
    },
    {
      provider: "cerebras",
      priority: 80, // Fallback provider
      apiKeys: [{ key: "csk_key", priority: 100 }],
      models: [{ modelId: "llama3.1-8b", priority: 100 }],
    },
  ],
  autoMode: true,
});
```

**Thứ tự thử:**
1. groq:llama-3.3-70b-versatile với gsk_primary
2. Nếu fail → thử gsk_backup1
3. Nếu fail → thử gsk_backup2
4. Nếu fail → thử groq:llama-3.1-8b-instant
5. Nếu fail → thử cerebras:llama3.1-8b

---

## 🎨 Tính năng nâng cao

### 1. System Prompt

Thêm system prompt để định hướng behavior của AI.

```typescript
const response = await aio.chatCompletion({
  provider: "openrouter",
  model: "arcee-ai/trinity-large-preview:free",
  systemPrompt: "Bạn là một chuyên gia lập trình Python. Luôn trả lời bằng tiếng Việt.",
  messages: [
    { role: "user", content: "Giải thích list comprehension" }
  ],
});
```

**Lưu ý:**
- OpenRouter, Groq, Cerebras: System prompt được thêm vào messages array
- Google AI: System prompt được gửi qua `systemInstruction` parameter

### 2. Temperature và Sampling Parameters

Điều chỉnh tính sáng tạo và đa dạng của response.

```typescript
const response = await aio.chatCompletion({
  provider: "google-ai",
  model: "gemini-1.5-flash",
  messages: [{ role: "user", content: "Viết một câu chuyện ngắn" }],
  temperature: 0.9,    // 0.0-2.0, cao = sáng tạo hơn
  max_tokens: 500,     // Giới hạn độ dài response
  top_p: 0.95,         // Nucleus sampling (0.0-1.0)
  top_k: 40,           // Top-K sampling (chỉ Google AI và OpenRouter)
  stop: ["END", "---"], // Stop sequences
});
```

**Giải thích parameters:**

- **temperature**: Độ "sáng tạo"
  - 0.0-0.3: Deterministic, consistent (code, facts)
  - 0.4-0.7: Balanced (general chat)
  - 0.8-2.0: Creative, diverse (stories, brainstorming)

- **max_tokens**: Số tokens tối đa trong response
  - Tính cả input + output
  - Mỗi provider có giới hạn khác nhau

- **top_p**: Nucleus sampling
  - 0.9-1.0: Đa dạng hơn
  - 0.1-0.5: Tập trung hơn

- **top_k**: Top-K sampling (chỉ Google AI và OpenRouter)
  - Chọn từ top K tokens có xác suất cao nhất
  - 1-10: Rất tập trung
  - 40-100: Cân bằng

### 3. Streaming Responses

Nhận response theo real-time thay vì đợi hoàn thành.

```typescript
const stream = await aio.chatCompletionStream({
  provider: "groq",
  model: "llama-3.3-70b-versatile",
  messages: [
    { role: "user", content: "Viết một bài thơ về mùa thu" }
  ],
});

// Cách 1: Sử dụng event listeners
stream.on("data", (chunk) => {
  const text = chunk.toString();
  const lines = text.split("\n");
  
  for (const line of lines) {
    if (line.startsWith("data: ") && !line.includes("[DONE]")) {
      try {
        const data = JSON.parse(line.slice(6));
        const content = data.choices?.[0]?.delta?.content;
        if (content) {
          process.stdout.write(content);
        }
      } catch (e) {
        // Skip invalid JSON
      }
    }
  }
});

stream.on("end", () => {
  console.log("\n✅ Hoàn thành!");
});

stream.on("error", (error) => {
  console.error("❌ Lỗi:", error);
});

// Cách 2: Sử dụng for await...of
for await (const chunk of stream) {
  // Xử lý chunk tương tự như trên
}
```

**Ưu điểm của Streaming:**
- User experience tốt hơn (thấy response ngay lập tức)
- Phù hợp với long-form content
- Có thể cancel giữa chừng

### 4. Abort/Cancel Requests

Cancel request đang chạy bất kỳ lúc nào.

#### Cancel Non-Streaming Request

```typescript
const controller = new AbortController();

// Cancel sau 5 giây
setTimeout(() => {
  controller.abort();
  console.log("⏱️ Đã cancel request");
}, 5000);

try {
  const response = await aio.chatCompletion({
    provider: "openrouter",
    model: "arcee-ai/trinity-large-preview:free",
    messages: [{ role: "user", content: "Viết một bài luận dài..." }],
    signal: controller.signal, // Truyền abort signal
  });
} catch (error) {
  if (error.message.includes("cancel")) {
    console.log("✅ Request đã bị cancel thành công");
  }
}
```

#### Cancel Streaming Request

```typescript
const controller = new AbortController();

const stream = await aio.chatCompletionStream({
  provider: "groq",
  model: "llama-3.3-70b-versatile",
  messages: [{ role: "user", content: "Đếm từ 1 đến 1000" }],
  signal: controller.signal,
});

let chunks = 0;
for await (const chunk of stream) {
  chunks++;
  console.log(`Chunk ${chunks}`);
  
  if (chunks >= 10) {
    controller.abort(); // Cancel sau 10 chunks
    break;
  }
}
```

#### Pre-cancelled Request

```typescript
const controller = new AbortController();
controller.abort(); // Cancel trước khi gọi

try {
  await aio.chatCompletion({
    provider: "openrouter",
    model: "arcee-ai/trinity-large-preview:free",
    messages: [{ role: "user", content: "Test" }],
    signal: controller.signal,
  });
} catch (error) {
  console.log("Request đã bị cancel trước khi thực thi");
}
```

### 5. Multimodal Input (Chỉ Google AI)

Gửi images, video, audio, PDF cùng với text.

#### Image từ Base64

```typescript
import fs from "fs";

// Đọc image và convert sang base64
const imageBuffer = fs.readFileSync("./image.jpg");
const base64Image = imageBuffer.toString("base64");

const response = await aio.chatCompletion({
  provider: "google-ai",
  model: "gemini-1.5-flash",
  messages: [
    {
      role: "user",
      content: [
        { type: "text", text: "Mô tả hình ảnh này" },
        {
          type: "image",
          source: {
            type: "base64",
            media_type: "image/jpeg",
            data: base64Image,
          },
        },
      ],
    },
  ],
});
```

#### Image từ URL

```typescript
const response = await aio.chatCompletion({
  provider: "google-ai",
  model: "gemini-1.5-flash",
  messages: [
    {
      role: "user",
      content: [
        { type: "text", text: "Có gì trong hình này?" },
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
```

#### Video, Audio, PDF

```typescript
// Video
const response = await aio.chatCompletion({
  provider: "google-ai",
  model: "gemini-1.5-flash",
  messages: [
    {
      role: "user",
      content: [
        { type: "text", text: "Tóm tắt video này" },
        {
          type: "file",
          source: {
            type: "base64",
            media_type: "video/mp4",
            data: base64VideoData,
          },
        },
      ],
    },
  ],
});

// Audio
const response2 = await aio.chatCompletion({
  provider: "google-ai",
  model: "gemini-1.5-flash",
  messages: [
    {
      role: "user",
      content: [
        { type: "text", text: "Transcribe audio này" },
        {
          type: "file",
          source: {
            type: "base64",
            media_type: "audio/mp3",
            data: base64AudioData,
          },
        },
      ],
    },
  ],
});

// PDF
const response3 = await aio.chatCompletion({
  provider: "google-ai",
  model: "gemini-1.5-flash",
  messages: [
    {
      role: "user",
      content: [
        { type: "text", text: "Tóm tắt tài liệu PDF này" },
        {
          type: "file",
          source: {
            type: "base64",
            media_type: "application/pdf",
            data: base64PdfData,
          },
        },
      ],
    },
  ],
});
```

**Supported MIME types:**
- Images: `image/jpeg`, `image/png`, `image/webp`, `image/gif`
- Video: `video/mp4`, `video/mpeg`, `video/mov`, `video/avi`, `video/webm`
- Audio: `audio/mp3`, `audio/wav`, `audio/aac`, `audio/ogg`
- Documents: `application/pdf`

---

### 6. Structured Outputs (JSON Mode)

Bắt buộc AI trả về JSON format.

#### JSON Object Mode

Trả về valid JSON nhưng không có schema cụ thể.

```typescript
const response = await aio.chatCompletion({
  provider: "openrouter",
  model: "arcee-ai/trinity-large-preview:free",
  messages: [
    {
      role: "user",
      content: "Trả về thông tin: Tên: Nguyễn Văn A, Tuổi: 25, Thành phố: Hà Nội",
    },
  ],
  response_format: { type: "json_object" },
});

const data = JSON.parse(response.choices[0].message.content);
console.log(data);
// { "name": "Nguyễn Văn A", "age": 25, "city": "Hà Nội" }
```

**Lưu ý:**
- Phải nhắc AI trả về JSON trong prompt
- Không đảm bảo schema cụ thể
- Hỗ trợ: OpenRouter, Groq, Cerebras, Google AI

#### JSON Schema Mode

Trả về JSON theo schema cụ thể (structured outputs).

```typescript
const response = await aio.chatCompletion({
  provider: "openrouter",
  model: "arcee-ai/trinity-large-preview:free",
  messages: [
    {
      role: "user",
      content: "Phân tích review: iPhone 15 Pro - Camera tuyệt vời, giá hơi cao. Rating: 4.5/5",
    },
  ],
  response_format: {
    type: "json_schema",
    json_schema: {
      name: "product_review",
      strict: true, // Bắt buộc tuân thủ schema
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
          price_opinion: { type: "string" },
        },
        required: ["product_name", "rating", "sentiment", "key_features"],
        additionalProperties: false,
      },
    },
  },
});

const data = JSON.parse(response.choices[0].message.content);
console.log(data);
// {
//   "product_name": "iPhone 15 Pro",
//   "rating": 4.5,
//   "sentiment": "positive",
//   "key_features": ["Camera tuyệt vời"],
//   "price_opinion": "Giá hơi cao"
// }
```

**Ưu điểm:**
- Đảm bảo 100% tuân thủ schema
- Không cần validate response
- Type-safe khi parse

**Use cases:**
- Extract structured data từ text
- Form filling
- Data transformation
- API responses

**Hỗ trợ:**
- OpenRouter: ✅ (strict mode)
- Groq: ✅ (strict mode)
- Cerebras: ✅ (strict mode)
- Google AI: ✅ (responseSchema)

### 7. Conversation Memory

Duy trì context qua nhiều messages.

```typescript
const messages = [
  { role: "user", content: "Tên tôi là Minh" },
];

// Turn 1
let response = await aio.chatCompletion({
  provider: "openrouter",
  model: "arcee-ai/trinity-large-preview:free",
  messages,
});

messages.push({
  role: "assistant",
  content: response.choices[0].message.content,
});

// Turn 2
messages.push({
  role: "user",
  content: "Tên tôi là gì?",
});

response = await aio.chatCompletion({
  provider: "openrouter",
  model: "arcee-ai/trinity-large-preview:free",
  messages,
});

console.log(response.choices[0].message.content);
// "Tên bạn là Minh"
```

**Best practices:**
- Lưu toàn bộ conversation history
- Giới hạn số messages để tránh vượt token limit
- Có thể summarize old messages để tiết kiệm tokens

### 8. Key Management

Quản lý API keys với daily limits và error tracking.

#### Daily Limits

```typescript
const aio = new AIO({
  providers: [
    {
      provider: "openrouter",
      apiKeys: [
        {
          key: process.env.OPENROUTER_API_KEY,
          priority: 10,
          dailyLimit: 100, // Giới hạn 100 requests/ngày
          requestsToday: 0, // Số requests đã dùng hôm nay
        },
      ],
      models: [{ modelId: "arcee-ai/trinity-large-preview:free" }],
    },
  ],
});

// Sau mỗi request, requestsToday tự động tăng
// Khi đạt dailyLimit, key sẽ không được sử dụng nữa

// Reset daily counters (gọi mỗi ngày)
aio.resetDailyCounters();
```

#### Key Statistics

```typescript
// Lấy thống kê keys của một provider
const stats = aio.getKeyStats("openrouter");
console.log(stats);
// {
//   total: 3,           // Tổng số keys
//   active: 2,          // Số keys đang active
//   disabled: 1,        // Số keys bị disabled
//   totalUsage: 150,    // Tổng số requests đã dùng
//   totalErrors: 5      // Tổng số errors
// }
```

#### Config Summary

```typescript
const summary = aio.getConfigSummary();
console.log(summary);
// {
//   providers: 2,       // Số providers
//   totalKeys: 5,       // Tổng số API keys
//   totalModels: 8,     // Tổng số models
//   autoMode: true,     // Auto mode enabled?
//   maxRetries: 3       // Max retry attempts
// }
```

### 9. Error Handling và Retry Logic

Framework tự động classify errors và retry khi cần.

#### Error Classification

```typescript
import { AIOError } from "aio-llm";

try {
  const response = await aio.chatCompletion({
    provider: "openrouter",
    model: "arcee-ai/trinity-large-preview:free",
    messages: [{ role: "user", content: "Hello" }],
  });
} catch (error) {
  if (error instanceof AIOError) {
    const classification = AIOError.classify(error);
    
    console.log("Category:", classification.category);
    // "rate_limit" | "auth" | "invalid_request" | "server" | "network" | "unknown"
    
    console.log("Is Retryable:", classification.isRetryable);
    // true/false
    
    console.log("Should Rotate Key:", classification.shouldRotateKey);
    // true/false
  }
}
```

**Error Categories:**

| Category | Retryable | Rotate Key | Examples |
|----------|-----------|------------|----------|
| `rate_limit` | ✅ | ✅ | Rate limit exceeded, 429 |
| `auth` | ❌ | ✅ | Invalid API key, 401, 403 |
| `invalid_request` | ❌ | ❌ | Bad request, 400 |
| `server` | ✅ | ❌ | 500, 502, 503, 504 |
| `network` | ✅ | ❌ | Timeout, ECONNRESET |
| `unknown` | ❌ | ❌ | Other errors |

#### Retry Configuration

```typescript
const aio = new AIO({
  providers: [
    {
      provider: "openrouter",
      apiKeys: [{ key: process.env.OPENROUTER_API_KEY }],
      models: [{ modelId: "arcee-ai/trinity-large-preview:free" }],
    },
  ],
  maxRetries: 5,        // Số lần retry tối đa (default: 3)
  retryDelay: 2000,     // Delay giữa các retry (ms) (default: 1000)
});
```

**Retry Logic:**
- Exponential backoff: delay × 2^(attempt-1)
- Chỉ retry với retryable errors
- Tự động rotate key nếu cần

#### Custom Error Handling

```typescript
try {
  const response = await aio.chatCompletion({
    provider: "openrouter",
    model: "arcee-ai/trinity-large-preview:free",
    messages: [{ role: "user", content: "Hello" }],
  });
} catch (error) {
  if (error instanceof AIOError) {
    console.error("Provider:", error.provider);
    console.error("Model:", error.model);
    console.error("Status Code:", error.statusCode);
    console.error("Message:", error.message);
    
    // Handle specific errors
    if (error.statusCode === 429) {
      console.log("Rate limit - đợi 1 phút rồi thử lại");
    } else if (error.statusCode === 401) {
      console.log("API key không hợp lệ");
    }
  }
}
```

### 10. Logging

Framework sử dụng Winston logger với multiple levels.

#### Enable/Disable Logging

```typescript
const aio = new AIO({
  providers: [...],
  enableLogging: true, // Default: true
});
```

#### Log Levels

- **error**: Critical errors
- **warn**: Warnings (retry attempts, key rotation)
- **info**: General info (requests, responses)
- **debug**: Detailed debug info (key usage, etc.)

#### Custom Logger

```typescript
import { logger } from "aio-llm";

// Thay đổi log level
logger.level = "debug"; // "error" | "warn" | "info" | "debug"

// Custom log
logger.info("Custom message", { key: "value" });
```

---

## 📖 API Reference

### AIO Class

#### Constructor

```typescript
new AIO(config: AIOConfig)
```

**Parameters:**

```typescript
interface AIOConfig {
  providers: ProviderConfig[];      // Danh sách providers
  autoMode?: boolean;                // Auto fallback mode (default: false)
  maxRetries?: number;               // Max retry attempts (default: 3)
  retryDelay?: number;               // Delay between retries (ms) (default: 1000)
  enableLogging?: boolean;           // Enable Winston logging (default: true)
  enableValidation?: boolean;        // Enable Zod validation (default: true)
}
```

#### Methods

##### chatCompletion()

```typescript
async chatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse>
```

Gửi chat completion request (non-streaming).

**Parameters:**

```typescript
interface ChatCompletionRequest {
  messages: Message[];               // Conversation messages
  systemPrompt?: string;             // System prompt
  temperature?: number;              // 0.0-2.0 (default: 1.0)
  max_tokens?: number;               // Max output tokens
  top_p?: number;                    // Nucleus sampling (0.0-1.0)
  top_k?: number;                    // Top-K sampling (Google AI, OpenRouter)
  stop?: string[];                   // Stop sequences
  response_format?: ResponseFormat;  // JSON mode/schema
  provider?: Provider;               // Provider (required in direct mode)
  model?: string;                    // Model (required in direct mode)
  signal?: AbortSignal;              // Abort signal
}
```

**Returns:**

```typescript
interface ChatCompletionResponse {
  id: string;                        // Response ID
  provider: Provider;                // Provider used
  model: string;                     // Model used
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
  created: number;                   // Timestamp
  auto_fallback?: {                  // Fallback info (if occurred)
    original_provider: string;
    original_model: string;
    final_provider: string;
    final_model: string;
    fallback_count: number;
  };
}
```

##### chatCompletionStream()

```typescript
async chatCompletionStream(request: ChatCompletionRequest): Promise<Readable>
```

Gửi chat completion request (streaming).

**Returns:** Node.js Readable stream

**Stream format:**

```
data: {"id":"...","provider":"...","model":"...","choices":[{"index":0,"delta":{"content":"Hello"},"finish_reason":null}]}

data: {"id":"...","provider":"...","model":"...","choices":[{"index":0,"delta":{"content":" world"},"finish_reason":null}]}

data: [DONE]
```

##### getKeyStats()

```typescript
getKeyStats(provider: Provider): KeyStats | null
```

Lấy thống kê keys của một provider.

**Returns:**

```typescript
interface KeyStats {
  total: number;          // Tổng số keys
  active: number;         // Số keys active
  disabled: number;       // Số keys disabled
  totalUsage: number;     // Tổng requests đã dùng
  totalErrors: number;    // Tổng errors
}
```

##### resetDailyCounters()

```typescript
resetDailyCounters(): void
```

Reset daily counters cho tất cả keys (gọi mỗi ngày).

##### getConfigSummary()

```typescript
getConfigSummary(): ConfigSummary
```

Lấy tóm tắt configuration.

**Returns:**

```typescript
interface ConfigSummary {
  providers: number;      // Số providers
  totalKeys: number;      // Tổng số keys
  totalModels: number;    // Tổng số models
  autoMode: boolean;      // Auto mode enabled?
  maxRetries: number;     // Max retry attempts
}
```

### Types

#### Provider

```typescript
type Provider = "openrouter" | "groq" | "cerebras" | "google-ai";
```

#### Message

```typescript
interface Message {
  role: "system" | "user" | "assistant";
  content: string | MessageContent[];
}

type MessageContent = TextContent | ImageContent | FileContent;

interface TextContent {
  type: "text";
  text: string;
}

interface ImageContent {
  type: "image";
  source: {
    type: "base64" | "url";
    media_type: string;
    data?: string;
    url?: string;
  };
}

interface FileContent {
  type: "file";
  source: {
    type: "base64" | "url";
    media_type: string;
    data?: string;
    url?: string;
  };
}
```

#### ResponseFormat

```typescript
type ResponseFormat =
  | { type: "text" }                    // Plain text (default)
  | { type: "json_object" }             // Valid JSON
  | {
      type: "json_schema";              // Structured outputs
      json_schema: {
        name: string;
        strict?: boolean;
        schema: Record<string, any>;    // JSON Schema
        description?: string;
      };
    };
```

#### ProviderConfig

```typescript
interface ProviderConfig {
  provider: Provider;
  apiKeys: ApiKey[];
  models: ModelConfig[];
  priority?: number;        // Default: 0
  isActive?: boolean;       // Default: true
}
```

#### ApiKey

```typescript
interface ApiKey {
  key: string;
  priority?: number;        // Default: 0
  isActive?: boolean;       // Default: true
  dailyLimit?: number;      // Max requests/day
  requestsToday?: number;   // Current usage
  errorCount?: number;      // Consecutive errors
  lastError?: string;       // Last error message
  lastUsed?: Date;          // Last usage timestamp
}
```

#### ModelConfig

```typescript
interface ModelConfig {
  modelId: string;
  priority?: number;        // Default: 0
  isActive?: boolean;       // Default: true
}
```

#### AIOError

```typescript
class AIOError extends Error {
  constructor(
    message: string,
    public provider?: Provider,
    public model?: string,
    public statusCode?: number,
    public isRetryable: boolean = false
  );
  
  static classify(error: any): {
    isRetryable: boolean;
    shouldRotateKey: boolean;
    category: "rate_limit" | "auth" | "invalid_request" | "server" | "network" | "unknown";
  };
}
```

---

## 💡 Examples

### Example 1: Basic Chat

```typescript
import { AIO } from "aio-llm";

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
  messages: [
    { role: "user", content: "Giải thích AI là gì?" }
  ],
});

console.log(response.choices[0].message.content);
```

### Example 2: Multi-Provider với Auto Fallback

```typescript
const aio = new AIO({
  providers: [
    {
      provider: "groq",
      apiKeys: [{ key: process.env.GROQ_API_KEY }],
      models: [{ modelId: "llama-3.3-70b-versatile" }],
      priority: 100,
    },
    {
      provider: "cerebras",
      apiKeys: [{ key: process.env.CEREBRAS_API_KEY }],
      models: [{ modelId: "llama3.1-8b" }],
      priority: 80,
    },
    {
      provider: "google-ai",
      apiKeys: [{ key: process.env.GOOGLE_AI_API_KEY }],
      models: [{ modelId: "gemini-1.5-flash" }],
      priority: 60,
    },
  ],
  autoMode: true,
});

const response = await aio.chatCompletion({
  messages: [
    { role: "user", content: "Viết code Python để đọc file CSV" }
  ],
});

console.log(response.choices[0].message.content);
```

### Example 3: Streaming với Cancel

```typescript
const controller = new AbortController();

// Cancel sau 10 giây
setTimeout(() => controller.abort(), 10000);

const stream = await aio.chatCompletionStream({
  provider: "groq",
  model: "llama-3.3-70b-versatile",
  messages: [
    { role: "user", content: "Viết một câu chuyện dài" }
  ],
  signal: controller.signal,
});

for await (const chunk of stream) {
  // Process chunk
}
```

### Example 4: JSON Schema Extraction

```typescript
const response = await aio.chatCompletion({
  provider: "openrouter",
  model: "arcee-ai/trinity-large-preview:free",
  messages: [
    {
      role: "user",
      content: "Extract info: John Doe, 30 tuổi, Software Engineer tại Google, email: john@example.com",
    },
  ],
  response_format: {
    type: "json_schema",
    json_schema: {
      name: "person_info",
      strict: true,
      schema: {
        type: "object",
        properties: {
          name: { type: "string" },
          age: { type: "number" },
          job_title: { type: "string" },
          company: { type: "string" },
          email: { type: "string" },
        },
        required: ["name", "age", "job_title", "company", "email"],
        additionalProperties: false,
      },
    },
  },
});

const data = JSON.parse(response.choices[0].message.content);
console.log(data);
```

### Example 5: Image Analysis (Google AI)

```typescript
import fs from "fs";

const imageBuffer = fs.readFileSync("./photo.jpg");
const base64Image = imageBuffer.toString("base64");

const response = await aio.chatCompletion({
  provider: "google-ai",
  model: "gemini-1.5-flash",
  messages: [
    {
      role: "user",
      content: [
        { type: "text", text: "Mô tả chi tiết hình ảnh này" },
        {
          type: "image",
          source: {
            type: "base64",
            media_type: "image/jpeg",
            data: base64Image,
          },
        },
      ],
    },
  ],
});

console.log(response.choices[0].message.content);
```

### Example 6: Multi-Turn Conversation

```typescript
const messages = [];

// Turn 1
messages.push({
  role: "user",
  content: "Tôi muốn học lập trình. Nên bắt đầu từ đâu?",
});

let response = await aio.chatCompletion({
  provider: "openrouter",
  model: "arcee-ai/trinity-large-preview:free",
  messages,
});

messages.push({
  role: "assistant",
  content: response.choices[0].message.content,
});

// Turn 2
messages.push({
  role: "user",
  content: "Python hay JavaScript tốt hơn cho người mới?",
});

response = await aio.chatCompletion({
  provider: "openrouter",
  model: "arcee-ai/trinity-large-preview:free",
  messages,
});

console.log(response.choices[0].message.content);
```

---

## 🔧 Troubleshooting

### 1. "No API keys configured for provider"

**Nguyên nhân:** Không có API key nào được cấu hình cho provider.

**Giải pháp:**

```typescript
const aio = new AIO({
  providers: [
    {
      provider: "openrouter",
      apiKeys: [
        { key: process.env.OPENROUTER_API_KEY } // Đảm bảo key tồn tại
      ],
      models: [{ modelId: "arcee-ai/trinity-large-preview:free" }],
    },
  ],
});
```

### 2. "All API keys failed"

**Nguyên nhân:** Tất cả API keys đều fail (invalid, rate limit, etc.)

**Giải pháp:**

1. Kiểm tra API keys có hợp lệ không
2. Kiểm tra daily limits
3. Xem logs để biết lỗi cụ thể

```typescript
// Check key stats
const stats = aio.getKeyStats("openrouter");
console.log(stats);

// Reset daily counters nếu cần
aio.resetDailyCounters();
```

### 3. "All providers exhausted"

**Nguyên nhân:** Tất cả providers đều fail trong auto mode.

**Giải pháp:**

1. Kiểm tra network connection
2. Kiểm tra API keys của tất cả providers
3. Thử direct mode để debug

```typescript
// Thử từng provider riêng lẻ
const response = await aio.chatCompletion({
  provider: "openrouter",
  model: "arcee-ai/trinity-large-preview:free",
  messages: [{ role: "user", content: "Test" }],
});
```

### 4. "Invalid request"

**Nguyên nhân:** Request không hợp lệ (validation failed).

**Giải pháp:**

1. Kiểm tra messages không empty
2. Kiểm tra temperature trong range 0-2
3. Kiểm tra max_tokens > 0

```typescript
// Valid request
const response = await aio.chatCompletion({
  provider: "openrouter",
  model: "arcee-ai/trinity-large-preview:free",
  messages: [
    { role: "user", content: "Hello" } // Không được empty
  ],
  temperature: 0.7, // 0.0-2.0
  max_tokens: 100,  // > 0
});
```

### 5. Rate Limit Errors

**Nguyên nhân:** Vượt quá rate limit của provider.

**Giải pháp:**

1. Sử dụng multiple API keys với priority
2. Implement daily limits
3. Sử dụng auto mode để fallback

```typescript
const aio = new AIO({
  providers: [
    {
      provider: "openrouter",
      apiKeys: [
        { key: "key1", priority: 100, dailyLimit: 100 },
        { key: "key2", priority: 50, dailyLimit: 100 },
        { key: "key3", priority: 10, dailyLimit: 100 },
      ],
      models: [{ modelId: "arcee-ai/trinity-large-preview:free" }],
    },
  ],
});
```

### 6. Streaming Errors

**Nguyên nhân:** Stream bị disconnect hoặc error.

**Giải pháp:**

1. Handle stream errors properly
2. Implement retry logic
3. Use abort signal để cleanup

```typescript
const stream = await aio.chatCompletionStream({
  provider: "groq",
  model: "llama-3.3-70b-versatile",
  messages: [{ role: "user", content: "Hello" }],
});

stream.on("error", (error) => {
  console.error("Stream error:", error);
  // Retry hoặc fallback
});

stream.on("end", () => {
  console.log("Stream completed");
});
```

### 7. Multimodal Errors (Google AI)

**Nguyên nhân:** Format không đúng hoặc provider không hỗ trợ.

**Giải pháp:**

1. Chỉ sử dụng với Google AI
2. Kiểm tra MIME type hợp lệ
3. Kiểm tra base64 encoding đúng

```typescript
// Chỉ Google AI hỗ trợ multimodal
const response = await aio.chatCompletion({
  provider: "google-ai", // Phải là google-ai
  model: "gemini-1.5-flash",
  messages: [
    {
      role: "user",
      content: [
        { type: "text", text: "Describe image" },
        {
          type: "image",
          source: {
            type: "base64",
            media_type: "image/jpeg", // Valid MIME type
            data: base64String,       // Valid base64
          },
        },
      ],
    },
  ],
});
```

### 8. JSON Schema Errors

**Nguyên nhân:** Schema không hợp lệ hoặc AI không tuân thủ.

**Giải pháp:**

1. Sử dụng `strict: true` để bắt buộc tuân thủ
2. Kiểm tra schema hợp lệ (JSON Schema format)
3. Thử với model tốt hơn

```typescript
const response = await aio.chatCompletion({
  provider: "openrouter",
  model: "arcee-ai/trinity-large-preview:free",
  messages: [
    {
      role: "user",
      content: "Extract: Name: John, Age: 30",
    },
  ],
  response_format: {
    type: "json_schema",
    json_schema: {
      name: "person",
      strict: true, // Bắt buộc tuân thủ
      schema: {
        type: "object",
        properties: {
          name: { type: "string" },
          age: { type: "number" },
        },
        required: ["name", "age"],
        additionalProperties: false,
      },
    },
  },
});
```

### 9. Memory/Token Limit Errors

**Nguyên nhân:** Conversation quá dài, vượt token limit.

**Giải pháp:**

1. Giới hạn số messages
2. Summarize old messages
3. Sử dụng sliding window

```typescript
// Giới hạn 10 messages gần nhất
const MAX_MESSAGES = 10;
const recentMessages = messages.slice(-MAX_MESSAGES);

const response = await aio.chatCompletion({
  provider: "openrouter",
  model: "arcee-ai/trinity-large-preview:free",
  messages: recentMessages,
});
```

### 10. Validation Errors

**Nguyên nhân:** Config hoặc request không pass Zod validation.

**Giải pháp:**

1. Kiểm tra error message để biết field nào sai
2. Tắt validation nếu cần (không khuyến khích)

```typescript
// Tắt validation (không khuyến khích)
const aio = new AIO({
  providers: [...],
  enableValidation: false,
});

// Hoặc fix validation error
const aio = new AIO({
  providers: [
    {
      provider: "openrouter",
      apiKeys: [
        { key: "valid-key" } // Không empty
      ],
      models: [
        { modelId: "valid-model" } // Không empty
      ],
    },
  ],
});
```

---

## 🎯 Best Practices

### 1. Sử dụng Environment Variables

```typescript
// .env
OPENROUTER_API_KEY=sk-or-v1-xxxxx
GROQ_API_KEY=gsk_xxxxx
CEREBRAS_API_KEY=csk_xxxxx
GOOGLE_AI_API_KEY=AIzaSyxxxxx

// code
import dotenv from "dotenv";
dotenv.config();

const aio = new AIO({
  providers: [
    {
      provider: "openrouter",
      apiKeys: [{ key: process.env.OPENROUTER_API_KEY }],
      models: [{ modelId: "arcee-ai/trinity-large-preview:free" }],
    },
  ],
});
```

### 2. Implement Daily Limits

```typescript
// Reset counters mỗi ngày (cron job)
import cron from "node-cron";

cron.schedule("0 0 * * *", () => {
  aio.resetDailyCounters();
  console.log("Daily counters reset");
});
```

### 3. Monitor Key Usage

```typescript
// Log key stats sau mỗi request
const response = await aio.chatCompletion({...});

const stats = aio.getKeyStats("openrouter");
console.log(`Usage: ${stats.totalUsage}, Errors: ${stats.totalErrors}`);

// Alert khi usage cao
if (stats.totalUsage > 80) {
  console.warn("⚠️ High usage detected!");
}
```

### 4. Handle Errors Gracefully

```typescript
try {
  const response = await aio.chatCompletion({...});
} catch (error) {
  if (error instanceof AIOError) {
    const classification = AIOError.classify(error);
    
    if (classification.category === "rate_limit") {
      // Đợi và retry
      await sleep(60000);
      return retry();
    } else if (classification.category === "auth") {
      // Alert admin
      notifyAdmin("Invalid API key");
    }
  }
  
  // Fallback response
  return { content: "Xin lỗi, đã có lỗi xảy ra." };
}
```

### 5. Optimize Token Usage

```typescript
// Giới hạn conversation length
const MAX_MESSAGES = 20;
const messages = conversationHistory.slice(-MAX_MESSAGES);

// Sử dụng max_tokens để control cost
const response = await aio.chatCompletion({
  provider: "openrouter",
  model: "arcee-ai/trinity-large-preview:free",
  messages,
  max_tokens: 500, // Giới hạn output
});
```

### 6. Use Auto Mode cho Production

```typescript
// Production config với multiple providers
const aio = new AIO({
  providers: [
    {
      provider: "groq",
      apiKeys: [
        { key: process.env.GROQ_KEY_1, priority: 100 },
        { key: process.env.GROQ_KEY_2, priority: 50 },
      ],
      models: [{ modelId: "llama-3.3-70b-versatile" }],
      priority: 100,
    },
    {
      provider: "cerebras",
      apiKeys: [{ key: process.env.CEREBRAS_KEY }],
      models: [{ modelId: "llama3.1-8b" }],
      priority: 80,
    },
    {
      provider: "google-ai",
      apiKeys: [{ key: process.env.GOOGLE_AI_KEY }],
      models: [{ modelId: "gemini-1.5-flash" }],
      priority: 60,
    },
  ],
  autoMode: true,
  maxRetries: 5,
  retryDelay: 2000,
});
```

### 7. Implement Caching

```typescript
import NodeCache from "node-cache";

const cache = new NodeCache({ stdTTL: 3600 }); // 1 hour

async function getChatResponse(prompt: string) {
  // Check cache
  const cached = cache.get(prompt);
  if (cached) return cached;
  
  // Get from AI
  const response = await aio.chatCompletion({
    provider: "openrouter",
    model: "arcee-ai/trinity-large-preview:free",
    messages: [{ role: "user", content: prompt }],
  });
  
  // Cache result
  cache.set(prompt, response);
  return response;
}
```

### 8. Use Streaming cho Long Responses

```typescript
// Streaming tốt hơn cho long-form content
const stream = await aio.chatCompletionStream({
  provider: "groq",
  model: "llama-3.3-70b-versatile",
  messages: [
    { role: "user", content: "Viết một bài luận dài về AI" }
  ],
});

// Send to client real-time
for await (const chunk of stream) {
  res.write(chunk);
}
```

### 9. Validate User Input

```typescript
import { z } from "zod";

const UserInputSchema = z.object({
  message: z.string().min(1).max(1000),
  temperature: z.number().min(0).max(2).optional(),
});

// Validate before sending to AI
const input = UserInputSchema.parse(req.body);

const response = await aio.chatCompletion({
  provider: "openrouter",
  model: "arcee-ai/trinity-large-preview:free",
  messages: [{ role: "user", content: input.message }],
  temperature: input.temperature,
});
```

### 10. Implement Rate Limiting

```typescript
import rateLimit from "express-rate-limit";

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
});

app.use("/api/chat", limiter);

app.post("/api/chat", async (req, res) => {
  const response = await aio.chatCompletion({...});
  res.json(response);
});
```

---

## 📚 Tài liệu tham khảo

### Provider Documentation

- **OpenRouter**: https://openrouter.ai/docs
- **Groq**: https://console.groq.com/docs
- **Cerebras**: https://inference-docs.cerebras.ai/
- **Google AI**: https://ai.google.dev/docs

### Free Models

#### OpenRouter (30+ free models)

- `arcee-ai/trinity-large-preview:free`
- `openrouter/pony-alpha`
- `meta-llama/llama-3.2-3b-instruct:free`
- `google/gemini-flash-1.5:free`
- Xem thêm: https://openrouter.ai/models?order=newest&supported_parameters=tools&max_price=0

#### Groq

- `llama-3.3-70b-versatile`
- `llama-3.1-8b-instant`
- `mixtral-8x7b-32768`

#### Cerebras

- `llama3.1-8b`
- `llama3.1-70b`

#### Google AI

- `gemini-1.5-flash` (Free tier: 15 RPM, 1M TPM)
- `gemini-1.5-pro` (Free tier: 2 RPM, 32K TPM)

---

## 📞 Support

- **GitHub Issues**: https://github.com/yourusername/aio-llm/issues
- **Documentation**: https://github.com/yourusername/aio-llm#readme
- **Examples**: https://github.com/yourusername/aio-llm/tree/main/examples

---

## 📄 License

MIT License - Xem file LICENSE để biết thêm chi tiết.

---

**Chúc bạn code vui vẻ! 🚀**
