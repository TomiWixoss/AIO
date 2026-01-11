import { Router } from "express";
import { pool } from "../config/database.js";
import { ok, created } from "shared/response";
import { NotFound, BadRequest } from "shared/errors";
import { asyncHandler } from "shared/error-handler";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

export const providerRoutes = Router();

// Provider IDs được hỗ trợ trong code
const SUPPORTED_PROVIDERS = ["openrouter", "google-ai", "groq", "cerebras"];

// GET /providers/supported - Danh sách provider được hỗ trợ
providerRoutes.get(
  "/supported",
  asyncHandler(async (_req: any, res: any) => {
    return ok(res, SUPPORTED_PROVIDERS);
  })
);

// GET /providers - Lấy tất cả providers
providerRoutes.get(
  "/",
  asyncHandler(async (_req: any, res: any) => {
    const [rows] = await pool.query<RowDataPacket[]>(`
    SELECT p.*, 
      (SELECT COUNT(*) FROM api_keys ak WHERE ak.provider_id = p.id AND ak.is_active = TRUE) as active_keys_count,
      (SELECT COUNT(*) FROM models m WHERE m.provider_id = p.id) as models_count
    FROM providers p ORDER BY p.priority DESC, p.provider_id
  `);
    return ok(res, rows);
  })
);

// GET /providers/active
providerRoutes.get(
  "/active",
  asyncHandler(async (_req: any, res: any) => {
    const [rows] = await pool.query<RowDataPacket[]>(`
    SELECT p.*, 
      (SELECT COUNT(*) FROM api_keys ak WHERE ak.provider_id = p.id AND ak.is_active = TRUE) as active_keys_count,
      (SELECT COUNT(*) FROM models m WHERE m.provider_id = p.id) as models_count
    FROM providers p WHERE p.is_active = TRUE ORDER BY p.priority DESC
  `);
    return ok(res, rows);
  })
);

// GET /providers/name/:name - Lấy provider theo provider_id
providerRoutes.get(
  "/name/:name",
  asyncHandler(async (req: any, res: any) => {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM providers WHERE provider_id = ?",
      [req.params.name]
    );
    if (rows.length === 0) throw NotFound("Provider");
    return ok(res, rows[0]);
  })
);

// GET /providers/:id
providerRoutes.get(
  "/:id",
  asyncHandler(async (req: any, res: any) => {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM providers WHERE id = ?",
      [req.params.id]
    );
    if (rows.length === 0) throw NotFound("Provider");
    return ok(res, rows[0]);
  })
);

// POST /providers - Tạo provider
providerRoutes.post(
  "/",
  asyncHandler(async (req: any, res: any) => {
    const { provider_id, is_active = true, priority = 0, config } = req.body;

    if (!provider_id) {
      throw BadRequest("provider_id is required");
    }

    if (!SUPPORTED_PROVIDERS.includes(provider_id)) {
      throw BadRequest(
        `Invalid provider_id. Supported: ${SUPPORTED_PROVIDERS.join(", ")}`
      );
    }

    const [result] = await pool.query<ResultSetHeader>(
      "INSERT INTO providers (provider_id, is_active, priority, config) VALUES (?, ?, ?, ?)",
      [provider_id, is_active, priority, config ? JSON.stringify(config) : null]
    );
    return created(res, { id: result.insertId, provider_id });
  })
);

// PUT /providers/:id
providerRoutes.put(
  "/:id",
  asyncHandler(async (req: any, res: any) => {
    const { is_active, priority, config } = req.body;
    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE providers SET is_active = COALESCE(?, is_active), priority = COALESCE(?, priority), 
     config = COALESCE(?, config) WHERE id = ?`,
      [
        is_active,
        priority,
        config ? JSON.stringify(config) : null,
        req.params.id,
      ]
    );
    if (result.affectedRows === 0) throw NotFound("Provider");
    return ok(res, { id: parseInt(req.params.id) }, "Updated successfully");
  })
);

// DELETE /providers/:id
providerRoutes.delete(
  "/:id",
  asyncHandler(async (req: any, res: any) => {
    const [result] = await pool.query<ResultSetHeader>(
      "DELETE FROM providers WHERE id = ?",
      [req.params.id]
    );
    if (result.affectedRows === 0) throw NotFound("Provider");
    return ok(res, null, "Deleted successfully");
  })
);
