import { Router } from "express";
import { ProviderFactory } from "../providers/factory.js";
import { Provider } from "../types/index.js";

export const modelsRouter = Router();

modelsRouter.get("/", async (_req, res) => {
  const allModels = ProviderFactory.getAllModels();
  res.json({
    object: "list",
    data: allModels,
  });
});

modelsRouter.get("/:provider", async (req, res, next) => {
  try {
    const provider = req.params.provider as Provider;
    const providerInstance = ProviderFactory.getProvider(provider);
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
