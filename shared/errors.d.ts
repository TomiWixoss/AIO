import createError from "http-errors";
export declare class AppError extends Error {
    statusCode: number;
    code: string;
    details?: any;
    constructor(statusCode: number, code: string, message: string, details?: any);
}
export declare class GatewayError extends Error {
    statusCode: number;
    message: string;
    provider?: string | undefined;
    constructor(statusCode: number, message: string, provider?: string | undefined);
}
export declare const BadRequest: (message: string, details?: any) => AppError;
export declare const Unauthorized: (message?: string) => AppError;
export declare const Forbidden: (message?: string) => AppError;
export declare const NotFound: (resource?: string) => AppError;
export declare const Conflict: (message: string) => AppError;
export declare const Unprocessable: (message: string, details?: any) => AppError;
export declare const TooManyRequests: (message?: string) => AppError;
export declare const ServiceUnavailable: (message?: string) => AppError;
export { createError };
