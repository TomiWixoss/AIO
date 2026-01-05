import { Router } from "express";
import { dbGet, dbPost, dbPut, dbDelete } from "../utils/db-client.js";
import { authMiddleware } from "../middleware/auth.js";
import { ok, created } from "shared/response";
import { asyncHandler } from "shared/error-handler";

export const apiKeyRoutes = Router();

apiKeyRoutes.use(authMiddleware);

// GET keys by provider
apiKeyRoutes.get(
  "/provider/:providerId",
  asyncHandler(async (req: any, res: any) => {
    const keys = await dbGet(`/api-keys/provider/${req.params.providerId}`);
    return ok(res, keys);
  })
);

// GET keys by tool
apiKeyRoutes.get(
  "/tool/:toolId",
  asyncHandler(async (req: any, res: any) => {
    const keys = await dbGet(`/api-keys/tool/${req.params.toolId}`);
    return ok(res, keys);
  })
);

// POST create key for provider
apiKeyRoutes.post(
  "/provider",
  asyncHandler(async (req: any, res: any) => {
    const result = await dbPost("/api-keys/provider", req.body);
    return created(res, result);
  })
);

// POST create key for tool
apiKeyRoutes.post(
  "/tool",
  asyncHandler(async (req: any, res: any) => {
    const result = await dbPost("/api-keys/tool", req.body);
    return created(res, result);
  })
);

// PUT update key
apiKeyRoutes.put(
  "/:id",
  asyncHandler(async (req: any, res: any) => {
    await dbPut(`/api-keys/${req.params.id}`, req.body);
    return ok(res, { id: parseInt(req.params.id) }, "Updated successfully");
  })
);

// DELETE key
apiKeyRoutes.delete(
  "/:id",
  asyncHandler(async (req: any, res: any) => {
    await dbDelete(`/api-keys/${req.params.id}`);
    return ok(res, null, "Deleted successfully");
  })
);

// PUT reset daily counts
apiKeyRoutes.put(
  "/reset-daily",
  asyncHandler(async (_req: any, res: any) => {
    const result = await dbPut("/api-keys/reset-daily", {});
    return ok(res, result, "Reset all daily counts");
  })
);
