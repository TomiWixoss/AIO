import { Router } from "express";
import { pool } from "../config/database.js";
import { ok, created } from "shared/response";
import { NotFound, BadRequest } from "shared/errors";
import { asyncHandler } from "shared/error-handler";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

export const toolRoutes = Router();

// Danh sách tool có sẵn trong code (hardcoded)
const AVAILABLE_TOOLS = [
  { tool_id: "google_search", display_name: "Google Custom Search API" },
];

// GET /tools/available - Lấy danh sách tool có sẵn trong code
toolRoutes.get(
  "/available",
  asyncHandler(async (_req: any, res: any) => {
    return ok(res, AVAILABLE_TOOLS);
  })
);

// GET /tools - Lấy danh sách tools đã cấu hình
toolRoutes.get(
  "/",
  asyncHandler(async (_req: any, res: any) => {
    const [rows] = await pool.query<RowDataPacket[]>(`
    SELECT t.*, 
      (SELECT COUNT(*) FROM tool_keys tk WHERE tk.tool_id = t.id AND tk.is_active = TRUE) as active_keys_count
    FROM tools t
    ORDER BY t.tool_id
  `);
    return ok(res, rows);
  })
);

// GET /tools/:id - Lấy chi tiết tool
toolRoutes.get(
  "/:id",
  asyncHandler(async (req: any, res: any) => {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT t.*, 
      (SELECT COUNT(*) FROM tool_keys tk WHERE tk.tool_id = t.id AND tk.is_active = TRUE) as active_keys_count
    FROM tools t WHERE t.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) throw NotFound("Tool");
    return ok(res, rows[0]);
  })
);

// POST /tools - Thêm tool (chọn từ danh sách có sẵn)
toolRoutes.post(
  "/",
  asyncHandler(async (req: any, res: any) => {
    const { tool_id, is_active = true, config } = req.body;

    // Validate tool_id có trong danh sách
    const validTool = AVAILABLE_TOOLS.find((t) => t.tool_id === tool_id);
    if (!validTool) {
      throw BadRequest(
        `Invalid tool_id. Available: ${AVAILABLE_TOOLS.map(
          (t) => t.tool_id
        ).join(", ")}`
      );
    }

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO tools (tool_id, is_active, config) VALUES (?, ?, ?)`,
      [tool_id, is_active, config ? JSON.stringify(config) : null]
    );

    return created(res, {
      id: result.insertId,
      tool_id,
      display_name: validTool.display_name,
    });
  })
);

// PUT /tools/:id - Cập nhật tool
toolRoutes.put(
  "/:id",
  asyncHandler(async (req: any, res: any) => {
    const { is_active, config } = req.body;

    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE tools SET is_active = COALESCE(?, is_active), config = COALESCE(?, config) WHERE id = ?`,
      [is_active, config ? JSON.stringify(config) : null, req.params.id]
    );

    if (result.affectedRows === 0) throw NotFound("Tool");
    return ok(res, { id: parseInt(req.params.id) }, "Updated successfully");
  })
);

// DELETE /tools/:id - Xóa tool
toolRoutes.delete(
  "/:id",
  asyncHandler(async (req: any, res: any) => {
    const [result] = await pool.query<ResultSetHeader>(
      "DELETE FROM tools WHERE id = ?",
      [req.params.id]
    );
    if (result.affectedRows === 0) throw NotFound("Tool");
    return ok(res, null, "Deleted successfully");
  })
);
