import { Router } from "express";
import { dbGet, dbPost, dbPut, dbDelete } from "../utils/db-client.js";
import { authMiddleware } from "../middleware/auth.js";
import { ok, created } from "shared/response";
import { asyncHandler } from "shared/error-handler";

export const toolRoutes = Router();

toolRoutes.use(authMiddleware);

// GET all tools
toolRoutes.get(
  "/",
  asyncHandler(async (_req: any, res: any) => {
    const tools = await dbGet("/tools");
    return ok(res, tools);
  })
);

// GET active tools
toolRoutes.get(
  "/active",
  asyncHandler(async (_req: any, res: any) => {
    const tools = await dbGet("/tools/active");
    return ok(res, tools);
  })
);

// GET tool by id
toolRoutes.get(
  "/:id",
  asyncHandler(async (req: any, res: any) => {
    const tool = await dbGet(`/tools/${req.params.id}`);
    return ok(res, tool);
  })
);

// POST create tool
toolRoutes.post(
  "/",
  asyncHandler(async (req: any, res: any) => {
    const result = await dbPost("/tools", req.body);
    return created(res, result);
  })
);

// PUT update tool
toolRoutes.put(
  "/:id",
  asyncHandler(async (req: any, res: any) => {
    await dbPut(`/tools/${req.params.id}`, req.body);
    return ok(res, { id: parseInt(req.params.id) }, "Updated successfully");
  })
);

// DELETE tool
toolRoutes.delete(
  "/:id",
  asyncHandler(async (req: any, res: any) => {
    await dbDelete(`/tools/${req.params.id}`);
    return ok(res, null, "Deleted successfully");
  })
);
