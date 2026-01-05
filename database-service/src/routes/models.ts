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
      `SELECT m.*, p.name as provider_name, p.display_name as provider_display_name 
     FROM models m 
     JOIN providers p ON m.provider_id = p.id 
     ORDER BY p.name, m.display_name`
    );
    return ok(res, rows);
  })
);

// GET active models
modelRoutes.get(
  "/active",
  asyncHandler(async (_req: any, res: any) => {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT m.*, p.name as provider_name 
     FROM models m 
     JOIN providers p ON m.provider_id = p.id 
     WHERE m.is_active = TRUE AND p.is_active = TRUE`
    );
    return ok(res, rows);
  })
);

// GET models by provider
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

// GET fallback models
modelRoutes.get(
  "/fallback",
  asyncHandler(async (_req: any, res: any) => {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT m.*, p.name as provider_name 
     FROM models m 
     JOIN providers p ON m.provider_id = p.id 
     WHERE m.is_fallback = TRUE AND m.is_active = TRUE AND p.is_active = TRUE`
    );
    return ok(res, rows);
  })
);

// GET model by id
modelRoutes.get(
  "/:id(\\d+)",
  asyncHandler(async (req: any, res: any) => {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM models WHERE id = ?",
      [req.params.id]
    );
    if (rows.length === 0) throw NotFound("Model");
    return ok(res, rows[0]);
  })
);

// GET model by provider and model_id
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
    } = req.body;
    if (!provider_id || !model_id || !display_name) {
      throw BadRequest("provider_id, model_id, display_name are required");
    }
    const [result] = await pool.query<ResultSetHeader>(
      "INSERT INTO models (provider_id, model_id, display_name, context_length, is_active, is_fallback) VALUES (?, ?, ?, ?, ?, ?)",
      [
        provider_id,
        model_id,
        display_name,
        context_length,
        is_active ?? true,
        is_fallback ?? false,
      ]
    );
    return created(res, { id: result.insertId, model_id, display_name });
  })
);

// PUT update model
modelRoutes.put(
  "/:id",
  asyncHandler(async (req: any, res: any) => {
    const { display_name, context_length, is_active, is_fallback } = req.body;
    const [result] = await pool.query<ResultSetHeader>(
      "UPDATE models SET display_name = COALESCE(?, display_name), context_length = COALESCE(?, context_length), is_active = COALESCE(?, is_active), is_fallback = COALESCE(?, is_fallback) WHERE id = ?",
      [display_name, context_length, is_active, is_fallback, req.params.id]
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
