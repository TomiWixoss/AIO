import { Response } from "express";
import {
  ChatCompletionRequest,
  ChatCompletionResponse,
  ModelInfo,
  Provider,
} from "../types/index.js";
import { dbGet } from "../utils/db-client.js";

interface DBModel {
  id: number;
  provider_id: number;
  model_id: string;
  display_name: string;
  context_length: number | null;
  is_active: boolean;
  provider_name: string;
}

interface DBProvider {
  id: number;
  name: string;
  display_name: string;
  base_url: string;
  is_active: boolean;
}

export abstract class BaseProvider {
  abstract readonly name: Provider;

  abstract chatCompletion(
    request: ChatCompletionRequest,
    apiKey: string
  ): Promise<ChatCompletionResponse>;

  abstract streamChatCompletion(
    request: ChatCompletionRequest,
    res: Response,
    apiKey: string
  ): Promise<void>;

  // Lấy models từ DB theo provider name
  async listModels(): Promise<ModelInfo[]> {
    try {
      // Lấy provider từ DB
      const provider = await dbGet<DBProvider>(`/providers/name/${this.name}`);
      if (!provider || !provider.id) {
        return [];
      }

      // Lấy models của provider
      const models = await dbGet<DBModel[]>(`/models/provider/${provider.id}`);

      return models.map((m) => ({
        id: m.model_id,
        provider: this.name,
        name: m.display_name,
        context_length: m.context_length || undefined,
      }));
    } catch (error) {
      // Fallback: trả về empty nếu DB không available
      return [];
    }
  }

  protected sendStreamChunk(res: Response, data: object): void {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  }

  protected sendStreamEnd(res: Response): void {
    res.write("data: [DONE]\n\n");
    res.end();
  }
}
