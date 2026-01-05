import { Router } from "express";
import { pool } from "../config/database.js";
import { ok, created } from "shared/response";
import { NotFound, BadRequest } from "shared/errors";
import { asyncHandler } from "shared/error-handler";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

export const providerRoutes = Router();

// GET all providers
providerRoutes.get(
  "/",
  asyncHandler(async (_req: any, res: any) => {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM providers ORDER BY priority DESC, name"
    );
    return ok(res, rows);
  })
);

// GET active providers only (must be before /:id)
providerRoutes.get(
  "/active",
  asyncHandler(async (_req: any, res: any) => {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM providers WHERE is_active = TRUE ORDER BY priority DESC"
    );
    return ok(res, rows);
  })
);

// GET provider by name (must be before /:id)
providerRoutes.get(
  "/name/:name",
  asyncHandler(async (req: any, res: any) => {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM providers WHERE name = ?",
      [req.params.name]
    );
    if (rows.length === 0) throw NotFound("Provider");
    return ok(res, rows[0]);
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

// POST create provider
providerRoutes.post(
  "/",
  asyncHandler(async (req: any, res: any) => {
    const {
      name,
      display_name,
      base_url,
      is_active,
      priority,
      free_tier_info,
    } = req.body;
    if (!name || !display_name) {
      throw BadRequest("name and display_name are required");
    }
    const [result] = await pool.query<ResultSetHeader>(
      "INSERT INTO providers (name, display_name, base_url, is_active, priority, free_tier_info) VALUES (?, ?, ?, ?, ?, ?)",
      [
        name,
        display_name,
        base_url,
        is_active ?? true,
        priority ?? 0,
        free_tier_info,
      ]
    );
    return created(res, { id: result.insertId, name, display_name });
  })
);

// PUT update provider
providerRoutes.put(
  "/:id",
  asyncHandler(async (req: any, res: any) => {
    const { display_name, base_url, is_active, priority, free_tier_info } =
      req.body;
    const [result] = await pool.query<ResultSetHeader>(
      "UPDATE providers SET display_name = COALESCE(?, display_name), base_url = COALESCE(?, base_url), is_active = COALESCE(?, is_active), priority = COALESCE(?, priority), free_tier_info = COALESCE(?, free_tier_info) WHERE id = ?",
      [
        display_name,
        base_url,
        is_active,
        priority,
        free_tier_info,
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
