import { Response } from "express";
import {
  Provider,
  ModelInfo,
  ChatCompletionRequest,
  ChatCompletionResponse,
} from "../types/index.js";
import { BaseProvider } from "./base.js";
import { OpenRouterProvider } from "./openrouter.js";
import { GroqProvider } from "./groq.js";
import { CerebrasProvider } from "./cerebras.js";
import { GoogleAIProvider } from "./google-ai.js";
import { GatewayError } from "shared/errors";
import {
  getProviderByName,
  getActiveKey,
  incrementKeyUsage,
  markKeyError,
  decryptApiKey,
} from "../services/key-manager.js";
import {
  selectNextModel,
  markModelFailed,
  markProviderExhausted,
  hasAvailableModels,
} from "../services/auto-selector.js";
import { dbGet } from "../utils/db-client.js";
import { logger } from "../utils/logger.js";

interface DBProvider {
  id: number;
  name: string;
  display_name: string;
  base_url: string;
  is_active: boolean;
}

interface DBModel {
  id: number;
  provider_id: number;
  model_id: string;
  display_name: string;
  context_length: number | null;
  is_active: boolean;
  provider_name: string;
  priority: number;
}

// Provider instances (stateless, no API key stored)
const providerInstances = new Map<Provider, BaseProvider>();
providerInstances.set("openrouter", new OpenRouterProvider());
providerInstances.set("groq", new GroqProvider());
providerInstances.set("cerebras", new CerebrasProvider());
providerInstances.set("google-ai", new GoogleAIProvider());

const MAX_AUTO_FALLBACKS = 10; // Số lần fallback tối đa trong auto mode

export class ProviderFactory {
  static getProviderInstance(name: Provider): BaseProvider {
    if (name === "auto") {
      throw new GatewayError(
        400,
        "Cannot get instance for 'auto' provider directly"
      );
    }
    const provider = providerInstances.get(name);
    if (!provider) {
      throw new GatewayError(400, `Provider not implemented: ${name}`);
    }
    return provider;
  }

  /**
   * Chat completion với hỗ trợ auto mode
   */
  static async chatCompletion(
    request: ChatCompletionRequest
  ): Promise<{ response: ChatCompletionResponse; keyId: number }> {
    // Auto mode - chọn model theo priority và fallback tự động
    if (request.provider === "auto") {
      return this.autoChatCompletion(request);
    }

    // Normal mode
    return this.directChatCompletion(request);
  }

  /**
   * Auto mode: tự động chọn model theo priority và fallback khi lỗi
   */
  private static async autoChatCompletion(
    request: ChatCompletionRequest
  ): Promise<{ response: ChatCompletionResponse; keyId: number }> {
    const triedModels = new Set<string>();
    let fallbackCount = 0;
    let firstSelected: { provider: string; model: string } | null = null;

    while (fallbackCount < MAX_AUTO_FALLBACKS) {
      // Chọn model tiếp theo theo priority
      const selected = await selectNextModel(triedModels);

      if (!selected) {
        throw new GatewayError(
          503,
          "No available models. All models exhausted or failed."
        );
      }

      if (!firstSelected) {
        firstSelected = { provider: selected.provider, model: selected.model };
      }

      const modelKey = `${selected.provider}:${selected.model}`;
      triedModels.add(modelKey);

      logger.info("Auto mode: trying model", {
        provider: selected.provider,
        model: selected.model,
        fallbackCount,
      });

      try {
        const result = await this.directChatCompletion({
          ...request,
          provider: selected.provider,
          model: selected.model,
        });

        // Thêm thông tin auto selection vào response
        result.response.auto_selected = {
          original_provider: firstSelected.provider,
          original_model: firstSelected.model,
          fallback_count: fallbackCount,
        };

        return result;
      } catch (error: any) {
        const errorMsg = error.message || "";

        // Kiểm tra loại lỗi
        const isKeyExhausted =
          errorMsg.includes("No active API key") ||
          errorMsg.includes("All API keys exhausted");

        const isRateLimit =
          errorMsg.includes("rate") ||
          errorMsg.includes("limit") ||
          errorMsg.includes("429");

        const isModelError =
          errorMsg.includes("model") ||
          errorMsg.includes("not found") ||
          errorMsg.includes("404");

        if (isKeyExhausted) {
          // Provider hết key - đánh dấu và thử provider khác
          markProviderExhausted(selected.provider);
          logger.warn("Auto mode: provider exhausted", {
            provider: selected.provider,
          });
        } else if (isRateLimit || isModelError) {
          // Model lỗi - đánh dấu và thử model khác
          markModelFailed(selected.provider, selected.model);
          logger.warn("Auto mode: model failed", {
            provider: selected.provider,
            model: selected.model,
            error: errorMsg.substring(0, 100),
          });
        } else {
          // Lỗi khác - đánh dấu model failed và thử tiếp
          markModelFailed(selected.provider, selected.model);
          logger.error("Auto mode: unexpected error", {
            provider: selected.provider,
            model: selected.model,
            error: errorMsg,
          });
        }

        fallbackCount++;

        // Kiểm tra còn model nào không
        if (!(await hasAvailableModels())) {
          throw new GatewayError(
            503,
            `All models exhausted after ${fallbackCount} attempts. Last error: ${errorMsg}`
          );
        }
      }
    }

    throw new GatewayError(
      503,
      `Max fallback attempts (${MAX_AUTO_FALLBACKS}) reached`
    );
  }

  /**
   * Direct chat completion (không auto)
   */
  private static async directChatCompletion(
    request: ChatCompletionRequest
  ): Promise<{ response: ChatCompletionResponse; keyId: number }> {
    const providerInstance = this.getProviderInstance(
      request.provider as Exclude<Provider, "auto">
    );

    // Get provider from DB
    const provider = await getProviderByName(request.provider);
    if (!provider) {
      throw new GatewayError(
        400,
        `Provider not found or inactive: ${request.provider}`
      );
    }

    // Get active API key
    const key = await getActiveKey(provider.id);
    if (!key) {
      throw new GatewayError(
        503,
        `No active API key for provider: ${request.provider}`
      );
    }

    const apiKey = await decryptApiKey(key.credentials_encrypted);

    // Try keys with rotation on failure
    const triedKeyIds = new Set<number>();
    let currentKey = key;
    let currentApiKey = apiKey;

    while (triedKeyIds.size < 30) {
      // Max 30 keys to try
      triedKeyIds.add(currentKey.id);

      try {
        const response = await providerInstance.chatCompletion(
          request,
          currentApiKey
        );
        await incrementKeyUsage(currentKey.id);
        return { response, keyId: currentKey.id };
      } catch (error: any) {
        const errorMsg = error.message || "";
        // Check if should try next key (rate limit, leaked, permission denied, 403, 429)
        const shouldRotate =
          errorMsg.includes("rate") ||
          errorMsg.includes("limit") ||
          errorMsg.includes("429") ||
          errorMsg.includes("403") ||
          errorMsg.includes("leaked") ||
          errorMsg.includes("PERMISSION_DENIED");

        await markKeyError(currentKey.id, errorMsg, shouldRotate);

        if (shouldRotate) {
          logger.warn(`Key ${currentKey.id} failed, trying next key`, {
            error: errorMsg.substring(0, 100),
          });
          const nextKey = await getActiveKey(provider.id);
          if (nextKey && !triedKeyIds.has(nextKey.id)) {
            currentKey = nextKey;
            currentApiKey = await decryptApiKey(nextKey.credentials_encrypted);
            continue;
          }
        }

        throw error;
      }
    }

    throw new GatewayError(503, "All API keys exhausted");
  }

  /**
   * Stream chat completion với hỗ trợ auto mode
   */
  static async streamChatCompletion(
    request: ChatCompletionRequest,
    res: Response
  ): Promise<{ keyId: number; actualProvider?: string; actualModel?: string }> {
    // Auto mode cho streaming
    if (request.provider === "auto") {
      return this.autoStreamChatCompletion(request, res);
    }

    return this.directStreamChatCompletion(request, res);
  }

  /**
   * Auto stream: chọn model và stream, fallback nếu lỗi trước khi bắt đầu stream
   */
  private static async autoStreamChatCompletion(
    request: ChatCompletionRequest,
    res: Response
  ): Promise<{ keyId: number; actualProvider?: string; actualModel?: string }> {
    const triedModels = new Set<string>();
    let fallbackCount = 0;

    while (fallbackCount < MAX_AUTO_FALLBACKS) {
      const selected = await selectNextModel(triedModels);

      if (!selected) {
        throw new GatewayError(503, "No available models for streaming");
      }

      const modelKey = `${selected.provider}:${selected.model}`;
      triedModels.add(modelKey);

      logger.info("Auto stream: trying model", {
        provider: selected.provider,
        model: selected.model,
        fallbackCount,
      });

      try {
        const result = await this.directStreamChatCompletion(
          {
            ...request,
            provider: selected.provider,
            model: selected.model,
          },
          res
        );

        return {
          ...result,
          actualProvider: selected.provider,
          actualModel: selected.model,
        };
      } catch (error: any) {
        const errorMsg = error.message || "";

        // Nếu đã bắt đầu stream thì không thể fallback
        if (res.headersSent) {
          throw error;
        }

        const isKeyExhausted =
          errorMsg.includes("No active API key") ||
          errorMsg.includes("All API keys exhausted");

        if (isKeyExhausted) {
          markProviderExhausted(selected.provider);
        } else {
          markModelFailed(selected.provider, selected.model);
        }

        fallbackCount++;

        if (!(await hasAvailableModels())) {
          throw new GatewayError(
            503,
            `All models exhausted. Last error: ${errorMsg}`
          );
        }
      }
    }

    throw new GatewayError(503, `Max fallback attempts reached for streaming`);
  }

  /**
   * Direct stream (không auto)
   */
  private static async directStreamChatCompletion(
    request: ChatCompletionRequest,
    res: Response
  ): Promise<{ keyId: number }> {
    const providerInstance = this.getProviderInstance(
      request.provider as Exclude<Provider, "auto">
    );

    const provider = await getProviderByName(request.provider);
    if (!provider) {
      throw new GatewayError(
        400,
        `Provider not found or inactive: ${request.provider}`
      );
    }

    const key = await getActiveKey(provider.id);
    if (!key) {
      throw new GatewayError(
        503,
        `No active API key for provider: ${request.provider}`
      );
    }

    const apiKey = await decryptApiKey(key.credentials_encrypted);

    try {
      await providerInstance.streamChatCompletion(request, res, apiKey);
      await incrementKeyUsage(key.id);
      return { keyId: key.id };
    } catch (error: any) {
      await markKeyError(key.id, error.message);
      throw error;
    }
  }

  static getAllProviders(): Provider[] {
    return [...Array.from(providerInstances.keys()), "auto"];
  }

  // Lấy providers từ DB
  static async getAvailableProviders(): Promise<
    { name: string; display_name: string; is_active: boolean }[]
  > {
    try {
      const providers = await dbGet<DBProvider[]>("/providers");
      return [
        {
          name: "auto",
          display_name: "Auto (Priority-based)",
          is_active: true,
        },
        ...providers.map((p) => ({
          name: p.name,
          display_name: p.display_name,
          is_active: p.is_active,
        })),
      ];
    } catch (error) {
      logger.warn("Failed to get providers from DB, returning empty");
      return [
        {
          name: "auto",
          display_name: "Auto (Priority-based)",
          is_active: true,
        },
      ];
    }
  }

  // Lấy tất cả models từ DB
  static async getAllModels(): Promise<ModelInfo[]> {
    try {
      const models = await dbGet<DBModel[]>("/models/active");
      return models.map((m) => ({
        id: m.model_id,
        provider: m.provider_name as Provider,
        name: m.display_name,
        context_length: m.context_length || undefined,
      }));
    } catch (error) {
      logger.warn("Failed to get models from DB, returning empty");
      return [];
    }
  }
}
