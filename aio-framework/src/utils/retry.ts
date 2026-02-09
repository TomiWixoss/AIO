/**
 * Retry utility with exponential backoff
 */

import { logger } from "./logger.js";

export interface RetryOptions {
  maxAttempts?: number;
  delayMs?: number;
  backoffMultiplier?: number;
  retryableErrors?: string[]; // Error message patterns
  onRetry?: (attempt: number, error: Error) => void;
}

const DEFAULT_RETRYABLE_PATTERNS = [
  "rate",
  "limit",
  "429",
  "503",
  "timeout",
  "ECONNRESET",
  "ETIMEDOUT",
];

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    delayMs = 1000,
    backoffMultiplier = 2,
    retryableErrors = DEFAULT_RETRYABLE_PATTERNS,
    onRetry,
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      const errorMsg = error.message || String(error);
      const isRetryable = retryableErrors.some((pattern) =>
        errorMsg.toLowerCase().includes(pattern.toLowerCase())
      );
      const isLastAttempt = attempt === maxAttempts;

      if (!isRetryable || isLastAttempt) {
        throw error;
      }

      const delay = delayMs * Math.pow(backoffMultiplier, attempt - 1);

      logger.warn(`Retry attempt ${attempt}/${maxAttempts}`, {
        error: errorMsg.substring(0, 150),
        nextRetryIn: `${delay}ms`,
      });

      if (onRetry) {
        onRetry(attempt, error);
      }

      await sleep(delay);
    }
  }

  throw lastError;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
