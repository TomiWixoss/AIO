/**
 * Base Provider Class
 * Abstract class cho tất cả providers
 */

import type {
  ChatCompletionRequest,
  ChatCompletionResponse,
  Provider,
} from "../types.js";
import { Response } from "express";

export abstract class BaseProvider {
  abstract readonly name: Provider;

  /**
   * Chat completion (non-streaming)
   */
  abstract chatCompletion(
    request: ChatCompletionRequest,
    apiKey: string
  ): Promise<ChatCompletionResponse>;

  /**
   * Chat completion (streaming)
   */
  abstract streamChatCompletion(
    request: ChatCompletionRequest,
    res: Response,
    apiKey: string
  ): Promise<void>;

  /**
   * Helper: Send stream chunk
   */
  protected sendStreamChunk(res: Response, data: object): void {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  }

  /**
   * Helper: Send stream end
   */
  protected sendStreamEnd(res: Response): void {
    res.write("data: [DONE]\n\n");
    res.end();
  }
}
