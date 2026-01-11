import { Router } from "express";
import { pool } from "../config/database.js";
import { encrypt } from "../utils/encryption.js";
import { ok, created } from "shared/response";
import { NotFound, BadRequest } from "shared/errors";
import { asyncHandler } from "shared/error-handler";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

export const apiKeyRoutes = Router();

// GET all keys
apiKeyRoutes.get(
  "/",
  asyncHandler(async (_req: any, res: any) => {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id, key_type, provider_id, tool_id, name, is_active, priority, requests_today, daily_limit, 
       last_used_at, last_error_at, created_at FROM api_keys ORDER BY created_at DESC`
    );
    return ok(res, rows);
  })
);

// GET active keys for a provider (for rotation)
apiKeyRoutes.get(
  "/provider/:providerId/active",
  asyncHandler(async (req: any, res: any) => {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM api_keys 
     WHERE key_type = 'provider' AND provider_id = ? AND is_active = TRUE 
     AND (daily_limit IS NULL OR requests_today < daily_limit)
     ORDER BY priority DESC, requests_today ASC`,
      [req.params.providerId]
    );
    return ok(res, rows);
  })
);

// GET active keys for a tool (for rotation)
apiKeyRoutes.get(
  "/tool/:toolId/active",
  asyncHandler(async (req: any, res: any) => {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM api_keys 
     WHERE key_type = 'tool' AND tool_id = ? AND is_active = TRUE 
     AND (daily_limit IS NULL OR requests_today < daily_limit)
     ORDER BY priority DESC, requests_today ASC`,
      [req.params.toolId]
    );
    return ok(res, rows);
  })
);

// GET all keys for a provider
apiKeyRoutes.get(
  "/provider/:providerId",
  asyncHandler(async (req: any, res: any) => {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id, key_type, provider_id, name, is_active, priority, requests_today, daily_limit, 
     last_used_at, last_error_at, created_at 
     FROM api_keys WHERE key_type = 'provider' AND provider_id = ? ORDER BY priority DESC`,
      [req.params.providerId]
    );
    return ok(res, rows);
  })
);

// GET all keys for a tool
apiKeyRoutes.get(
  "/tool/:toolId",
  asyncHandler(async (req: any, res: any) => {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id, key_type, tool_id, name, is_active, priority, requests_today, daily_limit, 
     last_used_at, last_error_at, created_at 
     FROM api_keys WHERE key_type = 'tool' AND tool_id = ? ORDER BY priority DESC`,
      [req.params.toolId]
    );
    return ok(res, rows);
  })
);

// PUT reset daily counts
apiKeyRoutes.put(
  "/reset-daily",
  asyncHandler(async (_req: any, res: any) => {
    const [result] = await pool.query<ResultSetHeader>(
      "UPDATE api_keys SET requests_today = 0"
    );
    return ok(res, { affected: result.affectedRows }, "Reset all daily counts");
  })
);

// GET key by id
apiKeyRoutes.get(
  "/:id",
  asyncHandler(async (req: any, res: any) => {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id, key_type, provider_id, tool_id, name, is_active, priority, requests_today, daily_limit, 
     last_used_at, last_error_at, created_at FROM api_keys WHERE id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) throw NotFound("API key");
    return ok(res, rows[0]);
  })
);

// POST create key for provider
apiKeyRoutes.post(
  "/provider",
  asyncHandler(async (req: any, res: any) => {
    const { provider_id, api_key, name, priority, daily_limit } = req.body;
    if (!provider_id) throw BadRequest("provider_id is required");
    if (!api_key) throw BadRequest("api_key is required");

    const credentials = JSON.stringify({ api_key });
    const credentials_encrypted = encrypt(credentials);

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO api_keys (key_type, provider_id, credentials_encrypted, name, priority, daily_limit) 
     VALUES ('provider', ?, ?, ?, ?, ?)`,
      [provider_id, credentials_encrypted, name, priority ?? 0, daily_limit]
    );
    return created(res, {
      id: result.insertId,
      key_type: "provider",
      provider_id,
      name,
    });
  })
);

// POST create key for tool
apiKeyRoutes.post(
  "/tool",
  asyncHandler(async (req: any, res: any) => {
    const { tool_id, credentials, name, priority, daily_limit } = req.body;
    if (!tool_id) throw BadRequest("tool_id is required");
    if (!credentials) throw BadRequest("credentials is required");

    const credentials_encrypted = encrypt(JSON.stringify(credentials));

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO api_keys (key_type, tool_id, credentials_encrypted, name, priority, daily_limit) 
     VALUES ('tool', ?, ?, ?, ?, ?)`,
      [tool_id, credentials_encrypted, name, priority ?? 0, daily_limit]
    );
    return created(res, {
      id: result.insertId,
      key_type: "tool",
      tool_id,
      name,
    });
  })
);

// PUT update key
apiKeyRoutes.put(
  "/:id",
  asyncHandler(async (req: any, res: any) => {
    const { name, is_active, priority, daily_limit } = req.body;
    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE api_keys SET name = COALESCE(?, name), is_active = COALESCE(?, is_active), 
     priority = COALESCE(?, priority), daily_limit = COALESCE(?, daily_limit) WHERE id = ?`,
      [name, is_active, priority, daily_limit, req.params.id]
    );
    if (result.affectedRows === 0) throw NotFound("API key");
    return ok(res, { id: parseInt(req.params.id) }, "Updated successfully");
  })
);

// PUT increment request count
apiKeyRoutes.put(
  "/:id/increment",
  asyncHandler(async (req: any, res: any) => {
    const [result] = await pool.query<ResultSetHeader>(
      "UPDATE api_keys SET requests_today = requests_today + 1, last_used_at = NOW() WHERE id = ?",
      [req.params.id]
    );
    if (result.affectedRows === 0) throw NotFound("API key");
    return ok(res, null, "Incremented");
  })
);

// PUT mark key error
apiKeyRoutes.put(
  "/:id/error",
  asyncHandler(async (req: any, res: any) => {
    const { error_message, deactivate } = req.body;
    const query = deactivate
      ? "UPDATE api_keys SET is_active = FALSE, last_error_at = NOW(), last_error_message = ? WHERE id = ?"
      : "UPDATE api_keys SET last_error_at = NOW(), last_error_message = ? WHERE id = ?";
    const [result] = await pool.query<ResultSetHeader>(query, [
      error_message,
      req.params.id,
    ]);
    if (result.affectedRows === 0) throw NotFound("API key");
    return ok(res, null, "Error recorded");
  })
);

// DELETE key
apiKeyRoutes.delete(
  "/:id",
  asyncHandler(async (req: any, res: any) => {
    const [result] = await pool.query<ResultSetHeader>(
      "DELETE FROM api_keys WHERE id = ?",
      [req.params.id]
    );
    if (result.affectedRows === 0) throw NotFound("API key");
    return ok(res, null, "Deleted successfully");
  })
);
