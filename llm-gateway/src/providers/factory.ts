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
  getFirstPriorityModel,
  getNextFallbackModel,
  isProviderExhaustedError,
  shouldFallback,
} from "../services/auto-selector.js";
import { dbGet } from "../utils/db-client.js";
import { logger } from "../utils/logger.js";

interface DBProvider {
  id: number;
  provider_id: string;
  name?: string;
  display_name?: string;
  base_url?: string;
  is_active: boolean;
  priority: number;
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

export class ProviderFactory {
  static getProviderInstance(name: Provider): BaseProvider {
    const provider = providerInstances.get(name);
    if (!provider) {
      throw new GatewayError(400, `Provider not implemented: ${name}`);
    }
    return provider;
  }

  /**
   * Chat completion - hỗ trợ auto_mode với fallback không giới hạn
   */
  static async chatCompletion(
    request: ChatCompletionRequest
  ): Promise<{ response: ChatCompletionResponse; keyId: number }> {
    // Auto mode: tự động chọn và fallback
    if (request.auto_mode) {
      return this.autoChatCompletion(request);
    }

    // Normal mode
    return this.directChatCompletion(request);
  }

  /**
   * Auto mode: chọn model theo priority và fallback không giới hạn khi lỗi
   */
  private static async autoChatCompletion(
    request: ChatCompletionRequest
  ): Promise<{ response: ChatCompletionResponse; keyId: number }> {
    const failedModels = new Set<string>();
    const exhaustedProviders = new Set<string>();
    let fallbackCount = 0;

    // Lấy model đầu tiên theo priority
    let currentSelection = await getFirstPriorityModel();

    if (!currentSelection) {
      throw new GatewayError(503, "No available models configured");
    }

    const originalProvider = currentSelection.provider;
    const originalModel = currentSelection.model;

    // Loop fallback không giới hạn
    while (currentSelection) {
      logger.info("Auto mode: trying", {
        provider: currentSelection.provider,
        model: currentSelection.model,
        fallbackCount,
      });

      try {
        const result = await this.directChatCompletion({
          ...request,
          provider: currentSelection.provider,
          model: currentSelection.model,
          auto_mode: false, // Tắt auto_mode cho direct call
        });

        // Thêm thông tin fallback vào response
        if (fallbackCount > 0) {
          result.response.auto_fallback = {
            original_provider: originalProvider,
            original_model: originalModel,
            final_provider: currentSelection.provider,
            final_model: currentSelection.model,
            fallback_count: fallbackCount,
          };
        }

        return result;
      } catch (error: any) {
        const errorMsg = error.message || "";

        logger.warn("Auto mode: model failed", {
          provider: currentSelection.provider,
          model: currentSelection.model,
          error: errorMsg.substring(0, 150),
        });

        // Kiểm tra loại lỗi
        if (isProviderExhaustedError(errorMsg)) {
          exhaustedProviders.add(currentSelection.provider);
        }

        // Kiểm tra có nên fallback không
        if (!shouldFallback(errorMsg)) {
          // Lỗi không thể fallback (ví dụ: invalid request)
          throw error;
        }

        // Lấy model tiếp theo
        const nextSelection = await getNextFallbackModel(
          currentSelection.provider,
          currentSelection.model,
          failedModels,
          exhaustedProviders
        );

        if (!nextSelection) {
          // Hết tất cả models
          throw new GatewayError(
            503,
            `All models exhausted after ${
              fallbackCount + 1
            } attempts. Last error: ${errorMsg}`
          );
        }

        currentSelection = nextSelection;
        fallbackCount++;
      }
    }

    throw new GatewayError(503, "No available models");
  }

  /**
   * Direct chat completion (không auto, có key rotation trong provider)
   */
  private static async directChatCompletion(
    request: ChatCompletionRequest
  ): Promise<{ response: ChatCompletionResponse; keyId: number }> {
    const providerInstance = this.getProviderInstance(request.provider);

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

    // Try keys with rotation on failure (trong cùng provider)
    const triedKeyIds = new Set<number>();
    let currentKey = key;
    let currentApiKey = apiKey;

    while (triedKeyIds.size < 30) {
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
   * Stream chat completion - hỗ trợ auto_mode
   */
  static async streamChatCompletion(
    request: ChatCompletionRequest,
    res: Response
  ): Promise<{ keyId: number; finalProvider?: string; finalModel?: string }> {
    if (request.auto_mode) {
      return this.autoStreamChatCompletion(request, res);
    }

    return this.directStreamChatCompletion(request, res);
  }

  /**
   * Auto stream: fallback trước khi bắt đầu stream
   */
  private static async autoStreamChatCompletion(
    request: ChatCompletionRequest,
    res: Response
  ): Promise<{ keyId: number; finalProvider?: string; finalModel?: string }> {
    const failedModels = new Set<string>();
    const exhaustedProviders = new Set<string>();

    let currentSelection = await getFirstPriorityModel();

    if (!currentSelection) {
      throw new GatewayError(503, "No available models configured");
    }

    // Loop fallback không giới hạn
    while (currentSelection) {
      logger.info("Auto stream: trying", {
        provider: currentSelection.provider,
        model: currentSelection.model,
      });

      try {
        const result = await this.directStreamChatCompletion(
          {
            ...request,
            provider: currentSelection.provider,
            model: currentSelection.model,
            auto_mode: false,
          },
          res
        );

        return {
          ...result,
          finalProvider: currentSelection.provider,
          finalModel: currentSelection.model,
        };
      } catch (error: any) {
        // Nếu đã bắt đầu stream thì không thể fallback
        if (res.headersSent) {
          throw error;
        }

        const errorMsg = error.message || "";

        if (isProviderExhaustedError(errorMsg)) {
          exhaustedProviders.add(currentSelection.provider);
        }

        if (!shouldFallback(errorMsg)) {
          throw error;
        }

        const nextSelection = await getNextFallbackModel(
          currentSelection.provider,
          currentSelection.model,
          failedModels,
          exhaustedProviders
        );

        if (!nextSelection) {
          throw new GatewayError(
            503,
            `All models exhausted. Last error: ${errorMsg}`
          );
        }

        currentSelection = nextSelection;
      }
    }

    throw new GatewayError(503, "No available models");
  }

  /**
   * Direct stream (không auto) - có key rotation
   */
  private static async directStreamChatCompletion(
    request: ChatCompletionRequest,
    res: Response
  ): Promise<{ keyId: number }> {
    const providerInstance = this.getProviderInstance(request.provider);

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

    // Key rotation cho streaming
    const triedKeyIds = new Set<number>();
    let currentKey = key;
    let currentApiKey = apiKey;

    while (triedKeyIds.size < 30) {
      triedKeyIds.add(currentKey.id);

      try {
        await providerInstance.streamChatCompletion(request, res, currentApiKey);
        await incrementKeyUsage(currentKey.id);
        return { keyId: currentKey.id };
      } catch (error: any) {
        const errorMsg = error.message || "";
        const shouldRotate =
          errorMsg.includes("rate") ||
          errorMsg.includes("limit") ||
          errorMsg.includes("429") ||
          errorMsg.includes("403") ||
          errorMsg.includes("leaked") ||
          errorMsg.includes("PERMISSION_DENIED");

        await markKeyError(currentKey.id, errorMsg, shouldRotate);

        // Chỉ rotate nếu chưa gửi headers (chưa bắt đầu stream)
        if (shouldRotate && !res.headersSent) {
          logger.warn(`Key ${currentKey.id} failed, trying next key for stream`, {
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

    throw new GatewayError(503, "All API keys exhausted for streaming");
  }

  static getAllProviders(): Provider[] {
    return Array.from(providerInstances.keys());
  }

  static async getAvailableProviders(): Promise<
    {
      name: string;
      display_name: string;
      is_active: boolean;
      priority: number;
    }[]
  > {
    try {
      const providers = await dbGet<DBProvider[]>("/providers");
      return providers.map((p) => ({
        name: p.name || p.provider_id,
        display_name: p.display_name || p.name || p.provider_id,
        is_active: p.is_active,
        priority: p.priority || 0,
      }));
    } catch (error) {
      logger.warn("Failed to get providers from DB");
      return [];
    }
  }

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
      logger.warn("Failed to get models from DB");
      return [];
    }
  }
}
