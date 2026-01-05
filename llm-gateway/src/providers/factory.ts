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

  static async chatCompletion(
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

  static async streamChatCompletion(
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
    return Array.from(providerInstances.keys());
  }

  // Lấy providers từ DB
  static async getAvailableProviders(): Promise<
    { name: string; display_name: string; is_active: boolean }[]
  > {
    try {
      const providers = await dbGet<DBProvider[]>("/providers");
      return providers.map((p) => ({
        name: p.name,
        display_name: p.display_name,
        is_active: p.is_active,
      }));
    } catch (error) {
      logger.warn("Failed to get providers from DB, returning empty");
      return [];
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
