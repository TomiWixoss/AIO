import { Router } from "express";
import { pool } from "../config/database.js";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

export const chatMessageRoutes = Router();

// GET messages by session
chatMessageRoutes.get("/session/:sessionId", async (req, res) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT cm.*, m.model_id as model_name, p.name as provider_name 
       FROM chat_messages cm 
       LEFT JOIN models m ON cm.model_id = m.id 
       LEFT JOIN providers p ON cm.provider_id = p.id 
       WHERE cm.session_id = ? 
       ORDER BY cm.created_at`,
      [req.params.sessionId]
    );
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET message by id
chatMessageRoutes.get("/:id", async (req, res) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM chat_messages WHERE id = ?",
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "Message not found" });
    }
    res.json(rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST create message
chatMessageRoutes.post("/", async (req, res) => {
  try {
    const { session_id, role, content, model_id, provider_id } = req.body;
    const [result] = await pool.query<ResultSetHeader>(
      "INSERT INTO chat_messages (session_id, role, content, model_id, provider_id) VALUES (?, ?, ?, ?, ?)",
      [session_id, role, content, model_id, provider_id]
    );
    res.status(201).json({ id: result.insertId });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST create multiple messages (batch)
chatMessageRoutes.post("/batch", async (req, res) => {
  try {
    const { messages } = req.body; // Array of messages
    const values = messages.map((m: any) => [
      m.session_id,
      m.role,
      m.content,
      m.model_id,
      m.provider_id,
    ]);
    const [result] = await pool.query<ResultSetHeader>(
      "INSERT INTO chat_messages (session_id, role, content, model_id, provider_id) VALUES ?",
      [values]
    );
    res.status(201).json({ inserted: result.affectedRows });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE message
chatMessageRoutes.delete("/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM chat_messages WHERE id = ?", [req.params.id]);
    res.json({ message: "Deleted" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE all messages in session
chatMessageRoutes.delete("/session/:sessionId", async (req, res) => {
  try {
    await pool.query("DELETE FROM chat_messages WHERE session_id = ?", [
      req.params.sessionId,
    ]);
    res.json({ message: "Deleted all messages in session" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
