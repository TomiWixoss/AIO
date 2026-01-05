import { Router } from "express";
import { pool } from "../config/database.js";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

export const chatSessionRoutes = Router();

// GET all sessions
chatSessionRoutes.get("/", async (_req, res) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM chat_sessions ORDER BY updated_at DESC"
    );
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET session by id
chatSessionRoutes.get("/:id", async (req, res) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM chat_sessions WHERE id = ?",
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "Session not found" });
    }
    res.json(rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET session by session_key
chatSessionRoutes.get("/key/:sessionKey", async (req, res) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM chat_sessions WHERE session_key = ?",
      [req.params.sessionKey]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "Session not found" });
    }
    res.json(rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST create session
chatSessionRoutes.post("/", async (req, res) => {
  try {
    const { session_key, title } = req.body;
    const [result] = await pool.query<ResultSetHeader>(
      "INSERT INTO chat_sessions (session_key, title) VALUES (?, ?)",
      [session_key, title]
    );
    res.status(201).json({ id: result.insertId, session_key });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update session
chatSessionRoutes.put("/:id", async (req, res) => {
  try {
    const { title } = req.body;
    await pool.query("UPDATE chat_sessions SET title = ? WHERE id = ?", [
      title,
      req.params.id,
    ]);
    res.json({ message: "Updated" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE session
chatSessionRoutes.delete("/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM chat_sessions WHERE id = ?", [req.params.id]);
    res.json({ message: "Deleted" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
