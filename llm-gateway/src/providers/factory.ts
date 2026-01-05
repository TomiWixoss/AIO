import { Provider, ModelInfo } from "../types/index.js";
import { BaseProvider } from "./base.js";
import { OpenRouterProvider } from "./openrouter.js";
import { GoogleAIProvider } from "./google-ai.js";
import { GroqProvider } from "./groq.js";
import { MistralProvider } from "./mistral.js";
import { CodestralProvider } from "./codestral.js";
import { CerebrasProvider } from "./cerebras.js";
import { CohereProvider } from "./cohere.js";
import { HuggingFaceProvider } from "./huggingface.js";
import { NvidiaNimProvider } from "./nvidia-nim.js";
import { GitHubModelsProvider } from "./github-models.js";
import { CloudflareProvider } from "./cloudflare.js";
import { VertexAIProvider } from "./vertex-ai.js";
import { GatewayError } from "../middleware/errorHandler.js";
import { config } from "../config/index.js";
import { logger } from "../utils/logger.js";

type ProviderConstructor = new () => BaseProvider;

const providerRegistry: Record<
  Provider,
  { constructor: ProviderConstructor; configKey: keyof typeof config.providers }
> = {
  openrouter: { constructor: OpenRouterProvider, configKey: "openrouter" },
  "google-ai": { constructor: GoogleAIProvider, configKey: "googleAi" },
  groq: { constructor: GroqProvider, configKey: "groq" },
  mistral: { constructor: MistralProvider, configKey: "mistral" },
  codestral: { constructor: CodestralProvider, configKey: "codestral" },
  cerebras: { constructor: CerebrasProvider, configKey: "cerebras" },
  cohere: { constructor: CohereProvider, configKey: "cohere" },
  huggingface: { constructor: HuggingFaceProvider, configKey: "huggingface" },
  "nvidia-nim": { constructor: NvidiaNimProvider, configKey: "nvidiaNim" },
  "github-models": {
    constructor: GitHubModelsProvider,
    configKey: "githubModels",
  },
  cloudflare: {
    constructor: CloudflareProvider,
    configKey: "cloudflareAccountId",
  },
  "vertex-ai": { constructor: VertexAIProvider, configKey: "vertexProjectId" },
};

export class ProviderFactory {
  private static providers: Map<Provider, BaseProvider> = new Map();
  private static modelsCache: ModelInfo[] | null = null;

  static {
    // Initialize only providers with configured API keys
    for (const [name, { constructor, configKey }] of Object.entries(
      providerRegistry
    )) {
      const apiKey = config.providers[configKey];
      if (apiKey) {
        try {
          this.providers.set(name as Provider, new constructor());
          logger.info(`Provider initialized: ${name}`);
        } catch (error: any) {
          logger.warn(
            `Failed to initialize provider ${name}: ${error.message}`
          );
        }
      }
    }
  }

  static getProvider(name: Provider): BaseProvider {
    const provider = this.providers.get(name);
    if (!provider) {
      throw new GatewayError(
        400,
        `Provider not available: ${name}. Check API key configuration.`
      );
    }
    return provider;
  }

  static getAllProviders(): Provider[] {
    return Array.from(this.providers.keys());
  }

  static async getAllModels(): Promise<ModelInfo[]> {
    if (this.modelsCache) return this.modelsCache;

    const models: ModelInfo[] = [];
    const promises = Array.from(this.providers.entries()).map(
      async ([name, provider]) => {
        try {
          const providerModels = await provider.listModels();
          return providerModels;
        } catch (error: any) {
          logger.warn(`Failed to fetch models from ${name}: ${error.message}`);
          return [];
        }
      }
    );

    const results = await Promise.all(promises);
    for (const result of results) {
      models.push(...result);
    }

    this.modelsCache = models;
    // Clear cache after 5 minutes
    setTimeout(() => {
      this.modelsCache = null;
    }, 300000);

    return models;
  }

  static getAvailableProviders(): { name: Provider; available: boolean }[] {
    return Object.keys(providerRegistry).map((name) => ({
      name: name as Provider,
      available: this.providers.has(name as Provider),
    }));
  }
}
