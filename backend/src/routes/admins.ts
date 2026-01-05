import { Router } from "express";
import bcrypt from "bcryptjs";
import { dbGet, dbPost, dbPut, dbDelete } from "../utils/db-client.js";
import { authMiddleware } from "../middleware/auth.js";

export const adminRoutes = Router();

adminRoutes.use(authMiddleware);

// GET all admins
adminRoutes.get("/", async (_req, res) => {
  try {
    const admins = await dbGet("/admins");
    res.json(admins);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET admin by id
adminRoutes.get("/:id", async (req, res) => {
  try {
    const admin = await dbGet(`/admins/${req.params.id}`);
    res.json(admin);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST create admin
adminRoutes.post("/", async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: "email, password, name required" });
    }
    const password_hash = await bcrypt.hash(password, 10);
    const result = await dbPost("/admins", { email, password_hash, name });
    res.status(201).json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update admin
adminRoutes.put("/:id", async (req, res) => {
  try {
    const { name, password } = req.body;
    const updateData: any = {};
    if (name) updateData.name = name;
    if (password) updateData.password_hash = await bcrypt.hash(password, 10);

    await dbPut(`/admins/${req.params.id}`, updateData);
    res.json({ message: "Updated" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE admin
adminRoutes.delete("/:id", async (req, res) => {
  try {
    await dbDelete(`/admins/${req.params.id}`);
    res.json({ message: "Deleted" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
