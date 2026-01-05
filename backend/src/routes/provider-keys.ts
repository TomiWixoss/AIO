import { Router } from "express";
import { dbGet, dbPost, dbPut, dbDelete } from "../utils/db-client.js";
import { authMiddleware } from "../middleware/auth.js";
import { ok, created } from "shared/response";
import { asyncHandler } from "shared/error-handler";

export const providerKeyRoutes = Router();

providerKeyRoutes.use(authMiddleware);

// GET keys by provider
providerKeyRoutes.get(
  "/provider/:providerId",
  asyncHandler(async (req: any, res: any) => {
    const keys = await dbGet(
      `/provider-keys/provider/${req.params.providerId}`
    );
    return ok(res, keys);
  })
);

// POST create key
providerKeyRoutes.post(
  "/",
  asyncHandler(async (req: any, res: any) => {
    const result = await dbPost("/provider-keys", req.body);
    return created(res, result);
  })
);

// PUT update key
providerKeyRoutes.put(
  "/:id",
  asyncHandler(async (req: any, res: any) => {
    await dbPut(`/provider-keys/${req.params.id}`, req.body);
    return ok(res, { id: parseInt(req.params.id) }, "Updated successfully");
  })
);

// DELETE key
providerKeyRoutes.delete(
  "/:id",
  asyncHandler(async (req: any, res: any) => {
    await dbDelete(`/provider-keys/${req.params.id}`);
    return ok(res, null, "Deleted successfully");
  })
);
