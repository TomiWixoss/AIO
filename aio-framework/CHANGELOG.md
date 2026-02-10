# Changelog

## [1.0.3-4] - 2026-02-10

### 🆕 New Provider: Nvidia

**Added**
- Nvidia provider support với Kimi K2.5 model (FREE)
  - Base URL: `https://integrate.api.nvidia.com/v1`
  - Model: `moonshotai/kimi-k2.5`
  - OpenAI-compatible API
  - Hỗ trợ reasoning mode (chain-of-thought)
  - Streaming support
  - JSON response format support

**Provider Implementation**
- `src/providers/nvidia.ts` - Nvidia provider class
- Xử lý `reasoning` field từ Kimi K2.5 responses
- Tương thích với OpenAI SDK

**Documentation**
- Cập nhật README với thông tin Nvidia provider
- Hướng dẫn đăng ký API key miễn phí
- Thêm Nvidia vào bảng supported providers

**Examples**
- `examples/nvidia-kimi.ts` - Comprehensive example
- `examples/nvidia-simple.ts` - Simple test
- `examples/test-nvidia-raw.ts` - Raw API test

**Types & Validation**
- Thêm "nvidia" vào `Provider` type
- Cập nhật validation schema với Nvidia support

**Keywords**
- Thêm "nvidia" và "kimi" vào package keywords

---

## [1.0.2] - 2026-02-10

### 🚀 Tool Calling System

**Added**
- Text-based tool calling với streaming support
  - Parse `[tool]...[/tool]` tags real-time từ AI response
  - Automatic parameter validation (required, enum, unknown params)
  - Automatic default value application
  - Retry logic với exponential backoff (max 3 retries)
  - Execution metadata tracking (time, retry count)
  - Iterative loop support (max 5 iterations, configurable)
  - Provider-agnostic (works với mọi LLM)
  - Cursor IDE-inspired best practices
- Tool calling documentation:
  - `docs/TOOL-CALLING.md` - User guide
  - `docs/TOOL-CALLING-ARCHITECTURE.md` - Architecture comparison
- Tool calling examples:
  - `examples/tool-test-simple.ts` - Basic example
  - `examples/tool-calling.ts` - Complex example
  - `examples/tool-test-validation.ts` - Validation & retry example

**Enhanced Types**
- `ToolDefinition` với `requireReasoning` field
- `ToolParameter` với `enum` và `default` fields
- `ToolResult` với metadata (executionTime, retryCount)
- `ToolCallEvent` với timestamp tracking

**Improved**
- System prompt generation với Cursor-style rules
- Error messages với actionable suggestions
- Multi-line SSE chunk parsing
- Stream destruction on tool detection

---

## [1.0.1] - 2026-02-09

### 🎉 Major Release - Feature Parity with Gateway

#### ✨ New Features

**Key Management**
- ✅ API key usage tracking (`requestsToday`, `errorCount`)
- ✅ Daily limit enforcement per key
- ✅ Automatic key rotation on errors
- ✅ Key statistics and monitoring
- ✅ Smart key selection (priority + usage-based)

**Request Validation**
- ✅ Zod schema validation for all requests
- ✅ Config validation on initialization
- ✅ Detailed validation error messages
- ✅ Optional validation (can be disabled)

**Retry Logic**
- ✅ Exponential backoff retry mechanism
- ✅ Configurable max attempts and delay
- ✅ Retryable error detection
- ✅ Retry callbacks for monitoring

**Logging**
- ✅ Winston-based structured logging
- ✅ Configurable log levels
- ✅ Request/response tracking
- ✅ Error categorization logging
- ✅ Optional logging (can be disabled)

**Error Handling**
- ✅ Error classification (rate_limit, auth, invalid_request, server, network)
- ✅ Smart error categorization
- ✅ Retryable vs non-retryable detection
- ✅ Key rotation decision logic

#### 🏗️ Architecture Improvements

**Code Organization**
- Refactored 504-line `aio.ts` into modular structure:
  - `core/auto-mode.ts` (93 lines) - Auto fallback logic
  - `core/direct-mode.ts` (109 lines) - Direct mode with retry
  - `core/stream-handler.ts` (162 lines) - Streaming logic
  - `aio.ts` (284 lines) - Main class coordination
- Better separation of concerns
- Easier to maintain and extend

**New Utilities**
- `utils/key-manager.ts` - Centralized key management
- `utils/validation.ts` - Zod schemas
- `utils/retry.ts` - Retry logic with backoff
- `utils/logger.ts` - Winston logger setup

#### 📦 Dependencies

**Added**
- `zod@^4.3.5` - Schema validation
- `winston@^3.19.0` - Structured logging

#### 🧪 Testing

**New Test Files**
- `examples/test-simple.ts` - Basic functionality test
- `examples/test-new-features.ts` - Comprehensive feature testing
  - Config validation
  - Request validation
  - Key rotation
  - Error classification
  - Daily limits
  - Streaming with logging

#### 📊 Comparison with Gateway

**Now Supported** ✅
- Key Management & Tracking
- Request Validation
- Retry Logic (fully implemented)
- Structured Logging
- Error Classification

**Still Different** (by design)
- No database integration (library vs service)
- No tool execution (out of scope)
- No REST API (library, not service)

#### 🔄 Breaking Changes

**Type Changes**
- `ApiKey` interface extended with tracking fields:
  - `errorCount?: number`
  - `lastError?: string`
  - `lastUsed?: Date`

**Config Changes**
- New optional config fields:
  - `enableLogging?: boolean` (default: true)
  - `enableValidation?: boolean` (default: true)

**Error Changes**
- `AIOError` now includes:
  - `isRetryable: boolean`
  - Static `classify()` method

#### 📝 Migration Guide

**From v1.x to v2.0**

```typescript
// Old (v1.x)
const aio = new AIO({
  providers: [
    {
      provider: "openrouter",
      apiKeys: [{ key: "sk-..." }],
      models: [{ modelId: "model-id" }],
    },
  ],
});

// New (v2.0) - Same API, but with new features
const aio = new AIO({
  providers: [
    {
      provider: "openrouter",
      apiKeys: [
        {
          key: "sk-...",
          priority: 10,
          dailyLimit: 1000, // NEW: Optional limit
        },
      ],
      models: [{ modelId: "model-id" }],
    },
  ],
  enableLogging: true, // NEW: Optional
  enableValidation: true, // NEW: Optional
  maxRetries: 3, // Now actually implemented!
  retryDelay: 1000,
});

// NEW: Get key statistics
const stats = aio.getKeyStats("openrouter");
console.log(stats); // { total, active, disabled, totalUsage, totalErrors }

// NEW: Get config summary
const summary = aio.getConfigSummary();
console.log(summary); // { providers, totalKeys, totalModels, autoMode, maxRetries }
```

## [1.0.0] - 2026-01-XX

### Initial Release

- Multi-provider support (OpenRouter, Groq, Cerebras, Google AI)
- Auto mode with priority-based fallback
- Streaming support
- Basic error handling
- Priority-based provider/model selection
