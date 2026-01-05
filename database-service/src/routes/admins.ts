import { Router } from "express";
import { pool } from "../config/database.js";
import { ok, created } from "shared/response";
import { NotFound, BadRequest } from "shared/errors";
import { asyncHandler } from "shared/error-handler";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

export const adminRoutes = Router();

// GET all admins
adminRoutes.get(
  "/",
  asyncHandler(async (_req: any, res: any) => {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT id, email, name, created_at FROM admins"
    );
    return ok(res, rows);
  })
);

// GET admin by email (for login) - MUST be before /:id
adminRoutes.get(
  "/email/:email",
  asyncHandler(async (req: any, res: any) => {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM admins WHERE email = ?",
      [req.params.email]
    );
    if (rows.length === 0) throw NotFound("Admin");
    return ok(res, rows[0]);
  })
);

// GET admin by id
adminRoutes.get(
  "/:id",
  asyncHandler(async (req: any, res: any) => {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT id, email, name, created_at FROM admins WHERE id = ?",
      [req.params.id]
    );
    if (rows.length === 0) throw NotFound("Admin");
    return ok(res, rows[0]);
  })
);

// POST create admin
adminRoutes.post(
  "/",
  asyncHandler(async (req: any, res: any) => {
    const { email, password_hash, name } = req.body;
    if (!email || !password_hash || !name) {
      throw BadRequest("email, password_hash, name are required");
    }
    const [result] = await pool.query<ResultSetHeader>(
      "INSERT INTO admins (email, password_hash, name) VALUES (?, ?, ?)",
      [email, password_hash, name]
    );
    return created(res, { id: result.insertId, email, name });
  })
);

// PUT update admin
adminRoutes.put(
  "/:id",
  asyncHandler(async (req: any, res: any) => {
    const { name, password_hash } = req.body;
    const updates: string[] = [];
    const values: any[] = [];

    if (name) {
      updates.push("name = ?");
      values.push(name);
    }
    if (password_hash) {
      updates.push("password_hash = ?");
      values.push(password_hash);
    }

    if (updates.length === 0) throw BadRequest("No fields to update");

    values.push(req.params.id);
    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE admins SET ${updates.join(", ")} WHERE id = ?`,
      values
    );
    if (result.affectedRows === 0) throw NotFound("Admin");
    return ok(res, { id: parseInt(req.params.id) }, "Updated successfully");
  })
);

// DELETE admin
adminRoutes.delete(
  "/:id",
  asyncHandler(async (req: any, res: any) => {
    const [result] = await pool.query<ResultSetHeader>(
      "DELETE FROM admins WHERE id = ?",
      [req.params.id]
    );
    if (result.affectedRows === 0) throw NotFound("Admin");
    return ok(res, null, "Deleted successfully");
  })
);
