import { CohereClientV2 } from "cohere-ai";
import { Response } from "express";
import { BaseProvider } from "./base.js";
import {
  ChatCompletionRequest,
  ChatCompletionResponse,
  Provider,
} from "../types/index.js";
import { GatewayError } from "../middleware/errorHandler.js";
import { v4 as uuidv4 } from "uuid";

export class CohereProvider extends BaseProvider {
  readonly name: Provider = "cohere";

  private createClient(apiKey: string): CohereClientV2 {
    return new CohereClientV2({ token: apiKey });
  }

  async chatCompletion(
    request: ChatCompletionRequest,
    apiKey: string
  ): Promise<ChatCompletionResponse> {
    try {
      const client = this.createClient(apiKey);
      const response = await client.chat({
        model: request.model,
        messages: request.messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        temperature: request.temperature,
        maxTokens: request.max_tokens,
        p: request.top_p,
        stopSequences: request.stop,
      });

      const content = response.message?.content;
      const text =
        Array.isArray(content) && content[0]?.type === "text"
          ? content[0].text
          : "";

      return {
        id: response.id || uuidv4(),
        provider: this.name,
        model: request.model,
        choices: [
          {
            index: 0,
            message: { role: "assistant", content: text },
            finish_reason: response.finishReason || "stop",
          },
        ],
        usage: {
          prompt_tokens: response.usage?.tokens?.inputTokens || 0,
          completion_tokens: response.usage?.tokens?.outputTokens || 0,
          total_tokens:
            (response.usage?.tokens?.inputTokens || 0) +
            (response.usage?.tokens?.outputTokens || 0),
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
      const stream = await client.chatStream({
        model: request.model,
        messages: request.messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        temperature: request.temperature,
        maxTokens: request.max_tokens,
        p: request.top_p,
      });

      const id = uuidv4();
      for await (const event of stream) {
        if (event.type === "content-delta") {
          this.sendStreamChunk(res, {
            id,
            provider: this.name,
            model: request.model,
            choices: [
              {
                index: 0,
                delta: { content: event.delta?.message?.content?.text || "" },
                finish_reason: null,
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
