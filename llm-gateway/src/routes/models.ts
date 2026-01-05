import { Router } from "express";
import { ProviderFactory } from "../providers/factory.js";
import { Provider } from "../types/index.js";

export const modelsRouter = Router();

modelsRouter.get("/", async (_req, res, next) => {
  try {
    const allModels = await ProviderFactory.getAllModels();
    res.json({
      object: "list",
      data: allModels,
    });
  } catch (error) {
    next(error);
  }
});

modelsRouter.get("/providers", async (_req, res, next) => {
  try {
    const providers = await ProviderFactory.getAvailableProviders();
    res.json({
      object: "list",
      data: providers,
    });
  } catch (error) {
    next(error);
  }
});

modelsRouter.get("/:provider", async (req, res, next) => {
  try {
    const provider = req.params.provider as Provider;
    const providerInstance = ProviderFactory.getProviderInstance(provider);
    const models = await providerInstance.listModels();

    res.json({
      object: "list",
      provider,
      data: models,
    });
  } catch (error) {
    next(error);
  }
});
