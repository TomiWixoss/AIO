import { Mistral } from "@mistralai/mistralai";
import { Response } from "express";
import { BaseProvider } from "./base.js";
import {
  ChatCompletionRequest,
  ChatCompletionResponse,
  Provider,
} from "../types/index.js";
import { GatewayError } from "../middleware/errorHandler.js";
import { v4 as uuidv4 } from "uuid";

export class MistralProvider extends BaseProvider {
  readonly name: Provider = "mistral";

  private createClient(apiKey: string): Mistral {
    return new Mistral({ apiKey });
  }

  async chatCompletion(
    request: ChatCompletionRequest,
    apiKey: string
  ): Promise<ChatCompletionResponse> {
    try {
      const client = this.createClient(apiKey);
      const response = await client.chat.complete({
        model: request.model,
        messages: request.messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        temperature: request.temperature,
        maxTokens: request.max_tokens,
        topP: request.top_p,
        stop: request.stop,
      });

      const choice = response.choices?.[0];

      return {
        id: response.id || uuidv4(),
        provider: this.name,
        model: request.model,
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content:
                typeof choice?.message?.content === "string"
                  ? choice.message.content
                  : "",
            },
            finish_reason: choice?.finishReason || "stop",
          },
        ],
        usage: {
          prompt_tokens: response.usage?.promptTokens || 0,
          completion_tokens: response.usage?.completionTokens || 0,
          total_tokens: response.usage?.totalTokens || 0,
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
      const stream = await client.chat.stream({
        model: request.model,
        messages: request.messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        temperature: request.temperature,
        maxTokens: request.max_tokens,
        topP: request.top_p,
      });

      const id = uuidv4();
      for await (const event of stream) {
        const choice = event.data.choices?.[0];
        this.sendStreamChunk(res, {
          id,
          provider: this.name,
          model: request.model,
          choices: [
            {
              index: 0,
              delta: {
                role: choice?.delta?.role,
                content: choice?.delta?.content,
              },
              finish_reason: choice?.finishReason || null,
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
