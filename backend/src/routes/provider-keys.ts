import { Router } from "express";
import { dbGet, dbPost, dbPut, dbDelete } from "../utils/db-client.js";
import { authMiddleware } from "../middleware/auth.js";

export const providerKeyRoutes = Router();

providerKeyRoutes.use(authMiddleware);

// GET keys by provider
providerKeyRoutes.get("/provider/:providerId", async (req, res) => {
  try {
    const keys = await dbGet(
      `/provider-keys/provider/${req.params.providerId}`
    );
    res.json(keys);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST create key
providerKeyRoutes.post("/", async (req, res) => {
  try {
    // TODO: Encrypt api_key before storing
    const result = await dbPost("/provider-keys", req.body);
    res.status(201).json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update key
providerKeyRoutes.put("/:id", async (req, res) => {
  try {
    await dbPut(`/provider-keys/${req.params.id}`, req.body);
    res.json({ message: "Updated" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE key
providerKeyRoutes.delete("/:id", async (req, res) => {
  try {
    await dbDelete(`/provider-keys/${req.params.id}`);
    res.json({ message: "Deleted" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
