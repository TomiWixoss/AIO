/**
 * Cerebras Provider
 * https://api.cerebras.ai/v1
 */

import OpenAI from "openai";
import { Response } from "express";
import { BaseProvider } from "./base.js";
import type {
  ChatCompletionRequest,
  ChatCompletionResponse,
  Provider,
} from "../types.js";
import { v4 as uuidv4 } from "uuid";

export class CerebrasProvider extends BaseProvider {
  readonly name: Provider = "cerebras";

  private createClient(apiKey: string): OpenAI {
    return new OpenAI({ baseURL: "https://api.cerebras.ai/v1", apiKey });
  }

  async chatCompletion(
    request: ChatCompletionRequest,
    apiKey: string
  ): Promise<ChatCompletionResponse> {
    if (!request.model) {
      throw new Error("Model is required");
    }

    const client = this.createClient(apiKey);
    
    // Build messages với systemPrompt nếu có
    const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = request.systemPrompt
      ? [{ role: "system", content: request.systemPrompt }, ...request.messages]
      : [...request.messages];
    
    const response = await client.chat.completions.create({
      model: request.model,
      messages,
      temperature: request.temperature,
      max_tokens: request.max_tokens,
      top_p: request.top_p,
      stop: request.stop,
      response_format: request.response_format as any,
    });

    return {
      id: response.id || uuidv4(),
      provider: this.name,
      model: request.model,
      choices: response.choices.map((choice, index) => ({
        index,
        message: {
          role: "assistant",
          // Lấy content hoặc reasoning (cho reasoning models)
          content: choice.message.content || (choice.message as any).reasoning || "",
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
    
    // Build messages với systemPrompt nếu có
    const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = request.systemPrompt
      ? [{ role: "system", content: request.systemPrompt }, ...request.messages]
      : [...request.messages];
    
    const stream = await client.chat.completions.create({
      model: request.model,
      messages,
      temperature: request.temperature,
      max_tokens: request.max_tokens,
      top_p: request.top_p,
      stop: request.stop,
      response_format: request.response_format as any,
      stream: true,
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;
      const content = delta?.content || (delta as any)?.reasoning || "";

      if (content || chunk.choices[0]?.finish_reason) {
        this.sendStreamChunk(res, {
          id: chunk.id,
          provider: this.name,
          model: request.model,
          choices: chunk.choices.map((choice, index) => ({
            index,
            delta: { role: choice.delta.role, content },
            finish_reason: choice.finish_reason,
          })),
        });
      }
    }
    this.sendStreamEnd(res);
  }
}
