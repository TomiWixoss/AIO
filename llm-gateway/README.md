# LLM Gateway

Gateway tích hợp và chuẩn hóa giao diện tương tác cho các Mô hình ngôn ngữ lớn đa nền tảng.

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
GET /v1/models
GET /v1/models/:provider
```

### Health Check

```bash
GET /health
```

## Project Structure

```
llm-gateway/
├── src/
│   ├── index.ts              # Entry point
│   ├── types/                # TypeScript types
│   ├── routes/               # API routes
│   ├── providers/            # LLM provider adapters
│   │   ├── base.ts           # Base provider class
│   │   ├── factory.ts        # Provider factory
│   │   ├── openrouter.ts
│   │   ├── google-ai.ts
│   │   ├── nvidia-nim.ts
│   │   ├── mistral.ts
│   │   ├── codestral.ts
│   │   ├── huggingface.ts
│   │   ├── groq.ts
│   │   ├── cerebras.ts
│   │   ├── cohere.ts
│   │   ├── github-models.ts
│   │   ├── cloudflare.ts
│   │   └── vertex-ai.ts
│   ├── middleware/           # Express middleware
│   └── utils/                # Utilities
├── package.json
├── tsconfig.json
└── .env.example
```

## License

MIT
