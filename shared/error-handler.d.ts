import { Request, Response, NextFunction } from "express";
import { AppError, GatewayError } from "./errors.js";
export declare const errorHandler: (err: Error | AppError | GatewayError, _req: Request, res: Response, _next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const notFoundHandler: (_req: Request, res: Response) => void;
export declare const asyncHandler: (fn: Function) => (req: Request, res: Response, next: NextFunction) => void;
