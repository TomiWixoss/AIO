import { Router } from "express";
import { dbGet } from "../utils/db-client.js";
import { authMiddleware } from "../middleware/auth.js";
import { ok } from "shared/response";
import { asyncHandler } from "shared/error-handler";

export const statsRoutes = Router();

statsRoutes.use(authMiddleware);

// GET /stats - Overall statistics
statsRoutes.get(
  "/",
  asyncHandler(async (_req: any, res: any) => {
    const stats = await dbGet("/usage-logs/stats");
    return ok(res, stats);
  })
);

// GET /stats/today
statsRoutes.get(
  "/today",
  asyncHandler(async (_req: any, res: any) => {
    const stats = await dbGet("/usage-logs/stats/today");
    return ok(res, stats);
  })
);

// GET /stats/logs - Usage logs
statsRoutes.get(
  "/logs",
  asyncHandler(async (req: any, res: any) => {
    const limit = req.query.limit || 100;
    const page = req.query.page || 1;
    const logs = await dbGet(`/usage-logs?limit=${limit}&page=${page}`);
    return ok(res, logs);
  })
);
