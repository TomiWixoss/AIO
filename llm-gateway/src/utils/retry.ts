import { config } from "../config/index.js";
import { logger } from "./logger.js";

interface RetryOptions {
  maxAttempts?: number;
  delayMs?: number;
  backoffMultiplier?: number;
  retryableErrors?: number[];
}

const DEFAULT_RETRYABLE_ERRORS = [408, 429, 500, 502, 503, 504];

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = config.retry.maxAttempts,
    delayMs = config.retry.delayMs,
    backoffMultiplier = 2,
    retryableErrors = DEFAULT_RETRYABLE_ERRORS,
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      const statusCode = error.statusCode || error.status || 500;
      const isRetryable = retryableErrors.includes(statusCode);
      const isLastAttempt = attempt === maxAttempts;

      if (!isRetryable || isLastAttempt) {
        throw error;
      }

      const delay = delayMs * Math.pow(backoffMultiplier, attempt - 1);

      logger.warn(`Retry attempt ${attempt}/${maxAttempts}`, {
        error: error.message,
        statusCode,
        nextRetryIn: `${delay}ms`,
      });

      await sleep(delay);
    }
  }

  throw lastError;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
