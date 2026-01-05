import { Mistral } from "@mistralai/mistralai";
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

export class MistralProvider extends BaseProvider {
  readonly name: Provider = "mistral";
  private client: Mistral;

  constructor() {
    super();
    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) {
      throw new Error("MISTRAL_API_KEY is required");
    }
    this.client = new Mistral({ apiKey });
  }

  async chatCompletion(
    request: ChatCompletionRequest
  ): Promise<ChatCompletionResponse> {
    try {
      const response = await this.client.chat.complete({
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
    res: Response
  ): Promise<void> {
    try {
      const stream = await this.client.chat.stream({
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

  async listModels(): Promise<ModelInfo[]> {
    return [
      {
        id: "mistral-small-latest",
        provider: this.name,
        name: "Mistral Small",
        context_length: 32000,
      },
      {
        id: "mistral-medium-latest",
        provider: this.name,
        name: "Mistral Medium",
        context_length: 32000,
      },
      {
        id: "open-mistral-7b",
        provider: this.name,
        name: "Mistral 7B",
        context_length: 32000,
      },
      {
        id: "open-mixtral-8x7b",
        provider: this.name,
        name: "Mixtral 8x7B",
        context_length: 32000,
      },
      {
        id: "pixtral-12b-2409",
        provider: this.name,
        name: "Pixtral 12B",
        context_length: 128000,
      },
    ];
  }
}
