import { Router, Request, Response, NextFunction } from "express";
import { ProviderFactory } from "../providers/factory.js";
import { ChatCompletionRequest } from "../types/index.js";
import { logger } from "../utils/logger.js";
import { validateBody } from "../middleware/validation.js";
import { ChatCompletionRequestSchema } from "../config/validation.js";
import { responseCache } from "../utils/cache.js";
import { withRetry } from "../utils/retry.js";

export const chatRouter = Router();

chatRouter.post(
  "/completions",
  validateBody(ChatCompletionRequestSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = req.body as ChatCompletionRequest;
      const provider = ProviderFactory.getProvider(body.provider);

      logger.info("Chat completion request", {
        provider: body.provider,
        model: body.model,
        stream: body.stream,
      });

      if (body.stream) {
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");

        await withRetry(() => provider.streamChatCompletion(body, res));
      } else {
        // Check cache first
        const cached = responseCache.get(body);
        if (cached) {
          logger.info("Cache hit", {
            provider: body.provider,
            model: body.model,
          });
          res.setHeader("X-Cache", "HIT");
          return res.json(cached);
        }

        const response = await withRetry(() => provider.chatCompletion(body));

        // Store in cache
        responseCache.set(body, response);
        res.setHeader("X-Cache", "MISS");
        res.json(response);
      }
    } catch (error) {
      next(error);
    }
  }
);
