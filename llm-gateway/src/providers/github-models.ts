import OpenAI from "openai";
import { Response } from "express";
import { BaseProvider } from "./base.js";
import {
  ChatCompletionRequest,
  ChatCompletionResponse,
  ModelInfo,
  Provider,
} from "../types/index.js";
import { GatewayError } from "../middleware/errorHandler.js";
import { v4 as uuidv4 } from "uuid";

export class GitHubModelsProvider extends BaseProvider {
  readonly name: Provider = "github-models";
  private client: OpenAI;

  constructor() {
    super();
    const token = process.env.GITHUB_MODELS_TOKEN;
    if (!token) {
      throw new Error("GITHUB_MODELS_TOKEN is required");
    }
    // GitHub Models uses Azure AI Inference API (OpenAI-compatible)
    this.client = new OpenAI({
      baseURL: "https://models.inference.ai.azure.com",
      apiKey: token,
    });
  }

  async chatCompletion(
    request: ChatCompletionRequest
  ): Promise<ChatCompletionResponse> {
    try {
      const response = await this.client.chat.completions.create({
        model: request.model,
        messages: request.messages,
        temperature: request.temperature,
        max_tokens: request.max_tokens,
        top_p: request.top_p,
        stop: request.stop,
      });

      return {
        id: response.id || uuidv4(),
        provider: this.name,
        model: request.model,
        choices: response.choices.map((choice, index) => ({
          index,
          message: {
            role: "assistant",
            content: choice.message.content || "",
          },
          finish_reason: choice.finish_reason || "stop",
        })),
        usage: {
          prompt_tokens: response.usage?.prompt_tokens || 0,
          completion_tokens: response.usage?.completion_tokens || 0,
          total_tokens: response.usage?.total_tokens || 0,
        },
        created: response.created || Date.now(),
      };
    } catch (error: any) {
      throw new GatewayError(500, error.message, this.name);
    }
  }

  async streamChatCompletion(
    request: ChatCompletionRequest,
    res: Response
  ): Promise<void> {
    try {
      const stream = await this.client.chat.completions.create({
        model: request.model,
        messages: request.messages,
        temperature: request.temperature,
        max_tokens: request.max_tokens,
        top_p: request.top_p,
        stop: request.stop,
        stream: true,
      });

      for await (const chunk of stream) {
        this.sendStreamChunk(res, {
          id: chunk.id,
          provider: this.name,
          model: request.model,
          choices: chunk.choices.map((choice, index) => ({
            index,
            delta: {
              role: choice.delta.role,
              content: choice.delta.content,
            },
            finish_reason: choice.finish_reason,
          })),
        });
      }
      this.sendStreamEnd(res);
    } catch (error: any) {
      throw new GatewayError(500, error.message, this.name);
    }
  }

  async listModels(): Promise<ModelInfo[]> {
    return [
      { id: "gpt-4o", provider: this.name, name: "GPT-4o" },
      { id: "gpt-4o-mini", provider: this.name, name: "GPT-4o Mini" },
      {
        id: "Meta-Llama-3.1-8B-Instruct",
        provider: this.name,
        name: "Llama 3.1 8B Instruct",
      },
      {
        id: "Meta-Llama-3.1-70B-Instruct",
        provider: this.name,
        name: "Llama 3.1 70B Instruct",
      },
      {
        id: "Phi-3.5-mini-instruct",
        provider: this.name,
        name: "Phi 3.5 Mini Instruct",
      },
      { id: "DeepSeek-R1", provider: this.name, name: "DeepSeek R1" },
    ];
  }
}
