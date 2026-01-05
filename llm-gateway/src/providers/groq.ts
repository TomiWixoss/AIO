import Groq from "groq-sdk";
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

export class GroqProvider extends BaseProvider {
  readonly name: Provider = "groq";

  private createClient(apiKey: string): Groq {
    return new Groq({ apiKey });
  }

  async chatCompletion(
    request: ChatCompletionRequest,
    apiKey: string
  ): Promise<ChatCompletionResponse> {
    try {
      const client = this.createClient(apiKey);
      const response = await client.chat.completions.create({
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
    res: Response,
    apiKey: string
  ): Promise<void> {
    try {
      const client = this.createClient(apiKey);
      const stream = await client.chat.completions.create({
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
        id: "llama-3.3-70b-versatile",
        provider: this.name,
        name: "Llama 3.3 70B Versatile",
        context_length: 128000,
      },
      {
        id: "llama-3.1-8b-instant",
        provider: this.name,
        name: "Llama 3.1 8B Instant",
        context_length: 128000,
      },
      {
        id: "gemma2-9b-it",
        provider: this.name,
        name: "Gemma 2 9B IT",
        context_length: 8192,
      },
      {
        id: "mixtral-8x7b-32768",
        provider: this.name,
        name: "Mixtral 8x7B",
        context_length: 32768,
      },
    ];
  }
}
