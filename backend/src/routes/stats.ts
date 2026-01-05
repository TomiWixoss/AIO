import { Router } from "express";
import { dbGet } from "../utils/db-client.js";
import { authMiddleware } from "../middleware/auth.js";

export const statsRoutes = Router();

statsRoutes.use(authMiddleware);

// GET /stats - Overall statistics
statsRoutes.get("/", async (_req, res) => {
  try {
    const stats = await dbGet("/usage-logs/stats");
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /stats/today
statsRoutes.get("/today", async (_req, res) => {
  try {
    const stats = await dbGet("/usage-logs/stats/today");
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /stats/logs - Usage logs
statsRoutes.get("/logs", async (req, res) => {
  try {
    const limit = req.query.limit || 100;
    const offset = req.query.offset || 0;
    const logs = await dbGet(`/usage-logs?limit=${limit}&offset=${offset}`);
    res.json(logs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
