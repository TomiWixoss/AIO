import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default("3000"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  // Database Service
  DATABASE_SERVICE_URL: z.string().default("http://localhost:5000"),

  // Encryption key for API keys (32 bytes for AES-256)
  ENCRYPTION_KEY: z
    .string()
    .min(32, "ENCRYPTION_KEY must be at least 32 characters"),

  // Retry
  RETRY_MAX_ATTEMPTS: z.string().default("3"),
  RETRY_DELAY_MS: z.string().default("1000"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:", parsed.error.issues);
  process.exit(1);
}

const env = parsed.data;

export const config = {
  port: parseInt(env.PORT),
  nodeEnv: env.NODE_ENV,
  databaseServiceUrl: env.DATABASE_SERVICE_URL,
  encryptionKey: env.ENCRYPTION_KEY,

  retry: {
    maxAttempts: parseInt(env.RETRY_MAX_ATTEMPTS),
    delayMs: parseInt(env.RETRY_DELAY_MS),
  },
};
