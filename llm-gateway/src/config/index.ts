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

  // Retry
  RETRY_MAX_ATTEMPTS: z.string().default("3"),
  RETRY_DELAY_MS: z.string().default("1000"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:", parsed.error.format());
  process.exit(1);
}

const env = parsed.data;

export const config = {
  port: parseInt(env.PORT),
  nodeEnv: env.NODE_ENV,
  databaseServiceUrl: env.DATABASE_SERVICE_URL,

  retry: {
    maxAttempts: parseInt(env.RETRY_MAX_ATTEMPTS),
    delayMs: parseInt(env.RETRY_DELAY_MS),
  },
};
