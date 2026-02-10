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
  ApiKey,
} from "./types.js";
import { AIOError } from "./types.js";
import { BaseProvider } from "./providers/base.js";
import { OpenRouterProvider } from "./providers/openrouter.js";
import { GroqProvider } from "./providers/groq.js";
import { CerebrasProvider } from "./providers/cerebras.js";
import { GoogleAIProvider } from "./providers/google-ai.js";
import { Readable } from "stream";
import { logger } from "./utils/logger.js";
import { KeyManager } from "./utils/key-manager.js";
import {
  AIOConfigSchema,
  ChatCompletionRequestSchema,
} from "./utils/validation.js";
import { AutoModeHandler } from "./core/auto-mode.js";
import { DirectModeHandler } from "./core/direct-mode.js";
import { StreamHandler } from "./core/stream-handler.js";
import { ToolStreamHandler } from "./core/tool-stream-handler.js";

export class AIO {
  private config: AIOConfig;
  private providerInstances: Map<Provider, BaseProvider> = new Map();

  constructor(config: AIOConfig) {
    // Validate config if enabled
    const enableValidation = config.enableValidation !== false;
    if (enableValidation) {
      const result = AIOConfigSchema.safeParse(config);
      if (!result.success) {
        throw new AIOError(
          `Invalid configuration: ${result.error.message}`,
          undefined,
          undefined,
          400
        );
      }
      this.config = result.data;
    } else {
      this.config = config;
    }

    // Set defaults
    this.config = {
      autoMode: false,
      maxRetries: 3,
      retryDelay: 1000,
      enableLogging: true,
      enableValidation: true,
      ...this.config,
    };

    if (this.config.enableLogging) {
      logger.info("AIO Framework initialized", {
        providers: this.config.providers.length,
        autoMode: this.config.autoMode,
        maxRetries: this.config.maxRetries,
      });
    }

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
   * Lấy API keys theo priority và availability
   */
  private getApiKeys(provider: Provider): ApiKey[] {
    const config = this.getProviderConfig(provider);
    if (!config) return [];

    return config.apiKeys
      .filter((k) => k.isActive !== false)
      .filter((k) => !k.dailyLimit || (k.requestsToday || 0) < k.dailyLimit)
      .sort((a, b) => {
        // Sort by priority first
        const priorityDiff = (b.priority || 0) - (a.priority || 0);
        if (priorityDiff !== 0) return priorityDiff;
        // Then by usage (prefer less used keys)
        return (a.requestsToday || 0) - (b.requestsToday || 0);
      });
  }

  /**
   * Lấy providers đã sắp xếp theo priority
   */
  private getSortedProviders(): ProviderConfig[] {
    return [...this.config.providers]
      .filter((p) => p.isActive !== false)
      .sort((a, b) => (b.priority || 0) - (a.priority || 0));
  }

  /**
   * Chat completion
   */
  async chatCompletion(
    request: ChatCompletionRequest
  ): Promise<ChatCompletionResponse> {
    // Validate request if enabled
    if (this.config.enableValidation) {
      const result = ChatCompletionRequestSchema.safeParse(request);
      if (!result.success) {
        throw new AIOError(
          `Invalid request: ${result.error.message}`,
          undefined,
          undefined,
          400
        );
      }
    }

    if (this.config.enableLogging) {
      logger.info("Chat completion request", {
        provider: request.provider,
        model: request.model,
        autoMode: this.config.autoMode,
        messageCount: request.messages.length,
      });
    }

    if (this.config.autoMode && !request.provider && !request.model) {
      return AutoModeHandler.autoChatCompletion(
        request,
        this.getSortedProviders(),
        (req) => this.directChatCompletion(req),
        this.config.enableLogging || false
      );
    }

    if (!request.provider || !request.model) {
      throw new AIOError(
        "provider and model are required when autoMode is disabled",
        undefined,
        undefined,
        400
      );
    }

    return this.directChatCompletion(request);
  }

  /**
   * Direct chat completion
   */
  private async directChatCompletion(
    request: ChatCompletionRequest
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

    const instance = this.getProviderInstance(provider);
    const apiKeys = this.getApiKeys(provider);

    return DirectModeHandler.directChatCompletion(
      request,
      instance,
      apiKeys,
      this.config.maxRetries || 3,
      this.config.retryDelay || 1000,
      this.config.enableLogging || false
    );
  }

  /**
   * Stream chat completion
   * Hỗ trợ tool calling nếu có tools và onToolCall
   */
  async chatCompletionStream(
    request: ChatCompletionRequest
  ): Promise<Readable> {
    // Check if tool calling is requested
    if (request.tools && request.tools.length > 0 && request.onToolCall) {
      if (!request.provider || !request.model) {
        throw new AIOError(
          "provider and model are required for tool calling",
          undefined,
          undefined,
          400
        );
      }

      const instance = this.getProviderInstance(request.provider);
      const apiKeys = this.getApiKeys(request.provider);

      return ToolStreamHandler.streamWithTools(
        request,
        instance,
        apiKeys,
        this.config.maxRetries || 3,
        this.config.retryDelay || 1000,
        this.config.enableLogging || false
      );
    }

    // Normal streaming without tools
    if (this.config.autoMode && !request.provider && !request.model) {
      return StreamHandler.autoStreamChatCompletion(
        request,
        this.getSortedProviders(),
        (req) => this.directStreamChatCompletion(req),
        this.config.enableLogging || false
      );
    }

    if (!request.provider || !request.model) {
      throw new AIOError(
        "provider and model are required when autoMode is disabled",
        undefined,
        undefined,
        400
      );
    }

    return this.directStreamChatCompletion(request);
  }

  /**
   * Direct stream chat completion
   */
  private async directStreamChatCompletion(
    request: ChatCompletionRequest
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

    const instance = this.getProviderInstance(provider);
    const apiKeys = this.getApiKeys(provider);

    return StreamHandler.directStreamChatCompletion(
      request,
      instance,
      apiKeys,
      this.config.maxRetries || 3,
      this.config.retryDelay || 1000,
      this.config.enableLogging || false
    );
  }

  /**
   * Get key statistics for a provider
   */
  getKeyStats(
    provider: Provider
  ): ReturnType<typeof KeyManager.getStats> | null {
    const config = this.getProviderConfig(provider);
    if (!config) return null;
    return KeyManager.getStats(config.apiKeys);
  }

  /**
   * Reset daily counters for all providers
   */
  resetDailyCounters(): void {
    this.config.providers.forEach((providerConfig) => {
      KeyManager.resetDailyCounters(providerConfig.apiKeys);
    });

    if (this.config.enableLogging) {
      logger.info("Daily counters reset for all providers");
    }
  }

  /**
   * Get configuration summary
   */
  getConfigSummary(): {
    providers: number;
    totalKeys: number;
    totalModels: number;
    autoMode: boolean;
    maxRetries: number;
  } {
    return {
      providers: this.config.providers.length,
      totalKeys: this.config.providers.reduce(
        (sum, p) => sum + p.apiKeys.length,
        0
      ),
      totalModels: this.config.providers.reduce(
        (sum, p) => sum + p.models.length,
        0
      ),
      autoMode: this.config.autoMode || false,
      maxRetries: this.config.maxRetries || 3,
    };
  }
}
