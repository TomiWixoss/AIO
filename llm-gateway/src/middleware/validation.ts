import { Request, Response, NextFunction } from "express";
import { z, ZodError } from "zod";
import { GatewayError } from "shared/errors";

export function validateBody<T>(schema: z.ZodType<T>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.issues.map(
          (e) => `${e.path.join(".")}: ${e.message}`
        );
        throw new GatewayError(400, `Validation error: ${messages.join(", ")}`);
      }
      throw error;
    }
  };
}
