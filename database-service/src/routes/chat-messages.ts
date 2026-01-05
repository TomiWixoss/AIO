import { Router } from "express";
import { pool } from "../config/database.js";
import { ok, created } from "shared/response";
import { NotFound, BadRequest } from "shared/errors";
import { asyncHandler } from "shared/error-handler";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

export const chatMessageRoutes = Router();

// GET messages by session
chatMessageRoutes.get(
  "/session/:sessionId",
  asyncHandler(async (req: any, res: any) => {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT cm.*, m.model_id as model_name, p.name as provider_name 
     FROM chat_messages cm 
     LEFT JOIN models m ON cm.model_id = m.id 
     LEFT JOIN providers p ON cm.provider_id = p.id 
     WHERE cm.session_id = ? 
     ORDER BY cm.created_at`,
      [req.params.sessionId]
    );
    return ok(res, rows);
  })
);

// GET message by id
chatMessageRoutes.get(
  "/:id(\\d+)",
  asyncHandler(async (req: any, res: any) => {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM chat_messages WHERE id = ?",
      [req.params.id]
    );
    if (rows.length === 0) throw NotFound("Message");
    return ok(res, rows[0]);
  })
);

// POST create message
chatMessageRoutes.post(
  "/",
  asyncHandler(async (req: any, res: any) => {
    const { session_id, role, content, model_id, provider_id } = req.body;
    if (!session_id || !role || !content) {
      throw BadRequest("session_id, role, content are required");
    }
    const [result] = await pool.query<ResultSetHeader>(
      "INSERT INTO chat_messages (session_id, role, content, model_id, provider_id) VALUES (?, ?, ?, ?, ?)",
      [session_id, role, content, model_id, provider_id]
    );
    return created(res, { id: result.insertId });
  })
);

// POST create multiple messages (batch)
chatMessageRoutes.post(
  "/batch",
  asyncHandler(async (req: any, res: any) => {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      throw BadRequest("messages array is required");
    }
    const values = messages.map((m: any) => [
      m.session_id,
      m.role,
      m.content,
      m.model_id,
      m.provider_id,
    ]);
    const [result] = await pool.query<ResultSetHeader>(
      "INSERT INTO chat_messages (session_id, role, content, model_id, provider_id) VALUES ?",
      [values]
    );
    return created(res, { inserted: result.affectedRows });
  })
);

// DELETE message
chatMessageRoutes.delete(
  "/:id(\\d+)",
  asyncHandler(async (req: any, res: any) => {
    const [result] = await pool.query<ResultSetHeader>(
      "DELETE FROM chat_messages WHERE id = ?",
      [req.params.id]
    );
    if (result.affectedRows === 0) throw NotFound("Message");
    return ok(res, null, "Deleted successfully");
  })
);

// DELETE all messages in session
chatMessageRoutes.delete(
  "/session/:sessionId",
  asyncHandler(async (req: any, res: any) => {
    const [result] = await pool.query<ResultSetHeader>(
      "DELETE FROM chat_messages WHERE session_id = ?",
      [req.params.sessionId]
    );
    return ok(
      res,
      { deleted: result.affectedRows },
      "Deleted all messages in session"
    );
  })
);
