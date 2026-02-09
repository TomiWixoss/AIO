/**
 * Groq Provider
 * https://api.groq.com/openai/v1
 */

import Groq from "groq-sdk";
import { Response } from "express";
import { BaseProvider } from "./base.js";
import type {
  ChatCompletionRequest,
  ChatCompletionResponse,
  Provider,
} from "../types.js";
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
    if (!request.model) {
      throw new Error("Model is required");
    }

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
  }

  async streamChatCompletion(
    request: ChatCompletionRequest,
    res: Response,
    apiKey: string
  ): Promise<void> {
    if (!request.model) {
      throw new Error("Model is required");
    }

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
  }
}
