import { Router } from "express";
import { pool } from "../config/database.js";
import { encrypt } from "../utils/encryption.js";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

export const providerKeyRoutes = Router();

// GET all keys for a provider
providerKeyRoutes.get("/provider/:providerId", async (req, res) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM provider_keys WHERE provider_id = ? ORDER BY priority DESC",
      [req.params.providerId]
    );
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET active keys for a provider (for rotation)
providerKeyRoutes.get("/provider/:providerId/active", async (req, res) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM provider_keys 
       WHERE provider_id = ? AND is_active = TRUE 
       AND (daily_limit IS NULL OR requests_today < daily_limit)
       ORDER BY priority DESC, requests_today ASC`,
      [req.params.providerId]
    );
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET key by id
providerKeyRoutes.get("/:id", async (req, res) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM provider_keys WHERE id = ?",
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "Key not found" });
    }
    res.json(rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST create key (auto-encrypt)
providerKeyRoutes.post("/", async (req, res) => {
  try {
    const { provider_id, api_key, name, priority, daily_limit } = req.body;

    if (!api_key) {
      return res.status(400).json({ error: "api_key is required" });
    }

    // Mã hóa key trước khi lưu
    const api_key_encrypted = encrypt(api_key);

    const [result] = await pool.query<ResultSetHeader>(
      "INSERT INTO provider_keys (provider_id, api_key_encrypted, name, priority, daily_limit) VALUES (?, ?, ?, ?, ?)",
      [provider_id, api_key_encrypted, name, priority ?? 0, daily_limit]
    );
    res.status(201).json({ id: result.insertId });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update key
providerKeyRoutes.put("/:id", async (req, res) => {
  try {
    const { name, is_active, priority, daily_limit } = req.body;
    await pool.query(
      "UPDATE provider_keys SET name = ?, is_active = ?, priority = ?, daily_limit = ? WHERE id = ?",
      [name, is_active, priority, daily_limit, req.params.id]
    );
    res.json({ message: "Updated" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT increment request count
providerKeyRoutes.put("/:id/increment", async (req, res) => {
  try {
    await pool.query(
      "UPDATE provider_keys SET requests_today = requests_today + 1, last_used_at = NOW() WHERE id = ?",
      [req.params.id]
    );
    res.json({ message: "Incremented" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT mark key error
providerKeyRoutes.put("/:id/error", async (req, res) => {
  try {
    const { error_message, deactivate } = req.body;
    if (deactivate) {
      await pool.query(
        "UPDATE provider_keys SET is_active = FALSE, last_error_at = NOW(), last_error_message = ? WHERE id = ?",
        [error_message, req.params.id]
      );
    } else {
      await pool.query(
        "UPDATE provider_keys SET last_error_at = NOW(), last_error_message = ? WHERE id = ?",
        [error_message, req.params.id]
      );
    }
    res.json({ message: "Updated" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT reset daily counts (call at midnight)
providerKeyRoutes.put("/reset-daily", async (_req, res) => {
  try {
    await pool.query("UPDATE provider_keys SET requests_today = 0");
    res.json({ message: "Reset all daily counts" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE key
providerKeyRoutes.delete("/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM provider_keys WHERE id = ?", [req.params.id]);
    res.json({ message: "Deleted" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
