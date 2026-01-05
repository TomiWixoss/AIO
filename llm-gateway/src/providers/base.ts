import { Response } from "express";
import {
  ChatCompletionRequest,
  ChatCompletionResponse,
  ModelInfo,
  Provider,
} from "../types/index.js";

export abstract class BaseProvider {
  abstract readonly name: Provider;

  abstract chatCompletion(
    request: ChatCompletionRequest
  ): Promise<ChatCompletionResponse>;

  abstract streamChatCompletion(
    request: ChatCompletionRequest,
    res: Response
  ): Promise<void>;

  abstract listModels(): Promise<ModelInfo[]>;

  protected sendStreamChunk(res: Response, data: object): void {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  }

  protected sendStreamEnd(res: Response): void {
    res.write("data: [DONE]\n\n");
    res.end();
  }
}
