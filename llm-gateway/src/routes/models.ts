import { Router } from "express";
import { ProviderFactory } from "../providers/factory.js";
import { Provider } from "../types/index.js";
import { ok } from "shared/response";
import { asyncHandler } from "shared/error-handler";

export const modelsRouter = Router();

modelsRouter.get(
  "/",
  asyncHandler(async (_req: any, res: any) => {
    const allModels = await ProviderFactory.getAllModels();
    return ok(res, { object: "list", data: allModels });
  })
);

modelsRouter.get(
  "/providers",
  asyncHandler(async (_req: any, res: any) => {
    const providers = await ProviderFactory.getAvailableProviders();
    return ok(res, { object: "list", data: providers });
  })
);

modelsRouter.get(
  "/:provider",
  asyncHandler(async (req: any, res: any) => {
    const provider = req.params.provider as Provider;
    const providerInstance = ProviderFactory.getProviderInstance(provider);
    const models = await providerInstance.listModels();
    return ok(res, { object: "list", provider, data: models });
  })
);
