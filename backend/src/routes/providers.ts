import { Router } from "express";
import { dbGet, dbPost, dbPut, dbDelete } from "../utils/db-client.js";
import { authMiddleware } from "../middleware/auth.js";
import { ok, created } from "shared/response";
import { asyncHandler } from "shared/error-handler";

export const providerRoutes = Router();

providerRoutes.use(authMiddleware);

// GET all providers
providerRoutes.get(
  "/",
  asyncHandler(async (_req: any, res: any) => {
    const providers = await dbGet("/providers");
    return ok(res, providers);
  })
);

// GET provider by id
providerRoutes.get(
  "/:id",
  asyncHandler(async (req: any, res: any) => {
    const provider = await dbGet(`/providers/${req.params.id}`);
    return ok(res, provider);
  })
);

// POST create provider
providerRoutes.post(
  "/",
  asyncHandler(async (req: any, res: any) => {
    const result = await dbPost("/providers", req.body);
    return created(res, result);
  })
);

// PUT update provider
providerRoutes.put(
  "/:id",
  asyncHandler(async (req: any, res: any) => {
    await dbPut(`/providers/${req.params.id}`, req.body);
    return ok(res, { id: parseInt(req.params.id) }, "Updated successfully");
  })
);

// DELETE provider
providerRoutes.delete(
  "/:id",
  asyncHandler(async (req: any, res: any) => {
    await dbDelete(`/providers/${req.params.id}`);
    return ok(res, null, "Deleted successfully");
  })
);
