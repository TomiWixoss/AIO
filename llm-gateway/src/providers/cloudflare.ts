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

export class CloudflareProvider extends BaseProvider {
  readonly name: Provider = "cloudflare";
  private accountId: string;
  private apiToken: string;

  constructor() {
    super();
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const apiToken = process.env.CLOUDFLARE_API_TOKEN;
    if (!accountId || !apiToken) {
      throw new Error(
        "CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN are required"
      );
    }
    this.accountId = accountId;
    this.apiToken = apiToken;
  }

  private getBaseUrl(model: string): string {
    return `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/ai/run/${model}`;
  }

  async chatCompletion(
    request: ChatCompletionRequest
  ): Promise<ChatCompletionResponse> {
    try {
      const response = await fetch(this.getBaseUrl(request.model), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: request.messages,
          max_tokens: request.max_tokens,
          temperature: request.temperature,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Cloudflare API error: ${error}`);
      }

      const data = (await response.json()) as any;

      return {
        id: uuidv4(),
        provider: this.name,
        model: request.model,
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: data.result?.response || "",
            },
            finish_reason: "stop",
          },
        ],
        usage: {
          prompt_tokens: 0,
          completion_tokens: 0,
          total_tokens: 0,
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
      const response = await fetch(this.getBaseUrl(request.model), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: request.messages,
          max_tokens: request.max_tokens,
          temperature: request.temperature,
          stream: true,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error("Cloudflare streaming error");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      const id = uuidv4();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk
          .split("\n")
          .filter((line) => line.startsWith("data: "));

        for (const line of lines) {
          const data = line.slice(6);
          if (data === "[DONE]") continue;

          try {
            const parsed = JSON.parse(data);
            this.sendStreamChunk(res, {
              id,
              provider: this.name,
              model: request.model,
              choices: [
                {
                  index: 0,
                  delta: { content: parsed.response || "" },
                  finish_reason: null,
                },
              ],
            });
          } catch {
            // Skip invalid JSON
          }
        }
      }
      this.sendStreamEnd(res);
    } catch (error: any) {
      throw new GatewayError(500, error.message, this.name);
    }
  }

  async listModels(): Promise<ModelInfo[]> {
    return [
      {
        id: "@cf/meta/llama-3.1-8b-instruct",
        provider: this.name,
        name: "Llama 3.1 8B Instruct",
      },
      {
        id: "@cf/meta/llama-3.2-3b-instruct",
        provider: this.name,
        name: "Llama 3.2 3B Instruct",
      },
      {
        id: "@cf/mistral/mistral-7b-instruct-v0.2",
        provider: this.name,
        name: "Mistral 7B Instruct v0.2",
      },
      {
        id: "@cf/google/gemma-7b-it",
        provider: this.name,
        name: "Gemma 7B IT",
      },
      {
        id: "@cf/qwen/qwen1.5-14b-chat-awq",
        provider: this.name,
        name: "Qwen 1.5 14B Chat",
      },
    ];
  }
}
