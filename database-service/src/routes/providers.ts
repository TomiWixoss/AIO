import { Router } from "express";
import { pool } from "../config/database.js";
import { ok, created } from "shared/response";
import { NotFound, BadRequest } from "shared/errors";
import { asyncHandler } from "shared/error-handler";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

export const providerRoutes = Router();

// Danh sách provider có sẵn trong code
const AVAILABLE_PROVIDERS = [
  { provider_id: "openrouter", display_name: "OpenRouter" },
  { provider_id: "google_ai", display_name: "Google AI (Gemini)" },
  { provider_id: "groq", display_name: "Groq" },
  { provider_id: "cerebras", display_name: "Cerebras" },
];

// GET /providers/available - Danh sách provider có sẵn trong code
providerRoutes.get(
  "/available",
  asyncHandler(async (_req: any, res: any) => {
    return ok(res, AVAILABLE_PROVIDERS);
  })
);

// GET all providers
providerRoutes.get(
  "/",
  asyncHandler(async (_req: any, res: any) => {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT p.*, 
      (SELECT COUNT(*) FROM api_keys ak WHERE ak.provider_id = p.id AND ak.is_active = TRUE) as active_keys_count
    FROM providers p ORDER BY p.priority DESC, p.provider_id`
    );
    return ok(res, rows);
  })
);

// GET active providers only
providerRoutes.get(
  "/active",
  asyncHandler(async (_req: any, res: any) => {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT p.*, 
      (SELECT COUNT(*) FROM api_keys ak WHERE ak.provider_id = p.id AND ak.is_active = TRUE) as active_keys_count
    FROM providers p WHERE p.is_active = TRUE ORDER BY p.priority DESC`
    );
    return ok(res, rows);
  })
);

// GET provider by id
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

// POST create provider (validate provider_id có sẵn)
providerRoutes.post(
  "/",
  asyncHandler(async (req: any, res: any) => {
    const { provider_id, is_active = true, priority = 0, config } = req.body;

    // Validate provider_id có trong danh sách
    const validProvider = AVAILABLE_PROVIDERS.find(
      (p) => p.provider_id === provider_id
    );
    if (!validProvider) {
      throw BadRequest(
        `Invalid provider_id. Available: ${AVAILABLE_PROVIDERS.map(
          (p) => p.provider_id
        ).join(", ")}`
      );
    }

    const [result] = await pool.query<ResultSetHeader>(
      "INSERT INTO providers (provider_id, is_active, priority, config) VALUES (?, ?, ?, ?)",
      [provider_id, is_active, priority, config ? JSON.stringify(config) : null]
    );
    return created(res, {
      id: result.insertId,
      provider_id,
      display_name: validProvider.display_name,
    });
  })
);

// PUT update provider
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

// DELETE provider
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
