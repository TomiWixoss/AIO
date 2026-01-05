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
import { GatewayError } from "../middleware/errorHandler.js";
import {
  getProviderByName,
  getActiveKey,
  incrementKeyUsage,
  markKeyError,
  decryptApiKey,
} from "../services/key-manager.js";
import { logger } from "../utils/logger.js";

// Provider instances (stateless, no API key stored)
const providerInstances = new Map<Provider, BaseProvider>();
providerInstances.set("openrouter", new OpenRouterProvider());
providerInstances.set("groq", new GroqProvider());
// TODO: Add other providers

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

    const apiKey = await decryptApiKey(key.api_key_encrypted);

    try {
      const response = await providerInstance.chatCompletion(request, apiKey);
      await incrementKeyUsage(key.id);
      return { response, keyId: key.id };
    } catch (error: any) {
      // Check if rate limit error
      const isRateLimit =
        error.message?.includes("rate") ||
        error.message?.includes("limit") ||
        error.message?.includes("429");
      await markKeyError(key.id, error.message, isRateLimit);

      // Try next key if available
      if (isRateLimit) {
        logger.warn(`Key ${key.id} hit rate limit, trying next key`);
        const nextKey = await getActiveKey(provider.id);
        if (nextKey && nextKey.id !== key.id) {
          const nextApiKey = await decryptApiKey(nextKey.api_key_encrypted);
          const response = await providerInstance.chatCompletion(
            request,
            nextApiKey
          );
          await incrementKeyUsage(nextKey.id);
          return { response, keyId: nextKey.id };
        }
      }

      throw error;
    }
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

    const apiKey = await decryptApiKey(key.api_key_encrypted);

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

  static getAvailableProviders(): { name: Provider; available: boolean }[] {
    return Array.from(providerInstances.keys()).map((name) => ({
      name,
      available: true, // Will be checked against DB at runtime
    }));
  }

  static async getAllModels(): Promise<ModelInfo[]> {
    const models: ModelInfo[] = [];
    for (const provider of providerInstances.values()) {
      try {
        const providerModels = await provider.listModels();
        models.push(...providerModels);
      } catch (error) {
        logger.warn(`Failed to get models from ${provider.name}`);
      }
    }
    return models;
  }
}
