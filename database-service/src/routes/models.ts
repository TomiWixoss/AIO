import { Router } from "express";
import { pool } from "../config/database.js";
import { ok, created } from "shared/response";
import { NotFound, BadRequest } from "shared/errors";
import { asyncHandler } from "shared/error-handler";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

export const modelRoutes = Router();

// GET all models
modelRoutes.get(
  "/",
  asyncHandler(async (_req: any, res: any) => {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT m.*, p.provider_id as provider_name 
     FROM models m 
     JOIN providers p ON m.provider_id = p.id 
     ORDER BY p.provider_id, m.display_name`
    );
    return ok(res, rows);
  })
);

// GET active models (must be before /:id)
modelRoutes.get(
  "/active",
  asyncHandler(async (_req: any, res: any) => {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT m.*, p.provider_id as provider_name, p.priority as provider_priority
     FROM models m 
     JOIN providers p ON m.provider_id = p.id 
     WHERE m.is_active = TRUE AND p.is_active = TRUE
     ORDER BY p.priority DESC, m.priority DESC`
    );
    return ok(res, rows);
  })
);

// GET models for auto mode - sorted by provider priority then model priority
modelRoutes.get(
  "/auto-priority",
  asyncHandler(async (_req: any, res: any) => {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT m.*, p.provider_id as provider_name, p.priority as provider_priority,
              (SELECT COUNT(*) FROM api_keys ak WHERE ak.provider_id = p.id AND ak.is_active = TRUE) as active_keys_count
       FROM models m 
       JOIN providers p ON m.provider_id = p.id 
       WHERE m.is_active = TRUE AND p.is_active = TRUE
       ORDER BY p.priority DESC, m.priority DESC`
    );
    return ok(res, rows);
  })
);

// GET fallback models (must be before /:id)
modelRoutes.get(
  "/fallback",
  asyncHandler(async (_req: any, res: any) => {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT m.*, p.provider_id as provider_name 
     FROM models m 
     JOIN providers p ON m.provider_id = p.id 
     WHERE m.is_fallback = TRUE AND m.is_active = TRUE AND p.is_active = TRUE`
    );
    return ok(res, rows);
  })
);

// GET models by provider (must be before /:id)
modelRoutes.get(
  "/provider/:providerId",
  asyncHandler(async (req: any, res: any) => {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM models WHERE provider_id = ? ORDER BY display_name",
      [req.params.providerId]
    );
    return ok(res, rows);
  })
);

// GET model by provider and model_id (must be before /:id)
modelRoutes.get(
  "/provider/:providerId/model/:modelId",
  asyncHandler(async (req: any, res: any) => {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM models WHERE provider_id = ? AND model_id = ?",
      [req.params.providerId, decodeURIComponent(req.params.modelId)]
    );
    if (rows.length === 0) throw NotFound("Model");
    return ok(res, rows[0]);
  })
);

// GET model by id
modelRoutes.get(
  "/:id",
  asyncHandler(async (req: any, res: any) => {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM models WHERE id = ?",
      [req.params.id]
    );
    if (rows.length === 0) throw NotFound("Model");
    return ok(res, rows[0]);
  })
);

// POST create model
modelRoutes.post(
  "/",
  asyncHandler(async (req: any, res: any) => {
    const {
      provider_id,
      model_id,
      display_name,
      context_length,
      is_active,
      is_fallback,
      priority,
    } = req.body;
    if (!provider_id || !model_id || !display_name) {
      throw BadRequest("provider_id, model_id, display_name are required");
    }
    const [result] = await pool.query<ResultSetHeader>(
      "INSERT INTO models (provider_id, model_id, display_name, context_length, is_active, is_fallback, priority) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        provider_id,
        model_id,
        display_name,
        context_length,
        is_active ?? true,
        is_fallback ?? false,
        priority ?? 0,
      ]
    );
    return created(res, { id: result.insertId, model_id, display_name });
  })
);

// PUT update model
modelRoutes.put(
  "/:id",
  asyncHandler(async (req: any, res: any) => {
    const { display_name, context_length, is_active, is_fallback, priority } =
      req.body;
    const [result] = await pool.query<ResultSetHeader>(
      "UPDATE models SET display_name = COALESCE(?, display_name), context_length = COALESCE(?, context_length), is_active = COALESCE(?, is_active), is_fallback = COALESCE(?, is_fallback), priority = COALESCE(?, priority) WHERE id = ?",
      [
        display_name,
        context_length,
        is_active,
        is_fallback,
        priority,
        req.params.id,
      ]
    );
    if (result.affectedRows === 0) throw NotFound("Model");
    return ok(res, { id: parseInt(req.params.id) }, "Updated successfully");
  })
);

// DELETE model
modelRoutes.delete(
  "/:id",
  asyncHandler(async (req: any, res: any) => {
    const [result] = await pool.query<ResultSetHeader>(
      "DELETE FROM models WHERE id = ?",
      [req.params.id]
    );
    if (result.affectedRows === 0) throw NotFound("Model");
    return ok(res, null, "Deleted successfully");
  })
);
