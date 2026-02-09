/**
 * Google AI Provider
 * https://generativelanguage.googleapis.com/v1beta
 */

import { GoogleGenAI } from "@google/genai";
import { Response } from "express";
import { BaseProvider } from "./base.js";
import type {
  ChatCompletionRequest,
  ChatCompletionResponse,
  Provider,
} from "../types.js";
import { v4 as uuidv4 } from "uuid";

export class GoogleAIProvider extends BaseProvider {
  readonly name: Provider = "google-ai";

  private createClient(apiKey: string): GoogleGenAI {
    return new GoogleGenAI({ apiKey });
  }

  // Convert messages sang format Google AI
  // Google AI dùng role: "user" | "model", không có "assistant"
  private buildContents(messages: ChatCompletionRequest["messages"]) {
    return messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));
  }

  // Lấy system instruction từ messages
  private getSystemInstruction(messages: ChatCompletionRequest["messages"]) {
    return messages.find((m) => m.role === "system")?.content;
  }

  async chatCompletion(
    request: ChatCompletionRequest,
    apiKey: string
  ): Promise<ChatCompletionResponse> {
    if (!request.model) {
      throw new Error("Model is required");
    }

    const client = this.createClient(apiKey);
    const contents = this.buildContents(request.messages);
    const systemInstruction = this.getSystemInstruction(request.messages);

    const response = await client.models.generateContent({
      model: request.model,
      contents,
      config: {
        systemInstruction,
        temperature: request.temperature,
        maxOutputTokens: request.max_tokens,
        topP: request.top_p,
        stopSequences: request.stop,
      },
    });

    const text = response.text || "";

    return {
      id: uuidv4(),
      provider: this.name,
      model: request.model,
      choices: [
        {
          index: 0,
          message: { role: "assistant", content: text },
          finish_reason: "stop",
        },
      ],
      usage: {
        prompt_tokens: response.usageMetadata?.promptTokenCount || 0,
        completion_tokens: response.usageMetadata?.candidatesTokenCount || 0,
        total_tokens: response.usageMetadata?.totalTokenCount || 0,
      },
      created: Date.now(),
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
    const contents = this.buildContents(request.messages);
    const systemInstruction = this.getSystemInstruction(request.messages);

    const stream = await client.models.generateContentStream({
      model: request.model,
      contents,
      config: {
        systemInstruction,
        temperature: request.temperature,
        maxOutputTokens: request.max_tokens,
        topP: request.top_p,
      },
    });

    const id = uuidv4();
    for await (const chunk of stream) {
      this.sendStreamChunk(res, {
        id,
        provider: this.name,
        model: request.model,
        choices: [
          {
            index: 0,
            delta: { content: chunk.text || "" },
            finish_reason: null,
          },
        ],
      });
    }
    this.sendStreamEnd(res);
  }
}
