import { Request, Response, NextFunction } from "express";
import { AppError, GatewayError } from "./errors.js";

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    stack?: string;
  };
}

export const errorHandler = (
  err: Error | AppError | GatewayError,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  // Log error
  console.error(`[ERROR] ${err.message}`, err.stack);

  // Default values
  let statusCode = 500;
  let code = "INTERNAL_SERVER_ERROR";
  let message = "Internal server error";
  let details: any = undefined;

  // Handle GatewayError (LLM provider errors)
  if (err instanceof GatewayError) {
    return res.status(err.statusCode).json({
      error: {
        message: err.message,
        provider: err.provider,
        type: "gateway_error",
      },
    });
  }

  // Handle AppError
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
    details = err.details;
  }
  // Handle http-errors
  else if ("statusCode" in err && typeof (err as any).statusCode === "number") {
    statusCode = (err as any).statusCode;
    code = (err as any).code || `HTTP_${statusCode}`;
    message = err.message;
  }
  // Handle validation errors (Zod, etc.)
  else if (err.name === "ZodError") {
    statusCode = 400;
    code = "VALIDATION_ERROR";
    message = "Validation failed";
    details = (err as any).errors;
  }
  // Handle MySQL errors
  else if ((err as any).code?.startsWith("ER_")) {
    statusCode = 400;
    code = (err as any).code;
    message = getMySQLErrorMessage((err as any).code, err.message);
  }

  const response: ErrorResponse = {
    success: false,
    error: { code, message },
  };

  if (details) response.error.details = details;

  // Include stack trace in development
  if (process.env.NODE_ENV !== "production") {
    response.error.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

// MySQL error messages
function getMySQLErrorMessage(code: string, original: string): string {
  const messages: Record<string, string> = {
    ER_DUP_ENTRY: "Duplicate entry - resource already exists",
    ER_NO_REFERENCED_ROW: "Referenced resource does not exist",
    ER_NO_REFERENCED_ROW_2: "Referenced resource does not exist",
    ER_ROW_IS_REFERENCED:
      "Cannot delete - resource is referenced by other records",
    ER_ROW_IS_REFERENCED_2:
      "Cannot delete - resource is referenced by other records",
    ER_DATA_TOO_LONG: "Data too long for column",
    ER_TRUNCATED_WRONG_VALUE: "Invalid value format",
  };
  return messages[code] || original;
}

// 404 handler for unknown routes
export const notFoundHandler = (_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: { code: "ROUTE_NOT_FOUND", message: "Route not found" },
  });
};

// Async wrapper to catch errors
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
