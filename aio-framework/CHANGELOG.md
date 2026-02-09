# Changelog

## [1.0.0] - 2026-02-09

### 🎉 Initial Release

**AIO Framework** - All-In-One LLM Framework cho JavaScript/TypeScript

### ✨ Features

- **Multi-Provider Support**: Hỗ trợ 4 providers
  - OpenRouter (30+ models)
  - Groq (ultra-fast inference)
  - Cerebras (high-performance)
  - Google AI (Gemini models)

- **Priority Management**
  - Provider priority (chọn provider ưu tiên)
  - Model priority (chọn model ưu tiên trong provider)
  - API Key priority (rotation khi key fail)

- **Auto Fallback**
  - Tự động chuyển sang provider/model khác khi fail
  - Không giới hạn số lần fallback
  - Track fallback history

- **Flexible Modes**
  - **Auto Mode**: Tự động chọn provider/model theo priority
  - **Direct Mode**: Chỉ định cụ thể provider và model

- **Streaming Support**
  - Real-time response streaming
  - Hỗ trợ cả reasoning models và standard models

- **TypeScript Support**
  - Full type definitions
  - Type-safe API

### 🧪 Tested Providers

- ✅ OpenRouter - `openrouter/pony-alpha` (reasoning model)
- ✅ Groq - `openai/gpt-oss-120b` (standard model)
- ✅ Google AI - `gemini-3-flash-preview` (Gemini model)
- ⏳ Cerebras - (chưa test với API key thật)

### 📦 Package Info

- Package: `@aio/llm-framework`
- Version: `1.0.0`
- License: MIT
- TypeScript: ✅
- ESM: ✅

### 🔧 Technical Details

- Hỗ trợ cả `content` và `reasoning` fields (cho reasoning models)
- Auto-detect và handle response format khác nhau
- Key rotation khi API key fail
- Graceful error handling
