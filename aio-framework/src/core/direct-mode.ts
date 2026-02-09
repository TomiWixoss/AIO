/**
 * Direct Mode Logic
 * Chỉ định cụ thể provider và model với retry và key rotation
 */

import type {
  ChatCompletionRequest,
  ChatCompletionResponse,
  Provider,
  ApiKey,
} from "../types.js";
import { AIOError } from "../types.js";
import { BaseProvider } from "../providers/base.js";
import { logger } from "../utils/logger.js";
import { withRetry } from "../utils/retry.js";
import { KeyManager } from "../utils/key-manager.js";

export class DirectModeHandler {
  /**
   * Direct chat completion với retry logic và key rotation
   */
  static async directChatCompletion(
    request: ChatCompletionRequest,
    providerInstance: BaseProvider,
    apiKeys: ApiKey[],
    maxRetries: number,
    retryDelay: number,
    enableLogging: boolean
  ): Promise<ChatCompletionResponse> {
    const { provider, model } = request;

    if (!provider || !model) {
      throw new AIOError(
        "provider and model are required",
        undefined,
        undefined,
        400
      );
    }

    if (apiKeys.length === 0) {
      throw new AIOError(
        `No API keys configured for provider: ${provider}`,
        provider,
        model,
        503
      );
    }

    // Thử từng API key với retry logic
    let lastError: Error | null = null;
    const triedKeys = new Set<string>();

    for (const keyObj of apiKeys) {
      if (triedKeys.has(keyObj.key)) continue;
      triedKeys.add(keyObj.key);

      try {
        // Check if already aborted before starting
        if (request.signal?.aborted) {
          throw new Error("Request cancelled before execution");
        }

        // Create promise that rejects on abort
        const abortPromise = new Promise<never>((_, reject) => {
          if (request.signal) {
            request.signal.addEventListener("abort", () => {
              reject(new Error("Request cancelled"));
            });
          }
        });

        // Race between actual request and abort
        const response = await Promise.race([
          withRetry(
            async () => {
              if (request.signal?.aborted) {
                throw new Error("Request cancelled");
              }
              return await providerInstance.chatCompletion(request, keyObj.key);
            },
            {
              maxAttempts: maxRetries,
              delayMs: retryDelay,
              onRetry: (attempt, error) => {
                if (enableLogging) {
                  logger.warn(`Retry attempt ${attempt}`, {
                    provider,
                    model,
                    error: error.message?.substring(0, 100),
                  });
                }
              },
            }
          ),
          abortPromise,
        ]);

        // Success - increment usage
        KeyManager.incrementUsage(keyObj);

        if (enableLogging) {
          logger.info("Chat completion succeeded", {
            provider,
            model,
            keyPriority: keyObj.priority,
            usage: keyObj.requestsToday,
          });
        }

        return response;
      } catch (error: any) {
        // Check if it's a cancellation error
        if (error.message?.includes("cancel")) {
          throw error; // Don't retry on cancellation
        }

        lastError = error;
        const errorInfo = AIOError.classify(error);

        // Mark error and check if should rotate
        KeyManager.markError(keyObj, error.message, errorInfo.shouldRotateKey);

        if (enableLogging) {
          logger.warn("Key failed", {
            provider,
            keyPriority: keyObj.priority,
            error: error.message?.substring(0, 100),
            category: errorInfo.category,
            shouldRotate: errorInfo.shouldRotateKey,
          });
        }

        // Rotate to next key if applicable
        if (errorInfo.shouldRotateKey) {
          continue;
        }

        // Don't rotate for non-retryable errors
        throw error;
      }
    }

    throw new AIOError(
      `All API keys failed for ${provider}: ${lastError?.message}`,
      provider,
      model,
      503
    );
  }
}
