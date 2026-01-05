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

export class NvidiaNimProvider extends BaseProvider {
  readonly name: Provider = "nvidia-nim";
  private client: OpenAI;

  constructor() {
    super();
    const apiKey = process.env.NVIDIA_NIM_API_KEY;
    if (!apiKey) {
      throw new Error("NVIDIA_NIM_API_KEY is required");
    }
    // NVIDIA NIM uses OpenAI-compatible API
    this.client = new OpenAI({
      baseURL: "https://integrate.api.nvidia.com/v1",
      apiKey,
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
      {
        id: "meta/llama-3.1-8b-instruct",
        provider: this.name,
        name: "Llama 3.1 8B Instruct",
      },
      {
        id: "meta/llama-3.1-70b-instruct",
        provider: this.name,
        name: "Llama 3.1 70B Instruct",
      },
      {
        id: "mistralai/mistral-7b-instruct-v0.3",
        provider: this.name,
        name: "Mistral 7B Instruct v0.3",
      },
      {
        id: "google/gemma-2-9b-it",
        provider: this.name,
        name: "Gemma 2 9B IT",
      },
      {
        id: "nvidia/llama-3.1-nemotron-70b-instruct",
        provider: this.name,
        name: "Nemotron 70B Instruct",
      },
    ];
  }
}
