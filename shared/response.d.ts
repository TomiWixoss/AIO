import { Response } from "express";
export declare const ok: <T>(res: Response, data: T, message?: string) => Response<any, Record<string, any>>;
export declare const created: <T>(res: Response, data: T) => Response<any, Record<string, any>>;
export declare const noContent: (res: Response) => Response<any, Record<string, any>>;
export declare const paginated: <T>(res: Response, data: T[], total: number, page: number, limit: number) => Response<any, Record<string, any>>;
