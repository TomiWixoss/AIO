# LLM Gateway

Gateway tích hợp và chuẩn hóa giao diện tương tác cho các Mô hình ngôn ngữ lớn đa nền tảng.

## Features

- 🔄 **Retry Logic**: Automatic retry with exponential backoff
- ✅ **Validation**: Zod schema validation for all requests
- 📊 **Logging**: Request tracking with Winston
- 🔀 **Multi-Provider**: 12 LLM providers với free tier

## Supported Providers (Free Tier)

| Provider              | Base URL             | Free Tier          |
| --------------------- | -------------------- | ------------------ |
| OpenRouter            | openrouter.ai        | 30+ free models    |
| Google AI Studio      | ai.google.dev        | 1,500 req/day      |
| NVIDIA NIM            | build.nvidia.com     | Developer access   |
| Mistral               | console.mistral.ai   | 1B tokens/month    |
| Codestral             | codestral.mistral.ai | Code generation    |
| HuggingFace           | huggingface.co       | ~100 req/hour      |
| Groq                  | console.groq.com     | 14,400 req/day     |
| Cerebras              | cloud.cerebras.ai    | Free API key       |
| Cohere                | cohere.com           | Trial API          |
| GitHub Models         | github.com           | Free with GitHub   |
| Cloudflare Workers AI | cloudflare.com       | 10,000 neurons/day |
| Vertex AI             | cloud.google.com     | $300 credits       |

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Add your API keys to .env

# Run development server
npm run dev
```

## API Endpoints

### Chat Completion

```bash
POST /v1/chat/completions
```

Request body:

```json
{
  "provider": "groq",
  "model": "llama-3.3-70b-versatile",
  "messages": [{ "role": "user", "content": "Hello!" }],
  "temperature": 0.7,
  "max_tokens": 1000,
  "stream": false
}
```

### List Models

```bash
GET /v1/models                  # All models from all providers
GET /v1/models/providers        # List available providers
GET /v1/models/:provider        # Models from specific provider
```

### Health Check

```bash
GET /health
```

Response:

```json
{
  "status": "ok",
  "timestamp": "2025-01-05T...",
  "version": "1.0.0",
  "providers": { "total": 12, "active": 3 }
}
```

## Project Structure

```
llm-gateway/
├── src/
│   ├── index.ts              # Entry point
│   ├── config/
│   │   ├── index.ts          # Environment config
│   │   └── validation.ts     # Zod schemas
│   ├── types/                # TypeScript types
│   ├── routes/               # API routes
│   ├── providers/            # LLM provider adapters
│   │   ├── base.ts           # Base provider class
│   │   ├── factory.ts        # Provider factory
│   │   └── ...               # Provider implementations
│   ├── middleware/
│   │   ├── validation.ts     # Request validation
│   │   ├── errorHandler.ts   # Error handling
│   │   └── requestLogger.ts  # Request logging
│   └── utils/
│       ├── logger.ts         # Winston logger
│       └── retry.ts          # Retry logic
├── package.json
├── tsconfig.json
└── .env.example
```

## License

MIT
