import { Router } from "express";
import { pool } from "../config/database.js";
import { encrypt } from "../utils/encryption.js";
import { ok, created } from "shared/response";
import { NotFound, BadRequest } from "shared/errors";
import { asyncHandler } from "shared/error-handler";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

export const providerKeyRoutes = Router();

// GET all keys for a provider
providerKeyRoutes.get(
  "/provider/:providerId",
  asyncHandler(async (req: any, res: any) => {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT id, provider_id, name, is_active, priority, requests_today, daily_limit, last_used_at, last_error_at, created_at FROM provider_keys WHERE provider_id = ? ORDER BY priority DESC",
      [req.params.providerId]
    );
    return ok(res, rows);
  })
);

// GET active keys for a provider (for rotation)
providerKeyRoutes.get(
  "/provider/:providerId/active",
  asyncHandler(async (req: any, res: any) => {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM provider_keys 
     WHERE provider_id = ? AND is_active = TRUE 
     AND (daily_limit IS NULL OR requests_today < daily_limit)
     ORDER BY priority DESC, requests_today ASC`,
      [req.params.providerId]
    );
    return ok(res, rows);
  })
);

// GET key by id
providerKeyRoutes.get(
  "/:id(\\d+)",
  asyncHandler(async (req: any, res: any) => {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT id, provider_id, name, is_active, priority, requests_today, daily_limit, last_used_at, last_error_at, created_at FROM provider_keys WHERE id = ?",
      [req.params.id]
    );
    if (rows.length === 0) throw NotFound("Provider key");
    return ok(res, rows[0]);
  })
);

// POST create key (auto-encrypt)
providerKeyRoutes.post(
  "/",
  asyncHandler(async (req: any, res: any) => {
    const { provider_id, api_key, name, priority, daily_limit } = req.body;
    if (!provider_id) throw BadRequest("provider_id is required");
    if (!api_key) throw BadRequest("api_key is required");

    const api_key_encrypted = encrypt(api_key);
    const [result] = await pool.query<ResultSetHeader>(
      "INSERT INTO provider_keys (provider_id, api_key_encrypted, name, priority, daily_limit) VALUES (?, ?, ?, ?, ?)",
      [provider_id, api_key_encrypted, name, priority ?? 0, daily_limit]
    );
    return created(res, { id: result.insertId, provider_id, name });
  })
);

// PUT update key
providerKeyRoutes.put(
  "/:id(\\d+)",
  asyncHandler(async (req: any, res: any) => {
    const { name, is_active, priority, daily_limit } = req.body;
    const [result] = await pool.query<ResultSetHeader>(
      "UPDATE provider_keys SET name = COALESCE(?, name), is_active = COALESCE(?, is_active), priority = COALESCE(?, priority), daily_limit = COALESCE(?, daily_limit) WHERE id = ?",
      [name, is_active, priority, daily_limit, req.params.id]
    );
    if (result.affectedRows === 0) throw NotFound("Provider key");
    return ok(res, { id: parseInt(req.params.id) }, "Updated successfully");
  })
);

// PUT increment request count
providerKeyRoutes.put(
  "/:id/increment",
  asyncHandler(async (req: any, res: any) => {
    const [result] = await pool.query<ResultSetHeader>(
      "UPDATE provider_keys SET requests_today = requests_today + 1, last_used_at = NOW() WHERE id = ?",
      [req.params.id]
    );
    if (result.affectedRows === 0) throw NotFound("Provider key");
    return ok(res, null, "Incremented");
  })
);

// PUT mark key error
providerKeyRoutes.put(
  "/:id/error",
  asyncHandler(async (req: any, res: any) => {
    const { error_message, deactivate } = req.body;
    const query = deactivate
      ? "UPDATE provider_keys SET is_active = FALSE, last_error_at = NOW(), last_error_message = ? WHERE id = ?"
      : "UPDATE provider_keys SET last_error_at = NOW(), last_error_message = ? WHERE id = ?";
    const [result] = await pool.query<ResultSetHeader>(query, [
      error_message,
      req.params.id,
    ]);
    if (result.affectedRows === 0) throw NotFound("Provider key");
    return ok(res, null, "Error recorded");
  })
);

// PUT reset daily counts (call at midnight)
providerKeyRoutes.put(
  "/reset-daily",
  asyncHandler(async (_req: any, res: any) => {
    const [result] = await pool.query<ResultSetHeader>(
      "UPDATE provider_keys SET requests_today = 0"
    );
    return ok(res, { affected: result.affectedRows }, "Reset all daily counts");
  })
);

// DELETE key
providerKeyRoutes.delete(
  "/:id",
  asyncHandler(async (req: any, res: any) => {
    const [result] = await pool.query<ResultSetHeader>(
      "DELETE FROM provider_keys WHERE id = ?",
      [req.params.id]
    );
    if (result.affectedRows === 0) throw NotFound("Provider key");
    return ok(res, null, "Deleted successfully");
  })
);
