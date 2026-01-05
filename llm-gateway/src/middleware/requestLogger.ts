import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger.js";
import { v4 as uuidv4 } from "uuid";

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const requestId = uuidv4();
  const startTime = Date.now();

  res.setHeader("X-Request-ID", requestId);

  res.on("finish", () => {
    const duration = Date.now() - startTime;
    logger.info("Request completed", {
      requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
    });
  });

  next();
}
