/**
 * Request validation using Zod
 */

import { z } from "zod";

export const MessageSchema = z.object({
  role: z.enum(["system", "user", "assistant"]),
  content: z.string().min(1, "Content cannot be empty"),
});

export const ProviderSchema = z.enum([
  "openrouter",
  "google-ai",
  "groq",
  "cerebras",
]);

export const ApiKeySchema = z.object({
  key: z.string().min(1, "API key cannot be empty"),
  priority: z.number().int().optional().default(0),
  isActive: z.boolean().optional().default(true),
  dailyLimit: z.number().int().positive().optional(),
  requestsToday: z.number().int().nonnegative().optional().default(0),
  errorCount: z.number().int().nonnegative().optional().default(0),
  lastError: z.string().optional(),
  lastUsed: z.date().optional(),
});

export const ModelConfigSchema = z.object({
  modelId: z.string().min(1, "Model ID cannot be empty"),
  priority: z.number().int().optional().default(0),
  isActive: z.boolean().optional().default(true),
});

export const ProviderConfigSchema = z.object({
  provider: ProviderSchema,
  apiKeys: z.array(ApiKeySchema).min(1, "At least one API key is required"),
  models: z.array(ModelConfigSchema).min(1, "At least one model is required"),
  priority: z.number().int().optional().default(0),
  isActive: z.boolean().optional().default(true),
});

export const AIOConfigSchema = z.object({
  providers: z
    .array(ProviderConfigSchema)
    .min(1, "At least one provider is required"),
  autoMode: z.boolean().optional().default(false),
  maxRetries: z.number().int().positive().optional().default(3),
  retryDelay: z.number().int().positive().optional().default(1000),
  enableLogging: z.boolean().optional().default(true),
});

export const ChatCompletionRequestSchema = z.object({
  messages: z.array(MessageSchema).min(1, "At least one message is required"),
  temperature: z.number().min(0).max(2).optional(),
  max_tokens: z.number().int().positive().max(100000).optional(),
  top_p: z.number().min(0).max(1).optional(),
  stream: z.boolean().optional().default(false),
  stop: z.array(z.string()).optional(),
  provider: ProviderSchema.optional(),
  model: z.string().optional(),
});

export type ValidatedMessage = z.infer<typeof MessageSchema>;
export type ValidatedApiKey = z.infer<typeof ApiKeySchema>;
export type ValidatedModelConfig = z.infer<typeof ModelConfigSchema>;
export type ValidatedProviderConfig = z.infer<typeof ProviderConfigSchema>;
export type ValidatedAIOConfig = z.infer<typeof AIOConfigSchema>;
export type ValidatedChatRequest = z.infer<typeof ChatCompletionRequestSchema>;
