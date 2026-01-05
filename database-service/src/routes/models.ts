import { Router } from "express";
import { pool } from "../config/database.js";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

export const modelRoutes = Router();

// GET all models
modelRoutes.get("/", async (_req, res) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT m.*, p.name as provider_name, p.display_name as provider_display_name 
       FROM models m 
       JOIN providers p ON m.provider_id = p.id 
       ORDER BY p.name, m.display_name`
    );
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET active models
modelRoutes.get("/active", async (_req, res) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT m.*, p.name as provider_name 
       FROM models m 
       JOIN providers p ON m.provider_id = p.id 
       WHERE m.is_active = TRUE AND p.is_active = TRUE`
    );
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET models by provider
modelRoutes.get("/provider/:providerId", async (req, res) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM models WHERE provider_id = ? ORDER BY display_name",
      [req.params.providerId]
    );
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET fallback models
modelRoutes.get("/fallback", async (_req, res) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT m.*, p.name as provider_name 
       FROM models m 
       JOIN providers p ON m.provider_id = p.id 
       WHERE m.is_fallback = TRUE AND m.is_active = TRUE AND p.is_active = TRUE`
    );
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET model by id
modelRoutes.get("/:id", async (req, res) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM models WHERE id = ?",
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "Model not found" });
    }
    res.json(rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET model by provider and model_id
modelRoutes.get("/provider/:providerId/model/:modelId", async (req, res) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM models WHERE provider_id = ? AND model_id = ?",
      [req.params.providerId, req.params.modelId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "Model not found" });
    }
    res.json(rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST create model
modelRoutes.post("/", async (req, res) => {
  try {
    const {
      provider_id,
      model_id,
      display_name,
      context_length,
      is_active,
      is_fallback,
    } = req.body;
    const [result] = await pool.query<ResultSetHeader>(
      "INSERT INTO models (provider_id, model_id, display_name, context_length, is_active, is_fallback) VALUES (?, ?, ?, ?, ?, ?)",
      [
        provider_id,
        model_id,
        display_name,
        context_length,
        is_active ?? true,
        is_fallback ?? false,
      ]
    );
    res.status(201).json({ id: result.insertId });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update model
modelRoutes.put("/:id", async (req, res) => {
  try {
    const { display_name, context_length, is_active, is_fallback } = req.body;
    await pool.query(
      "UPDATE models SET display_name = ?, context_length = ?, is_active = ?, is_fallback = ? WHERE id = ?",
      [display_name, context_length, is_active, is_fallback, req.params.id]
    );
    res.json({ message: "Updated" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE model
modelRoutes.delete("/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM models WHERE id = ?", [req.params.id]);
    res.json({ message: "Deleted" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
