import { Router } from "express";
import { pool } from "../config/database.js";
import { ok, created } from "shared/response";
import { NotFound, BadRequest } from "shared/errors";
import { asyncHandler } from "shared/error-handler";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

export const chatSessionRoutes = Router();

// GET all sessions
chatSessionRoutes.get(
  "/",
  asyncHandler(async (_req: any, res: any) => {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM chat_sessions ORDER BY updated_at DESC"
    );
    return ok(res, rows);
  })
);

// GET session by id
chatSessionRoutes.get(
  "/:id(\\d+)",
  asyncHandler(async (req: any, res: any) => {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM chat_sessions WHERE id = ?",
      [req.params.id]
    );
    if (rows.length === 0) throw NotFound("Session");
    return ok(res, rows[0]);
  })
);

// GET session by session_key
chatSessionRoutes.get(
  "/key/:sessionKey",
  asyncHandler(async (req: any, res: any) => {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM chat_sessions WHERE session_key = ?",
      [req.params.sessionKey]
    );
    if (rows.length === 0) throw NotFound("Session");
    return ok(res, rows[0]);
  })
);

// POST create session
chatSessionRoutes.post(
  "/",
  asyncHandler(async (req: any, res: any) => {
    const { session_key, title } = req.body;
    if (!session_key) throw BadRequest("session_key is required");
    const [result] = await pool.query<ResultSetHeader>(
      "INSERT INTO chat_sessions (session_key, title) VALUES (?, ?)",
      [session_key, title]
    );
    return created(res, { id: result.insertId, session_key });
  })
);

// PUT update session
chatSessionRoutes.put(
  "/:id",
  asyncHandler(async (req: any, res: any) => {
    const { title } = req.body;
    const [result] = await pool.query<ResultSetHeader>(
      "UPDATE chat_sessions SET title = COALESCE(?, title) WHERE id = ?",
      [title, req.params.id]
    );
    if (result.affectedRows === 0) throw NotFound("Session");
    return ok(res, { id: parseInt(req.params.id) }, "Updated successfully");
  })
);

// DELETE session
chatSessionRoutes.delete(
  "/:id",
  asyncHandler(async (req: any, res: any) => {
    const [result] = await pool.query<ResultSetHeader>(
      "DELETE FROM chat_sessions WHERE id = ?",
      [req.params.id]
    );
    if (result.affectedRows === 0) throw NotFound("Session");
    return ok(res, null, "Deleted successfully");
  })
);
