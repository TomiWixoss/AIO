import { z } from "zod";

export const MessageSchema = z.object({
  role: z.enum(["system", "user", "assistant"]),
  content: z.string().min(1, "Content cannot be empty"),
});

export const ProviderSchema = z.enum([
  "openrouter",
  "google-ai",
  "nvidia-nim",
  "mistral",
  "codestral",
  "huggingface",
  "groq",
  "cerebras",
  "cohere",
  "github-models",
  "cloudflare",
  "vertex-ai",
]);

export const ChatCompletionRequestSchema = z.object({
  provider: ProviderSchema,
  model: z.string().min(1, "Model is required"),
  messages: z.array(MessageSchema).min(1, "At least one message is required"),
  temperature: z.number().min(0).max(2).optional(),
  max_tokens: z.number().int().positive().max(100000).optional(),
  top_p: z.number().min(0).max(1).optional(),
  stream: z.boolean().optional().default(false),
  stop: z.array(z.string()).optional(),
});

export type ValidatedChatRequest = z.infer<typeof ChatCompletionRequestSchema>;
