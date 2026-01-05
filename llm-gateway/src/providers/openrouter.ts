import { OpenRouter } from "@openrouter/sdk";
import { Response } from "express";
import { BaseProvider } from "./base.js";
import {
  ChatCompletionRequest,
  ChatCompletionResponse,
  Provider,
} from "../types/index.js";
import { GatewayError } from "../middleware/errorHandler.js";
import { v4 as uuidv4 } from "uuid";

export class OpenRouterProvider extends BaseProvider {
  readonly name: Provider = "openrouter";

  private createClient(apiKey: string): OpenRouter {
    return new OpenRouter({ apiKey });
  }

  // Convert messages sang format OpenRouter SDK
  private buildInput(messages: ChatCompletionRequest["messages"]) {
    // Lọc bỏ system messages (sẽ dùng instructions)
    return messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));
  }

  // Lấy system instruction từ messages
  private getInstructions(messages: ChatCompletionRequest["messages"]) {
    return messages.find((m) => m.role === "system")?.content;
  }

  async chatCompletion(
    request: ChatCompletionRequest,
    apiKey: string
  ): Promise<ChatCompletionResponse> {
    try {
      const client = this.createClient(apiKey);
      const input = this.buildInput(request.messages);
      const instructions = this.getInstructions(request.messages);

      // SDK mới dùng callModel
      const result = client.callModel({
        model: request.model,
        input,
        instructions,
        temperature: request.temperature,
        maxOutputTokens: request.max_tokens,
        topP: request.top_p,
      });

      const response = await result.getResponse();
      const text = await result.getText();

      return {
        id: uuidv4(),
        provider: this.name,
        model: request.model,
        choices: [
          {
            index: 0,
            message: {
              role: "assistant" as const,
              content: text || "",
            },
            finish_reason: "stop",
          },
        ],
        usage: {
          prompt_tokens: response.usage?.inputTokens || 0,
          completion_tokens: response.usage?.outputTokens || 0,
          total_tokens:
            (response.usage?.inputTokens || 0) +
            (response.usage?.outputTokens || 0),
        },
        created: Date.now(),
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
      const input = this.buildInput(request.messages);
      const instructions = this.getInstructions(request.messages);

      const result = client.callModel({
        model: request.model,
        input,
        instructions,
        temperature: request.temperature,
        maxOutputTokens: request.max_tokens,
        topP: request.top_p,
      });

      const id = uuidv4();

      // Dùng getTextStream() để stream
      for await (const delta of result.getTextStream()) {
        this.sendStreamChunk(res, {
          id,
          provider: this.name,
          model: request.model,
          choices: [
            {
              index: 0,
              delta: {
                content: delta || "",
              },
              finish_reason: null,
            },
          ],
        });
      }
      this.sendStreamEnd(res);
    } catch (error: any) {
      throw new GatewayError(500, error.message, this.name);
    }
  }
}
