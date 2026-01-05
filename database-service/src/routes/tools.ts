import { Router } from "express";
import { pool } from "../config/database.js";
import { ok, created } from "shared/response";
import { NotFound, BadRequest } from "shared/errors";
import { asyncHandler } from "shared/error-handler";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

export const toolRoutes = Router();

// GET /tools - Lấy danh sách tools
toolRoutes.get(
  "/",
  asyncHandler(async (_req: any, res: any) => {
    const [rows] = await pool.query<RowDataPacket[]>(`
    SELECT t.*, 
      (SELECT COUNT(*) FROM api_keys ak WHERE ak.tool_id = t.id AND ak.is_active = TRUE) as active_keys_count
    FROM tools t
    ORDER BY t.name
  `);

    // Parse JSON fields
    const tools = rows.map((row) => ({
      ...row,
      headers_template: row.headers_template
        ? JSON.parse(row.headers_template)
        : null,
      body_template: row.body_template ? JSON.parse(row.body_template) : null,
      query_params_template: row.query_params_template
        ? JSON.parse(row.query_params_template)
        : null,
      parameters: row.parameters ? JSON.parse(row.parameters) : null,
      response_mapping: row.response_mapping
        ? JSON.parse(row.response_mapping)
        : null,
    }));

    return ok(res, tools);
  })
);

// GET /tools/active - Lấy tools đang active
toolRoutes.get(
  "/active",
  asyncHandler(async (_req: any, res: any) => {
    const [rows] = await pool.query<RowDataPacket[]>(`
    SELECT * FROM tools WHERE is_active = TRUE ORDER BY name
  `);

    const tools = rows.map((row) => ({
      ...row,
      headers_template: row.headers_template
        ? JSON.parse(row.headers_template)
        : null,
      body_template: row.body_template ? JSON.parse(row.body_template) : null,
      query_params_template: row.query_params_template
        ? JSON.parse(row.query_params_template)
        : null,
      parameters: row.parameters ? JSON.parse(row.parameters) : null,
      response_mapping: row.response_mapping
        ? JSON.parse(row.response_mapping)
        : null,
    }));

    return ok(res, tools);
  })
);

// GET /tools/:id - Lấy chi tiết tool
toolRoutes.get(
  "/:id",
  asyncHandler(async (req: any, res: any) => {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM tools WHERE id = ?",
      [req.params.id]
    );
    if (rows.length === 0) throw NotFound("Tool");

    const tool = {
      ...rows[0],
      headers_template: rows[0].headers_template
        ? JSON.parse(rows[0].headers_template)
        : null,
      body_template: rows[0].body_template
        ? JSON.parse(rows[0].body_template)
        : null,
      query_params_template: rows[0].query_params_template
        ? JSON.parse(rows[0].query_params_template)
        : null,
      parameters: rows[0].parameters ? JSON.parse(rows[0].parameters) : null,
      response_mapping: rows[0].response_mapping
        ? JSON.parse(rows[0].response_mapping)
        : null,
    };

    return ok(res, tool);
  })
);

// POST /tools - Tạo custom API tool
toolRoutes.post(
  "/",
  asyncHandler(async (req: any, res: any) => {
    const {
      name,
      description,
      endpoint_url,
      http_method = "GET",
      headers_template,
      body_template,
      query_params_template,
      parameters,
      response_mapping,
      is_active = true,
    } = req.body;

    if (!name || !description || !endpoint_url || !parameters) {
      throw BadRequest(
        "name, description, endpoint_url, parameters are required"
      );
    }

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO tools (name, description, endpoint_url, http_method, headers_template, 
      body_template, query_params_template, parameters, response_mapping, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        description,
        endpoint_url,
        http_method,
        headers_template ? JSON.stringify(headers_template) : null,
        body_template ? JSON.stringify(body_template) : null,
        query_params_template ? JSON.stringify(query_params_template) : null,
        JSON.stringify(parameters),
        response_mapping ? JSON.stringify(response_mapping) : null,
        is_active,
      ]
    );

    return created(res, { id: result.insertId, name });
  })
);

// PUT /tools/:id - Cập nhật tool
toolRoutes.put(
  "/:id",
  asyncHandler(async (req: any, res: any) => {
    const {
      name,
      description,
      endpoint_url,
      http_method,
      headers_template,
      body_template,
      query_params_template,
      parameters,
      response_mapping,
      is_active,
    } = req.body;

    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE tools SET 
      name = COALESCE(?, name),
      description = COALESCE(?, description),
      endpoint_url = COALESCE(?, endpoint_url),
      http_method = COALESCE(?, http_method),
      headers_template = COALESCE(?, headers_template),
      body_template = COALESCE(?, body_template),
      query_params_template = COALESCE(?, query_params_template),
      parameters = COALESCE(?, parameters),
      response_mapping = COALESCE(?, response_mapping),
      is_active = COALESCE(?, is_active)
    WHERE id = ?`,
      [
        name,
        description,
        endpoint_url,
        http_method,
        headers_template ? JSON.stringify(headers_template) : null,
        body_template ? JSON.stringify(body_template) : null,
        query_params_template ? JSON.stringify(query_params_template) : null,
        parameters ? JSON.stringify(parameters) : null,
        response_mapping ? JSON.stringify(response_mapping) : null,
        is_active,
        req.params.id,
      ]
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
