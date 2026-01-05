import { Response } from "express";
import { BaseProvider } from "./base.js";
import {
  ChatCompletionRequest,
  ChatCompletionResponse,
  Provider,
} from "../types/index.js";
import { GatewayError } from "../middleware/errorHandler.js";
import { v4 as uuidv4 } from "uuid";

export class CloudflareProvider extends BaseProvider {
  readonly name: Provider = "cloudflare";

  // Cloudflare needs accountId + apiToken, stored as "accountId:apiToken"
  private parseKey(apiKey: string): { accountId: string; apiToken: string } {
    const [accountId, apiToken] = apiKey.split(":");
    if (!accountId || !apiToken) {
      throw new GatewayError(
        400,
        "Invalid Cloudflare key format. Expected accountId:apiToken"
      );
    }
    return { accountId, apiToken };
  }

  private getBaseUrl(accountId: string, model: string): string {
    return `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`;
  }

  async chatCompletion(
    request: ChatCompletionRequest,
    apiKey: string
  ): Promise<ChatCompletionResponse> {
    try {
      const { accountId, apiToken } = this.parseKey(apiKey);
      const response = await fetch(this.getBaseUrl(accountId, request.model), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiToken}`,
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
        usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
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
      const { accountId, apiToken } = this.parseKey(apiKey);
      const response = await fetch(this.getBaseUrl(accountId, request.model), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiToken}`,
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
}
