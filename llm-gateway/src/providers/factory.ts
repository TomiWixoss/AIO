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

export class ProviderFactory {
  private static providers: Map<Provider, BaseProvider> = new Map();

  static {
    // Initialize all providers
    this.providers.set("openrouter", new OpenRouterProvider());
    this.providers.set("google-ai", new GoogleAIProvider());
    this.providers.set("groq", new GroqProvider());
    this.providers.set("mistral", new MistralProvider());
    this.providers.set("codestral", new CodestralProvider());
    this.providers.set("cerebras", new CerebrasProvider());
    this.providers.set("cohere", new CohereProvider());
    this.providers.set("huggingface", new HuggingFaceProvider());
    this.providers.set("nvidia-nim", new NvidiaNimProvider());
    this.providers.set("github-models", new GitHubModelsProvider());
    this.providers.set("cloudflare", new CloudflareProvider());
    this.providers.set("vertex-ai", new VertexAIProvider());
  }

  static getProvider(name: Provider): BaseProvider {
    const provider = this.providers.get(name);
    if (!provider) {
      throw new GatewayError(400, `Unknown provider: ${name}`);
    }
    return provider;
  }

  static getAllProviders(): Provider[] {
    return Array.from(this.providers.keys());
  }

  static getAllModels(): ModelInfo[] {
    const models: ModelInfo[] = [];
    for (const provider of this.providers.values()) {
      // Return cached/static models for quick response
    }
    return models;
  }
}
