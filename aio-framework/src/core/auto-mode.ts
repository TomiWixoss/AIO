/**
 * Auto Mode Logic
 * Tự động chọn provider/model theo priority và fallback
 */

import type {
  ChatCompletionRequest,
  ChatCompletionResponse,
  ProviderConfig,
} from "../types.js";
import { AIOError } from "../types.js";
import { logger } from "../utils/logger.js";

export class AutoModeHandler {
  /**
   * Auto chat completion với fallback không giới hạn
   */
  static async autoChatCompletion(
    request: ChatCompletionRequest,
    sortedProviders: ProviderConfig[],
    directChatFn: (req: ChatCompletionRequest) => Promise<ChatCompletionResponse>,
    enableLogging: boolean
  ): Promise<ChatCompletionResponse> {
    const failedAttempts: string[] = [];

    let originalProvider: string | undefined;
    let originalModel: string | undefined;

    for (const providerConfig of sortedProviders) {
      const provider = providerConfig.provider;

      // Sắp xếp models theo priority
      const sortedModels = [...providerConfig.models]
        .filter((m) => m.isActive !== false)
        .sort((a, b) => (b.priority || 0) - (a.priority || 0));

      for (const modelConfig of sortedModels) {
        // Lưu original provider/model
        if (!originalProvider) {
          originalProvider = provider;
          originalModel = modelConfig.modelId;
        }

        try {
          const response = await directChatFn({
            ...request,
            provider,
            model: modelConfig.modelId,
          });

          // Thêm fallback info nếu có
          if (failedAttempts.length > 0) {
            response.auto_fallback = {
              original_provider: originalProvider!,
              original_model: originalModel!,
              final_provider: provider,
              final_model: modelConfig.modelId,
              fallback_count: failedAttempts.length,
            };

            if (enableLogging) {
              logger.info("Auto fallback succeeded", {
                originalProvider,
                originalModel,
                finalProvider: provider,
                finalModel: modelConfig.modelId,
                fallbackCount: failedAttempts.length,
              });
            }
          }

          return response;
        } catch (error: any) {
          failedAttempts.push(`${provider}:${modelConfig.modelId}`);

          const errorInfo = AIOError.classify(error);
          if (enableLogging) {
            logger.warn("Auto mode: model failed", {
              provider,
              model: modelConfig.modelId,
              error: error.message?.substring(0, 150),
              category: errorInfo.category,
              isRetryable: errorInfo.isRetryable,
            });
          }

          // Không fallback nếu lỗi không thể retry (ví dụ: invalid request)
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
      `All providers exhausted. Tried: ${failedAttempts.join(", ")}`,
      undefined,
      undefined,
      503
    );
  }
}
