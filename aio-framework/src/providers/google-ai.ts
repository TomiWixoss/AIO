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
      .map((m) => {
        const role = m.role === "assistant" ? "model" : "user";
        
        // Nếu content là string - text đơn giản
        if (typeof m.content === "string") {
          return {
            role,
            parts: [{ text: m.content }],
          };
        }
        
        // Nếu content là array - multimodal (text + images/files)
        const parts = m.content.map((item) => {
          if (item.type === "text") {
            return { text: item.text };
          }
          
          if (item.type === "image" || item.type === "file") {
            const source = item.source;
            
            // Inline data (base64)
            if (source.type === "base64" && source.data) {
              return {
                inlineData: {
                  mimeType: source.media_type,
                  data: source.data,
                },
              };
            }
            
            // File URI (URL)
            if (source.type === "url" && source.url) {
              return {
                fileData: {
                  mimeType: source.media_type,
                  fileUri: source.url,
                },
              };
            }
          }
          
          // Fallback - text
          return { text: "" };
        });
        
        return { role, parts };
      });
  }

  // Lấy system instruction từ request.systemPrompt
  private getSystemInstruction(request: ChatCompletionRequest) {
    return request.systemPrompt;
  }

  // Convert response_format sang Google AI format
  private buildResponseConfig(responseFormat?: ChatCompletionRequest["response_format"]) {
    if (!responseFormat || responseFormat.type === "text") {
      return {}; // Default - plain text
    }

    if (responseFormat.type === "json_object") {
      // JSON mode - chỉ cần set MIME type
      return {
        responseMimeType: "application/json",
      };
    }

    if (responseFormat.type === "json_schema") {
      // Structured outputs - MIME type + schema
      return {
        responseMimeType: "application/json",
        responseSchema: responseFormat.json_schema.schema,
      };
    }

    return {};
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
    const systemInstruction = this.getSystemInstruction(request);
    const responseConfig = this.buildResponseConfig(request.response_format);

    const response = await client.models.generateContent({
      model: request.model,
      contents,
      config: {
        systemInstruction,
        temperature: request.temperature,
        maxOutputTokens: request.max_tokens,
        topP: request.top_p,
        topK: request.top_k,
        stopSequences: request.stop,
        ...responseConfig,
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
    const systemInstruction = this.getSystemInstruction(request);
    const responseConfig = this.buildResponseConfig(request.response_format);

    const stream = await client.models.generateContentStream({
      model: request.model,
      contents,
      config: {
        systemInstruction,
        temperature: request.temperature,
        maxOutputTokens: request.max_tokens,
        topP: request.top_p,
        topK: request.top_k,
        ...responseConfig,
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
