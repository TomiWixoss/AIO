import { Router } from "express";
import { dbGet, dbPost, dbPut, dbDelete } from "../utils/db-client.js";
import { authMiddleware } from "../middleware/auth.js";

export const providerRoutes = Router();

// All routes require auth
providerRoutes.use(authMiddleware);

// GET all providers
providerRoutes.get("/", async (_req, res) => {
  try {
    const providers = await dbGet("/providers");
    res.json(providers);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET provider by id
providerRoutes.get("/:id", async (req, res) => {
  try {
    const provider = await dbGet(`/providers/${req.params.id}`);
    res.json(provider);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update provider
providerRoutes.put("/:id", async (req, res) => {
  try {
    await dbPut(`/providers/${req.params.id}`, req.body);
    res.json({ message: "Updated" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
