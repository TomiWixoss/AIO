import { Router } from "express";
import { dbGet, dbPost, dbPut, dbDelete } from "../utils/db-client.js";
import { authMiddleware } from "../middleware/auth.js";

export const modelRoutes = Router();

modelRoutes.use(authMiddleware);

// GET all models
modelRoutes.get("/", async (_req, res) => {
  try {
    const models = await dbGet("/models");
    res.json(models);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET models by provider
modelRoutes.get("/provider/:providerId", async (req, res) => {
  try {
    const models = await dbGet(`/models/provider/${req.params.providerId}`);
    res.json(models);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST create model
modelRoutes.post("/", async (req, res) => {
  try {
    const result = await dbPost("/models", req.body);
    res.status(201).json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update model
modelRoutes.put("/:id", async (req, res) => {
  try {
    await dbPut(`/models/${req.params.id}`, req.body);
    res.json({ message: "Updated" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE model
modelRoutes.delete("/:id", async (req, res) => {
  try {
    await dbDelete(`/models/${req.params.id}`);
    res.json({ message: "Deleted" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
