import { Router } from "express";
import { dbGet, dbPost, dbPut, dbDelete } from "../utils/db-client.js";
import { authMiddleware } from "../middleware/auth.js";
import { ok, created } from "shared/response";
import { asyncHandler } from "shared/error-handler";

export const modelRoutes = Router();

modelRoutes.use(authMiddleware);

// GET all models
modelRoutes.get(
  "/",
  asyncHandler(async (_req: any, res: any) => {
    const models = await dbGet("/models");
    return ok(res, models);
  })
);

// GET models by provider
modelRoutes.get(
  "/provider/:providerId",
  asyncHandler(async (req: any, res: any) => {
    const models = await dbGet(`/models/provider/${req.params.providerId}`);
    return ok(res, models);
  })
);

// POST create model
modelRoutes.post(
  "/",
  asyncHandler(async (req: any, res: any) => {
    const result = await dbPost("/models", req.body);
    return created(res, result);
  })
);

// PUT update model
modelRoutes.put(
  "/:id",
  asyncHandler(async (req: any, res: any) => {
    await dbPut(`/models/${req.params.id}`, req.body);
    return ok(res, { id: parseInt(req.params.id) }, "Updated successfully");
  })
);

// DELETE model
modelRoutes.delete(
  "/:id",
  asyncHandler(async (req: any, res: any) => {
    await dbDelete(`/models/${req.params.id}`);
    return ok(res, null, "Deleted successfully");
  })
);
