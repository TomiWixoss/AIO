import createError from "http-errors";

// Custom error classes
export class AppError extends Error {
  statusCode: number;
  code: string;
  details?: any;

  constructor(
    statusCode: number,
    code: string,
    message: string,
    details?: any
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Gateway-specific error (for LLM providers)
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

// Error factory functions
export const BadRequest = (message: string, details?: any) =>
  new AppError(400, "BAD_REQUEST", message, details);

export const Unauthorized = (message = "Unauthorized") =>
  new AppError(401, "UNAUTHORIZED", message);

export const Forbidden = (message = "Forbidden") =>
  new AppError(403, "FORBIDDEN", message);

export const NotFound = (resource = "Resource") =>
  new AppError(404, "NOT_FOUND", `${resource} not found`);

export const Conflict = (message: string) =>
  new AppError(409, "CONFLICT", message);

export const Unprocessable = (message: string, details?: any) =>
  new AppError(422, "UNPROCESSABLE_ENTITY", message, details);

export const TooManyRequests = (message = "Too many requests") =>
  new AppError(429, "TOO_MANY_REQUESTS", message);

export const ServiceUnavailable = (message = "Service unavailable") =>
  new AppError(503, "SERVICE_UNAVAILABLE", message);

// Re-export http-errors for standard errors
export { createError };
