import { Request, Response, NextFunction } from "express";
import { config } from "../config/index.js";
import { GatewayError } from "./errorHandler.js";

export function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  // Skip auth if not enabled
  if (!config.auth.enabled) {
    return next();
  }

  const authHeader = req.headers.authorization;

  if (!authHeader) {
    throw new GatewayError(401, "Missing Authorization header");
  }

  const [type, token] = authHeader.split(" ");

  if (type !== "Bearer" || !token) {
    throw new GatewayError(
      401,
      "Invalid Authorization format. Use: Bearer <api_key>"
    );
  }

  if (!config.auth.apiKeys.includes(token)) {
    throw new GatewayError(403, "Invalid API key");
  }

  next();
}
