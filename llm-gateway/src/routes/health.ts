import { Router } from "express";
import { ProviderFactory } from "../providers/factory.js";

export const healthRouter = Router();

healthRouter.get("/", (_req, res) => {
  const providers = ProviderFactory.getAvailableProviders();
  const activeProviders = providers.filter((p) => p.available).length;

  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    providers: {
      total: providers.length,
      active: activeProviders,
    },
  });
});
