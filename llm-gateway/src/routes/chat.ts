import { Router, Request, Response, NextFunction } from "express";
import { ProviderFactory } from "../providers/factory.js";
import { ChatCompletionRequest } from "../types/index.js";
import { logger } from "../utils/logger.js";
import { validateBody } from "../middleware/validation.js";
import { ChatCompletionRequestSchema } from "../config/validation.js";
import { withRetry } from "../utils/retry.js";

export const chatRouter = Router();

chatRouter.post(
  "/completions",
  validateBody(ChatCompletionRequestSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = req.body as ChatCompletionRequest;

      logger.info("Chat completion request", {
        provider: body.provider,
        model: body.model,
        stream: body.stream,
      });

      if (body.stream) {
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");

        await withRetry(() => ProviderFactory.streamChatCompletion(body, res));
      } else {
        const { response } = await withRetry(() =>
          ProviderFactory.chatCompletion(body)
        );
        res.json(response);
      }
    } catch (error) {
      next(error);
    }
  }
);
