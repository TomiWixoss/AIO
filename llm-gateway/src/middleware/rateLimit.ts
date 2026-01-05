import { Request, Response, NextFunction } from "express";
import { config } from "../config/index.js";
import { GatewayError } from "./errorHandler.js";

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Cleanup every minute

function getClientKey(req: Request): string {
  // Use API key if available, otherwise use IP
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const [, token] = authHeader.split(" ");
    if (token) return `key:${token}`;
  }

  const ip = req.ip || req.socket.remoteAddress || "unknown";
  return `ip:${ip}`;
}

export function rateLimitMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const clientKey = getClientKey(req);
  const now = Date.now();
  const { windowMs, maxRequests } = config.rateLimit;

  let entry = rateLimitStore.get(clientKey);

  if (!entry || now > entry.resetTime) {
    entry = { count: 0, resetTime: now + windowMs };
    rateLimitStore.set(clientKey, entry);
  }

  entry.count++;

  // Set rate limit headers
  res.setHeader("X-RateLimit-Limit", maxRequests);
  res.setHeader(
    "X-RateLimit-Remaining",
    Math.max(0, maxRequests - entry.count)
  );
  res.setHeader("X-RateLimit-Reset", Math.ceil(entry.resetTime / 1000));

  if (entry.count > maxRequests) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
    res.setHeader("Retry-After", retryAfter);
    throw new GatewayError(
      429,
      `Rate limit exceeded. Try again in ${retryAfter} seconds`
    );
  }

  next();
}
