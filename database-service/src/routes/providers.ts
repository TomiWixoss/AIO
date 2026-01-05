import { Router } from "express";
import { pool } from "../config/database.js";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

export const providerRoutes = Router();

// GET all providers
providerRoutes.get("/", async (_req, res) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM providers ORDER BY priority DESC, name"
    );
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET active providers only
providerRoutes.get("/active", async (_req, res) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM providers WHERE is_active = TRUE ORDER BY priority DESC"
    );
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET provider by id
providerRoutes.get("/:id", async (req, res) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM providers WHERE id = ?",
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "Provider not found" });
    }
    res.json(rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET provider by name
providerRoutes.get("/name/:name", async (req, res) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM providers WHERE name = ?",
      [req.params.name]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "Provider not found" });
    }
    res.json(rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST create provider
providerRoutes.post("/", async (req, res) => {
  try {
    const {
      name,
      display_name,
      base_url,
      is_active,
      priority,
      free_tier_info,
    } = req.body;
    const [result] = await pool.query<ResultSetHeader>(
      "INSERT INTO providers (name, display_name, base_url, is_active, priority, free_tier_info) VALUES (?, ?, ?, ?, ?, ?)",
      [
        name,
        display_name,
        base_url,
        is_active ?? true,
        priority ?? 0,
        free_tier_info,
      ]
    );
    res.status(201).json({ id: result.insertId, name, display_name });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update provider
providerRoutes.put("/:id", async (req, res) => {
  try {
    const { display_name, base_url, is_active, priority, free_tier_info } =
      req.body;
    await pool.query(
      "UPDATE providers SET display_name = ?, base_url = ?, is_active = ?, priority = ?, free_tier_info = ? WHERE id = ?",
      [
        display_name,
        base_url,
        is_active,
        priority,
        free_tier_info,
        req.params.id,
      ]
    );
    res.json({ message: "Updated" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE provider
providerRoutes.delete("/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM providers WHERE id = ?", [req.params.id]);
    res.json({ message: "Deleted" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
