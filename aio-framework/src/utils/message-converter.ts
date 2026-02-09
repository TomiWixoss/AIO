/**
 * Message converter utilities
 * Convert multimodal messages to text-only for providers that don't support multimodal
 */

import type { Message } from "../types.js";

/**
 * Convert message content to plain text string
 * Extracts text from multimodal content (ignores images/files)
 */
export function contentToString(content: Message["content"]): string {
  if (typeof content === "string") {
    return content;
  }
  
  // Extract text from multimodal content
  return content
    .filter((item) => item.type === "text")
    .map((item) => item.text)
    .join(" ");
}

/**
 * Convert messages array to text-only format
 * Used by providers that don't support multimodal (OpenRouter, Groq, Cerebras)
 */
export function convertMessagesToTextOnly(
  messages: Message[]
): Array<{ role: "system" | "user" | "assistant"; content: string }> {
  return messages.map((m) => ({
    role: m.role,
    content: contentToString(m.content),
  }));
}
