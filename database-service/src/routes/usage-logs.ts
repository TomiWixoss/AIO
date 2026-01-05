import { Router } from "express";
import { pool } from "../config/database.js";
import { ok, created, paginated } from "shared/response";
import { BadRequest } from "shared/errors";
import { asyncHandler } from "shared/error-handler";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

export const usageLogRoutes = Router();

// GET all logs (with pagination)
usageLogRoutes.get(
  "/",
  asyncHandler(async (req: any, res: any) => {
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 500);
    const page = parseInt(req.query.page as string) || 1;
    const offset = (page - 1) * limit;

    const [[countResult], [rows]] = await Promise.all([
      pool.query<RowDataPacket[]>("SELECT COUNT(*) as total FROM usage_logs"),
      pool.query<RowDataPacket[]>(
        `SELECT ul.*, p.name as provider_name, m.model_id as model_name 
       FROM usage_logs ul 
       LEFT JOIN providers p ON ul.provider_id = p.id 
       LEFT JOIN models m ON ul.model_id = m.id 
       ORDER BY ul.created_at DESC 
       LIMIT ? OFFSET ?`,
        [limit, offset]
      ),
    ]);
    return paginated(res, rows, countResult[0].total, page, limit);
  })
);

// GET logs by session
usageLogRoutes.get(
  "/session/:sessionId",
  asyncHandler(async (req: any, res: any) => {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM usage_logs WHERE session_id = ? ORDER BY created_at DESC",
      [req.params.sessionId]
    );
    return ok(res, rows);
  })
);

// GET logs by provider
usageLogRoutes.get(
  "/provider/:providerId",
  asyncHandler(async (req: any, res: any) => {
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 500);
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM usage_logs WHERE provider_id = ? ORDER BY created_at DESC LIMIT ?",
      [req.params.providerId, limit]
    );
    return ok(res, rows);
  })
);

// GET statistics
usageLogRoutes.get(
  "/stats",
  asyncHandler(async (_req: any, res: any) => {
    const [[totalRequests], [totalTokens], [byProvider], [byStatus]] =
      await Promise.all([
        pool.query<RowDataPacket[]>("SELECT COUNT(*) as total FROM usage_logs"),
        pool.query<RowDataPacket[]>(
          "SELECT SUM(prompt_tokens) as prompt, SUM(completion_tokens) as completion FROM usage_logs"
        ),
        pool.query<RowDataPacket[]>(
          `SELECT p.name, COUNT(*) as requests, SUM(ul.prompt_tokens + ul.completion_tokens) as tokens 
       FROM usage_logs ul 
       JOIN providers p ON ul.provider_id = p.id 
       GROUP BY ul.provider_id, p.name`
        ),
        pool.query<RowDataPacket[]>(
          "SELECT status, COUNT(*) as count FROM usage_logs GROUP BY status"
        ),
      ]);

    return ok(res, {
      total_requests: totalRequests[0]?.total || 0,
      total_tokens: {
        prompt: totalTokens[0]?.prompt || 0,
        completion: totalTokens[0]?.completion || 0,
      },
      by_provider: byProvider,
      by_status: byStatus,
    });
  })
);

// GET today's statistics
usageLogRoutes.get(
  "/stats/today",
  asyncHandler(async (_req: any, res: any) => {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT 
      COUNT(*) as requests,
      COALESCE(SUM(prompt_tokens), 0) as prompt_tokens,
      COALESCE(SUM(completion_tokens), 0) as completion_tokens,
      COALESCE(AVG(latency_ms), 0) as avg_latency
     FROM usage_logs 
     WHERE DATE(created_at) = CURDATE()`
    );
    return ok(res, rows[0]);
  })
);

// POST create log
usageLogRoutes.post(
  "/",
  asyncHandler(async (req: any, res: any) => {
    const {
      session_id,
      provider_id,
      api_key_id,
      model_id,
      prompt_tokens,
      completion_tokens,
      latency_ms,
      status,
      error_message,
    } = req.body;
    if (!provider_id || !status) {
      throw BadRequest("provider_id and status are required");
    }
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO usage_logs 
     (session_id, provider_id, api_key_id, model_id, prompt_tokens, completion_tokens, latency_ms, status, error_message) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        session_id,
        provider_id,
        api_key_id,
        model_id,
        prompt_tokens || 0,
        completion_tokens || 0,
        latency_ms,
        status,
        error_message,
      ]
    );
    return created(res, { id: result.insertId });
  })
);
