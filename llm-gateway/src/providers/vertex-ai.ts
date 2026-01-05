import { GoogleGenAI } from "@google/genai";
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

export class VertexAIProvider extends BaseProvider {
  readonly name: Provider = "vertex-ai";
  private client: GoogleGenAI;
  private projectId: string;
  private location: string;

  constructor() {
    super();
    const projectId = process.env.GOOGLE_VERTEX_PROJECT_ID;
    const location = process.env.GOOGLE_VERTEX_LOCATION || "us-central1";

    if (!projectId) {
      throw new Error("GOOGLE_VERTEX_PROJECT_ID is required");
    }

    this.projectId = projectId;
    this.location = location;

    // Use Vertex AI endpoint
    this.client = new GoogleGenAI({
      vertexai: true,
      project: projectId,
      location: location,
    });
  }

  async chatCompletion(
    request: ChatCompletionRequest
  ): Promise<ChatCompletionResponse> {
    try {
      const contents = request.messages
        .filter((m) => m.role !== "system")
        .map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        }));

      const systemInstruction = request.messages.find(
        (m) => m.role === "system"
      )?.content;

      const response = await this.client.models.generateContent({
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
    } catch (error: any) {
      throw new GatewayError(500, error.message, this.name);
    }
  }

  async streamChatCompletion(
    request: ChatCompletionRequest,
    res: Response
  ): Promise<void> {
    try {
      const contents = request.messages
        .filter((m) => m.role !== "system")
        .map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        }));

      const systemInstruction = request.messages.find(
        (m) => m.role === "system"
      )?.content;

      const stream = await this.client.models.generateContentStream({
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
    } catch (error: any) {
      throw new GatewayError(500, error.message, this.name);
    }
  }

  async listModels(): Promise<ModelInfo[]> {
    return [
      {
        id: "gemini-2.5-flash",
        provider: this.name,
        name: "Gemini 2.5 Flash",
        context_length: 1000000,
      },
      {
        id: "gemini-2.5-pro",
        provider: this.name,
        name: "Gemini 2.5 Pro",
        context_length: 1000000,
      },
      {
        id: "gemini-2.0-flash",
        provider: this.name,
        name: "Gemini 2.0 Flash",
        context_length: 1000000,
      },
      {
        id: "gemini-1.5-flash",
        provider: this.name,
        name: "Gemini 1.5 Flash",
        context_length: 1000000,
      },
      {
        id: "gemini-1.5-pro",
        provider: this.name,
        name: "Gemini 1.5 Pro",
        context_length: 2000000,
      },
    ];
  }
}
