import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default("3000"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  // Retry
  RETRY_MAX_ATTEMPTS: z.string().default("3"),
  RETRY_DELAY_MS: z.string().default("1000"),

  // Provider API Keys
  OPENROUTER_API_KEY: z.string().optional(),
  GOOGLE_AI_API_KEY: z.string().optional(),
  NVIDIA_NIM_API_KEY: z.string().optional(),
  MISTRAL_API_KEY: z.string().optional(),
  MISTRAL_CODESTRAL_API_KEY: z.string().optional(),
  HUGGINGFACE_API_KEY: z.string().optional(),
  GROQ_API_KEY: z.string().optional(),
  CEREBRAS_API_KEY: z.string().optional(),
  COHERE_API_KEY: z.string().optional(),
  GITHUB_MODELS_TOKEN: z.string().optional(),
  CLOUDFLARE_ACCOUNT_ID: z.string().optional(),
  CLOUDFLARE_API_TOKEN: z.string().optional(),
  GOOGLE_VERTEX_PROJECT_ID: z.string().optional(),
  GOOGLE_VERTEX_LOCATION: z.string().default("us-central1"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    "❌ Invalid environment variables:",
    parsed.error.flatten().fieldErrors
  );
  process.exit(1);
}

const env = parsed.data;

export const config = {
  port: parseInt(env.PORT),
  nodeEnv: env.NODE_ENV,

  retry: {
    maxAttempts: parseInt(env.RETRY_MAX_ATTEMPTS),
    delayMs: parseInt(env.RETRY_DELAY_MS),
  },

  providers: {
    openrouter: env.OPENROUTER_API_KEY,
    googleAi: env.GOOGLE_AI_API_KEY,
    nvidiaNim: env.NVIDIA_NIM_API_KEY,
    mistral: env.MISTRAL_API_KEY,
    codestral: env.MISTRAL_CODESTRAL_API_KEY || env.MISTRAL_API_KEY,
    huggingface: env.HUGGINGFACE_API_KEY,
    groq: env.GROQ_API_KEY,
    cerebras: env.CEREBRAS_API_KEY,
    cohere: env.COHERE_API_KEY,
    githubModels: env.GITHUB_MODELS_TOKEN,
    cloudflareAccountId: env.CLOUDFLARE_ACCOUNT_ID,
    cloudflareApiToken: env.CLOUDFLARE_API_TOKEN,
    vertexProjectId: env.GOOGLE_VERTEX_PROJECT_ID,
    vertexLocation: env.GOOGLE_VERTEX_LOCATION,
  },
};
