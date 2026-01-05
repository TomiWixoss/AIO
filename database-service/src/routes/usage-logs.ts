import { Router } from "express";
import { pool } from "../config/database.js";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

export const usageLogRoutes = Router();

// GET all logs (with pagination)
usageLogRoutes.get("/", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const offset = parseInt(req.query.offset as string) || 0;
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT ul.*, p.name as provider_name, m.model_id as model_name 
       FROM usage_logs ul 
       LEFT JOIN providers p ON ul.provider_id = p.id 
       LEFT JOIN models m ON ul.model_id = m.id 
       ORDER BY ul.created_at DESC 
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET logs by session
usageLogRoutes.get("/session/:sessionId", async (req, res) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM usage_logs WHERE session_id = ? ORDER BY created_at DESC",
      [req.params.sessionId]
    );
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET logs by provider
usageLogRoutes.get("/provider/:providerId", async (req, res) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM usage_logs WHERE provider_id = ? ORDER BY created_at DESC LIMIT 100",
      [req.params.providerId]
    );
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET statistics
usageLogRoutes.get("/stats", async (_req, res) => {
  try {
    const [totalRequests] = await pool.query<RowDataPacket[]>(
      "SELECT COUNT(*) as total FROM usage_logs"
    );
    const [totalTokens] = await pool.query<RowDataPacket[]>(
      "SELECT SUM(prompt_tokens) as prompt, SUM(completion_tokens) as completion FROM usage_logs"
    );
    const [byProvider] = await pool.query<RowDataPacket[]>(
      `SELECT p.name, COUNT(*) as requests, SUM(ul.prompt_tokens + ul.completion_tokens) as tokens 
       FROM usage_logs ul 
       JOIN providers p ON ul.provider_id = p.id 
       GROUP BY ul.provider_id`
    );
    const [byStatus] = await pool.query<RowDataPacket[]>(
      "SELECT status, COUNT(*) as count FROM usage_logs GROUP BY status"
    );

    res.json({
      total_requests: totalRequests[0]?.total || 0,
      total_tokens: {
        prompt: totalTokens[0]?.prompt || 0,
        completion: totalTokens[0]?.completion || 0,
      },
      by_provider: byProvider,
      by_status: byStatus,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET today's statistics
usageLogRoutes.get("/stats/today", async (_req, res) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        COUNT(*) as requests,
        SUM(prompt_tokens) as prompt_tokens,
        SUM(completion_tokens) as completion_tokens,
        AVG(latency_ms) as avg_latency
       FROM usage_logs 
       WHERE DATE(created_at) = CURDATE()`
    );
    res.json(rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST create log
usageLogRoutes.post("/", async (req, res) => {
  try {
    const {
      session_id,
      provider_id,
      provider_key_id,
      model_id,
      prompt_tokens,
      completion_tokens,
      latency_ms,
      status,
      error_message,
    } = req.body;
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO usage_logs 
       (session_id, provider_id, provider_key_id, model_id, prompt_tokens, completion_tokens, latency_ms, status, error_message) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        session_id,
        provider_id,
        provider_key_id,
        model_id,
        prompt_tokens,
        completion_tokens,
        latency_ms,
        status,
        error_message,
      ]
    );
    res.status(201).json({ id: result.insertId });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
