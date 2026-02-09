/**
 * OpenRouter Provider
 * https://openrouter.ai/api/v1
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
    if (!request.model) {
      throw new Error("Model is required");
    }

    const client = this.createClient(apiKey);

    // Build messages - OpenRouter uses system role in messages
    const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [];
    
    // Add system prompt as first message if provided
    if (request.systemPrompt) {
      messages.push({
        role: "system",
        content: request.systemPrompt,
      });
    }
    
    // Add user messages
    messages.push(...request.messages);

    const completion = await client.chat.completions.create({
      model: request.model,
      messages,
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
          // Lấy content hoặc reasoning (cho reasoning models)
          content: choice.message.content || (choice.message as any).reasoning || "",
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

    // Build messages - OpenRouter uses system role in messages
    const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [];
    
    // Add system prompt as first message if provided
    if (request.systemPrompt) {
      messages.push({
        role: "system",
        content: request.systemPrompt,
      });
    }
    
    // Add user messages
    messages.push(...request.messages);

    const stream = await client.chat.completions.create({
      model: request.model,
      messages,
      temperature: request.temperature,
      max_tokens: request.max_tokens,
      top_p: request.top_p,
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
          choices: [
            {
              index: 0,
              delta: {
                content,
              },
              finish_reason: chunk.choices[0].finish_reason,
            },
          ],
        });
      }
    }
    this.sendStreamEnd(res);
  }
}
