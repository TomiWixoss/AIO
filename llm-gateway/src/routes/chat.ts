import { Router, Request, Response, NextFunction } from "express";
import { ProviderFactory } from "../providers/factory.js";
import { ChatCompletionRequest } from "../types/index.js";
import { GatewayError } from "../middleware/errorHandler.js";
import { logger } from "../utils/logger.js";

export const chatRouter = Router();

chatRouter.post(
  "/completions",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = req.body as ChatCompletionRequest;

      if (!body.provider) {
        throw new GatewayError(400, "Provider is required");
      }
      if (!body.model) {
        throw new GatewayError(400, "Model is required");
      }
      if (!body.messages || body.messages.length === 0) {
        throw new GatewayError(400, "Messages are required");
      }

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

        await provider.streamChatCompletion(body, res);
      } else {
        const response = await provider.chatCompletion(body);
        res.json(response);
      }
    } catch (error) {
      next(error);
    }
  }
);
