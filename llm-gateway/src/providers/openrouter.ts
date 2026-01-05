import OpenAI from "openai";
import { Response } from "express";
import { BaseProvider } from "./base.js";
import {
  ChatCompletionRequest,
  ChatCompletionResponse,
  Provider,
} from "../types/index.js";
import { GatewayError } from "../middleware/errorHandler.js";
import { v4 as uuidv4 } from "uuid";
import { logger } from "../utils/logger.js";

export class OpenRouterProvider extends BaseProvider {
  readonly name: Provider = "openrouter";

  private createClient(apiKey: string): OpenAI {
    return new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey,
    });
  }

  async chatCompletion(
    request: ChatCompletionRequest,
    apiKey: string
  ): Promise<ChatCompletionResponse> {
    try {
      const client = this.createClient(apiKey);

      logger.info("OpenRouter request:", {
        model: request.model,
        messages: request.messages,
      });

      const completion = await client.chat.completions.create({
        model: request.model,
        messages: request.messages.map((m) => ({
          role: m.role as "system" | "user" | "assistant",
          content: m.content,
        })),
        temperature: request.temperature,
        max_tokens: request.max_tokens,
        top_p: request.top_p,
      });

      return {
        id: completion.id || uuidv4(),
        provider: this.name,
        model: request.model,
        choices: completion.choices.map((choice) => ({
          index: choice.index,
          message: {
            role: "assistant" as const,
            content: choice.message.content || "",
          },
          finish_reason: choice.finish_reason || "stop",
        })),
        usage: {
          prompt_tokens: completion.usage?.prompt_tokens || 0,
          completion_tokens: completion.usage?.completion_tokens || 0,
          total_tokens: completion.usage?.total_tokens || 0,
        },
        created: completion.created || Date.now(),
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
        messages: request.messages.map((m) => ({
          role: m.role as "system" | "user" | "assistant",
          content: m.content,
        })),
        temperature: request.temperature,
        max_tokens: request.max_tokens,
        top_p: request.top_p,
        stream: true,
      });

      for await (const chunk of stream) {
        if (chunk.choices[0]?.delta?.content) {
          this.sendStreamChunk(res, {
            id: chunk.id,
            provider: this.name,
            model: request.model,
            choices: [
              {
                index: 0,
                delta: {
                  content: chunk.choices[0].delta.content,
                },
                finish_reason: chunk.choices[0].finish_reason,
              },
            ],
          });
        }
      }
      this.sendStreamEnd(res);
    } catch (error: any) {
      throw new GatewayError(500, error.message, this.name);
    }
  }
}
