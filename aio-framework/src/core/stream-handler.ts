/**
 * Stream Handler
 * Xử lý streaming với retry và key rotation
 */

import type {
  ChatCompletionRequest,
  Provider,
  ProviderConfig,
  ApiKey,
} from "../types.js";
import { AIOError } from "../types.js";
import { BaseProvider } from "../providers/base.js";
import { Response } from "express";
import { Readable } from "stream";
import { logger } from "../utils/logger.js";
import { withRetry } from "../utils/retry.js";
import { KeyManager } from "../utils/key-manager.js";

export class StreamHandler {
  /**
   * Auto stream mode với fallback
   */
  static async autoStreamChatCompletion(
    request: ChatCompletionRequest,
    sortedProviders: ProviderConfig[],
    directStreamFn: (req: ChatCompletionRequest) => Promise<Readable>,
    enableLogging: boolean
  ): Promise<Readable> {
    for (const providerConfig of sortedProviders) {
      const provider = providerConfig.provider;

      const sortedModels = [...providerConfig.models]
        .filter((m) => m.isActive !== false)
        .sort((a, b) => (b.priority || 0) - (a.priority || 0));

      for (const modelConfig of sortedModels) {
        try {
          return await directStreamFn({
            ...request,
            provider,
            model: modelConfig.modelId,
          });
        } catch (error: any) {
          const errorInfo = AIOError.classify(error);

          if (enableLogging) {
            logger.warn("Auto stream: model failed", {
              provider,
              model: modelConfig.modelId,
              error: error.message?.substring(0, 150),
              category: errorInfo.category,
            });
          }

          // Không fallback nếu lỗi không thể retry
          if (
            !errorInfo.isRetryable &&
            errorInfo.category === "invalid_request"
          ) {
            throw error;
          }

          continue;
        }
      }
    }

    throw new AIOError(
      "All providers exhausted for streaming",
      undefined,
      undefined,
      503
    );
  }

  /**
   * Direct stream mode với retry và key rotation
   */
  static async directStreamChatCompletion(
    request: ChatCompletionRequest,
    providerInstance: BaseProvider,
    apiKeys: ApiKey[],
    maxRetries: number,
    retryDelay: number,
    enableLogging: boolean
  ): Promise<Readable> {
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

    let lastError: Error | null = null;
    const triedKeys = new Set<string>();

    for (const keyObj of apiKeys) {
      if (triedKeys.has(keyObj.key)) continue;
      triedKeys.add(keyObj.key);

      try {
        // Tạo readable stream
        const stream = new Readable({
          read() {},
        });

        // Tạo mock response object
        const mockRes = {
          write: (chunk: string) => {
            stream.push(chunk);
          },
          end: () => {
            stream.push(null);
          },
          headersSent: false,
        } as unknown as Response;

        // Listen to abort signal
        const abortHandler = () => {
          stream.destroy(new Error("Stream cancelled by user"));
          if (enableLogging) {
            logger.info("Stream cancelled", { provider, model });
          }
        };

        if (request.signal) {
          request.signal.addEventListener("abort", abortHandler);
        }

        // Start streaming với retry
        await withRetry(
          () => providerInstance.streamChatCompletion(request, mockRes, keyObj.key),
          {
            maxAttempts: maxRetries,
            delayMs: retryDelay,
          }
        ).catch((err) => {
          stream.destroy(err);
          throw err;
        }).finally(() => {
          // Cleanup abort listener
          if (request.signal) {
            request.signal.removeEventListener("abort", abortHandler);
          }
        });

        // Success
        KeyManager.incrementUsage(keyObj);

        if (enableLogging) {
          logger.info("Stream completed", {
            provider,
            model,
            keyPriority: keyObj.priority,
          });
        }

        return stream;
      } catch (error: any) {
        lastError = error;
        const errorInfo = AIOError.classify(error);

        KeyManager.markError(keyObj, error.message, errorInfo.shouldRotateKey);

        if (enableLogging) {
          logger.warn("Stream key failed", {
            provider,
            keyPriority: keyObj.priority,
            error: error.message?.substring(0, 100),
            shouldRotate: errorInfo.shouldRotateKey,
          });
        }

        if (errorInfo.shouldRotateKey) {
          continue;
        }

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
