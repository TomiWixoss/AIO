/**
 * AIO - All-In-One LLM Framework
 * Main class for multi-provider LLM integration
 */

import type {
  AIOConfig,
  Provider,
  ProviderConfig,
  ChatCompletionRequest,
  ChatCompletionResponse,
  StreamChunk,
} from "./types.js";
import { AIOError } from "./types.js";
import { BaseProvider } from "./providers/base.js";
import { OpenRouterProvider } from "./providers/openrouter.js";
import { GroqProvider } from "./providers/groq.js";
import { CerebrasProvider } from "./providers/cerebras.js";
import { GoogleAIProvider } from "./providers/google-ai.js";
import { Response } from "express";
import { Readable } from "stream";

export class AIO {
  private config: AIOConfig;
  private providerInstances: Map<Provider, BaseProvider> = new Map();

  constructor(config: AIOConfig) {
    this.config = {
      autoMode: false,
      maxRetries: 3,
      retryDelay: 1000,
      ...config,
    };

    this.initializeProviders();
  }

  /**
   * Khởi tạo provider instances
   */
  private initializeProviders(): void {
    this.providerInstances.set("openrouter", new OpenRouterProvider());
    this.providerInstances.set("groq", new GroqProvider());
    this.providerInstances.set("cerebras", new CerebrasProvider());
    this.providerInstances.set("google-ai", new GoogleAIProvider());
  }

  /**
   * Lấy provider instance
   */
  private getProviderInstance(provider: Provider): BaseProvider {
    const instance = this.providerInstances.get(provider);
    if (!instance) {
      throw new AIOError(`Provider not implemented: ${provider}`);
    }
    return instance;
  }

  /**
   * Lấy provider config
   */
  private getProviderConfig(provider: Provider): ProviderConfig | undefined {
    return this.config.providers.find(
      (p) => p.provider === provider && p.isActive !== false
    );
  }

  /**
   * Lấy API keys theo priority
   */
  private getApiKeys(provider: Provider): string[] {
    const config = this.getProviderConfig(provider);
    if (!config) return [];

    return config.apiKeys
      .filter((k) => k.isActive !== false)
      .sort((a, b) => (b.priority || 0) - (a.priority || 0))
      .map((k) => k.key);
  }

  /**
   * Chat completion
   */
  async chatCompletion(
    request: ChatCompletionRequest
  ): Promise<ChatCompletionResponse> {
    if (this.config.autoMode && !request.provider && !request.model) {
      return this.autoChatCompletion(request);
    }

    if (!request.provider || !request.model) {
      throw new AIOError(
        "provider and model are required when autoMode is disabled"
      );
    }

    return this.directChatCompletion(request);
  }

  /**
   * Auto mode: tự động chọn provider/model theo priority và fallback
   */
  private async autoChatCompletion(
    request: ChatCompletionRequest
  ): Promise<ChatCompletionResponse> {
    const failedAttempts: string[] = [];

    // Sắp xếp providers theo priority
    const sortedProviders = this.getSortedProviders();

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
          const response = await this.directChatCompletion({
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
          }

          return response;
        } catch (error: any) {
          failedAttempts.push(`${provider}:${modelConfig.modelId}`);
          console.warn(
            `[AIO] Failed ${provider}:${modelConfig.modelId} - ${error.message}`
          );
          continue;
        }
      }
    }

    throw new AIOError(
      `All providers exhausted. Tried: ${failedAttempts.join(", ")}`
    );
  }

  /**
   * Direct mode: chỉ định cụ thể provider và model
   */
  private async directChatCompletion(
    request: ChatCompletionRequest
  ): Promise<ChatCompletionResponse> {
    const { provider, model } = request;

    if (!provider || !model) {
      throw new AIOError("provider and model are required");
    }

    const instance = this.getProviderInstance(provider);
    const apiKeys = this.getApiKeys(provider);

    if (apiKeys.length === 0) {
      throw new AIOError(`No API keys configured for provider: ${provider}`);
    }

    // Thử từng API key theo priority
    let lastError: Error | null = null;

    for (const apiKey of apiKeys) {
      try {
        return await instance.chatCompletion(request, apiKey);
      } catch (error: any) {
        lastError = error;
        console.warn(
          `[AIO] Key failed for ${provider}, trying next key...`,
          error.message
        );
        continue;
      }
    }

    throw new AIOError(
      `All API keys failed for ${provider}: ${lastError?.message}`,
      provider,
      model
    );
  }

  /**
   * Stream chat completion
   */
  async chatCompletionStream(
    request: ChatCompletionRequest
  ): Promise<Readable> {
    if (this.config.autoMode && !request.provider && !request.model) {
      return this.autoStreamChatCompletion(request);
    }

    if (!request.provider || !request.model) {
      throw new AIOError(
        "provider and model are required when autoMode is disabled"
      );
    }

    return this.directStreamChatCompletion(request);
  }

  /**
   * Auto stream mode
   */
  private async autoStreamChatCompletion(
    request: ChatCompletionRequest
  ): Promise<Readable> {
    const sortedProviders = this.getSortedProviders();

    for (const providerConfig of sortedProviders) {
      const provider = providerConfig.provider;

      const sortedModels = [...providerConfig.models]
        .filter((m) => m.isActive !== false)
        .sort((a, b) => (b.priority || 0) - (a.priority || 0));

      for (const modelConfig of sortedModels) {
        try {
          return await this.directStreamChatCompletion({
            ...request,
            provider,
            model: modelConfig.modelId,
          });
        } catch (error: any) {
          console.warn(
            `[AIO] Stream failed ${provider}:${modelConfig.modelId} - ${error.message}`
          );
          continue;
        }
      }
    }

    throw new AIOError("All providers exhausted for streaming");
  }

  /**
   * Direct stream mode
   */
  private async directStreamChatCompletion(
    request: ChatCompletionRequest
  ): Promise<Readable> {
    const { provider, model } = request;

    if (!provider || !model) {
      throw new AIOError("provider and model are required");
    }

    const instance = this.getProviderInstance(provider);
    const apiKeys = this.getApiKeys(provider);

    if (apiKeys.length === 0) {
      throw new AIOError(`No API keys configured for provider: ${provider}`);
    }

    let lastError: Error | null = null;

    for (const apiKey of apiKeys) {
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

        // Start streaming
        instance.streamChatCompletion(request, mockRes, apiKey).catch((err) => {
          stream.destroy(err);
        });

        return stream;
      } catch (error: any) {
        lastError = error;
        console.warn(
          `[AIO] Stream key failed for ${provider}, trying next key...`,
          error.message
        );
        continue;
      }
    }

    throw new AIOError(
      `All API keys failed for ${provider}: ${lastError?.message}`,
      provider,
      model
    );
  }

  /**
   * Lấy providers đã sắp xếp theo priority
   */
  private getSortedProviders(): ProviderConfig[] {
    return [...this.config.providers]
      .filter((p) => p.isActive !== false)
      .sort((a, b) => (b.priority || 0) - (a.priority || 0));
  }
}
