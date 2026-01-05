import { Router } from "express";
import { ProviderFactory } from "../providers/factory.js";

export const healthRouter = Router();

healthRouter.get("/", async (_req, res, next) => {
  try {
    const providers = await ProviderFactory.getAvailableProviders();
    const activeProviders = providers.filter((p) => p.is_active).length;

    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      providers: {
        total: providers.length,
        active: activeProviders,
      },
    });
  } catch (error) {
    next(error);
  }
});
