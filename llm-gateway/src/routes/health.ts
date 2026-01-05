import { Router } from "express";
import { ProviderFactory } from "../providers/factory.js";
import { ok } from "shared/response";
import { asyncHandler } from "shared/error-handler";

export const healthRouter = Router();

healthRouter.get(
  "/",
  asyncHandler(async (_req: any, res: any) => {
    const providers = await ProviderFactory.getAvailableProviders();
    const activeProviders = providers.filter((p) => p.is_active).length;

    return ok(res, {
      status: "ok",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      providers: {
        total: providers.length,
        active: activeProviders,
      },
    });
  })
);
