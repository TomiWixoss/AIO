import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger.js";

export class GatewayError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public provider?: string
  ) {
    super(message);
    this.name = "GatewayError";
  }
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  logger.error("Error:", { error: err.message, stack: err.stack });

  if (err instanceof GatewayError) {
    return res.status(err.statusCode).json({
      error: {
        message: err.message,
        provider: err.provider,
        type: "gateway_error",
      },
    });
  }

  return res.status(500).json({
    error: {
      message: "Internal server error",
      type: "internal_error",
    },
  });
}
