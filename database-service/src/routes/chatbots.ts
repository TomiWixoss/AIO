import { Router } from "express";
import { pool } from "../config/database.js";
import { ok, created } from "shared/response";
import { NotFound, BadRequest } from "shared/errors";
import { asyncHandler } from "shared/error-handler";
import type { RowDataPacket, ResultSetHeader } from "mysql2";
import crypto from "crypto";

export const chatbotRoutes = Router();

// GET /chatbots - Lấy tất cả chatbots
chatbotRoutes.get(
  "/",
  asyncHandler(async (_req: any, res: any) => {
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT c.*, 
        p.provider_id as provider_name,
        m.model_id as model_name,
        m.display_name as model_display_name
      FROM chatbots c
      LEFT JOIN providers p ON c.provider_id = p.id
      LEFT JOIN models m ON c.model_id = m.id
      ORDER BY c.created_at DESC
    `);
    return ok(res, rows);
  })
);

// GET /chatbots/active
chatbotRoutes.get(
  "/active",
  asyncHandler(async (_req: any, res: any) => {
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT c.*, 
        p.provider_id as provider_name,
        m.model_id as model_name
      FROM chatbots c
      LEFT JOIN providers p ON c.provider_id = p.id
      LEFT JOIN models m ON c.model_id = m.id
      WHERE c.is_active = TRUE
      ORDER BY c.name
    `);
    return ok(res, rows);
  })
);

// GET /chatbots/slug/:slug - Lấy chatbot theo slug (public)
chatbotRoutes.get(
  "/slug/:slug",
  asyncHandler(async (req: any, res: any) => {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT c.*, 
        p.provider_id as provider_name,
        m.model_id as model_name,
        m.display_name as model_display_name
      FROM chatbots c
      LEFT JOIN providers p ON c.provider_id = p.id
      LEFT JOIN models m ON c.model_id = m.id
      WHERE c.slug = ? AND c.is_active = TRUE`,
      [req.params.slug]
    );
    if (rows.length === 0) throw NotFound("Chatbot");
    return ok(res, rows[0]);
  })
);

// GET /chatbots/api-key/:key - Lấy chatbot theo API key
chatbotRoutes.get(
  "/api-key/:key",
  asyncHandler(async (req: any, res: any) => {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT c.*, 
        p.provider_id as provider_name,
        m.model_id as model_name
      FROM chatbots c
      LEFT JOIN providers p ON c.provider_id = p.id
      LEFT JOIN models m ON c.model_id = m.id
      WHERE c.api_key = ? AND c.is_active = TRUE`,
      [req.params.key]
    );
    if (rows.length === 0) throw NotFound("Chatbot");
    return ok(res, rows[0]);
  })
);

// GET /chatbots/:id
chatbotRoutes.get(
  "/:id",
  asyncHandler(async (req: any, res: any) => {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT c.*, 
        p.provider_id as provider_name,
        m.model_id as model_name,
        m.display_name as model_display_name
      FROM chatbots c
      LEFT JOIN providers p ON c.provider_id = p.id
      LEFT JOIN models m ON c.model_id = m.id
      WHERE c.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) throw NotFound("Chatbot");
    return ok(res, rows[0]);
  })
);

// POST /chatbots - Tạo chatbot mới
chatbotRoutes.post(
  "/",
  asyncHandler(async (req: any, res: any) => {
    const {
      name,
      slug,
      description,
      provider_id,
      model_id,
      auto_mode = false,
      system_prompt,
      temperature = 0.7,
      max_tokens = 2048,
      tool_ids,
      knowledge_base_ids,
      welcome_message,
      placeholder_text,
      is_public = false,
      allowed_origins,
    } = req.body;

    if (!name || !slug) {
      throw BadRequest("name and slug are required");
    }

    // Generate API key
    const api_key = `cb_${crypto.randomBytes(24).toString("hex")}`;

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO chatbots (
        name, slug, description, provider_id, model_id, auto_mode,
        system_prompt, temperature, max_tokens, tool_ids, knowledge_base_ids,
        welcome_message, placeholder_text, is_public, api_key, allowed_origins
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        slug,
        description,
        provider_id || null,
        model_id || null,
        auto_mode,
        system_prompt,
        temperature,
        max_tokens,
        tool_ids ? JSON.stringify(tool_ids) : null,
        knowledge_base_ids ? JSON.stringify(knowledge_base_ids) : null,
        welcome_message,
        placeholder_text || "Nhập tin nhắn...",
        is_public,
        api_key,
        allowed_origins ? JSON.stringify(allowed_origins) : null,
      ]
    );

    return created(res, { id: result.insertId, slug, api_key });
  })
);

// PUT /chatbots/:id
chatbotRoutes.put(
  "/:id",
  asyncHandler(async (req: any, res: any) => {
    const {
      name,
      slug,
      description,
      provider_id,
      model_id,
      auto_mode,
      system_prompt,
      temperature,
      max_tokens,
      tool_ids,
      knowledge_base_ids,
      welcome_message,
      placeholder_text,
      is_public,
      is_active,
      allowed_origins,
    } = req.body;

    const updates: string[] = [];
    const values: any[] = [];

    if (name !== undefined) {
      updates.push("name = ?");
      values.push(name);
    }
    if (slug !== undefined) {
      updates.push("slug = ?");
      values.push(slug);
    }
    if (description !== undefined) {
      updates.push("description = ?");
      values.push(description);
    }
    if (provider_id !== undefined) {
      updates.push("provider_id = ?");
      values.push(provider_id || null);
    }
    if (model_id !== undefined) {
      updates.push("model_id = ?");
      values.push(model_id || null);
    }
    if (auto_mode !== undefined) {
      updates.push("auto_mode = ?");
      values.push(auto_mode);
    }
    if (system_prompt !== undefined) {
      updates.push("system_prompt = ?");
      values.push(system_prompt);
    }
    if (temperature !== undefined) {
      updates.push("temperature = ?");
      values.push(temperature);
    }
    if (max_tokens !== undefined) {
      updates.push("max_tokens = ?");
      values.push(max_tokens);
    }
    if (tool_ids !== undefined) {
      updates.push("tool_ids = ?");
      values.push(JSON.stringify(tool_ids));
    }
    if (knowledge_base_ids !== undefined) {
      updates.push("knowledge_base_ids = ?");
      values.push(JSON.stringify(knowledge_base_ids));
    }
    if (welcome_message !== undefined) {
      updates.push("welcome_message = ?");
      values.push(welcome_message);
    }
    if (placeholder_text !== undefined) {
      updates.push("placeholder_text = ?");
      values.push(placeholder_text);
    }
    if (is_public !== undefined) {
      updates.push("is_public = ?");
      values.push(is_public);
    }
    if (is_active !== undefined) {
      updates.push("is_active = ?");
      values.push(is_active);
    }
    if (allowed_origins !== undefined) {
      updates.push("allowed_origins = ?");
      values.push(JSON.stringify(allowed_origins));
    }

    if (updates.length === 0) {
      throw BadRequest("No fields to update");
    }

    values.push(req.params.id);

    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE chatbots SET ${updates.join(", ")} WHERE id = ?`,
      values
    );

    if (result.affectedRows === 0) throw NotFound("Chatbot");
    return ok(res, { id: parseInt(req.params.id) }, "Updated successfully");
  })
);

// POST /chatbots/:id/regenerate-key - Tạo API key mới
chatbotRoutes.post(
  "/:id/regenerate-key",
  asyncHandler(async (req: any, res: any) => {
    const api_key = `cb_${crypto.randomBytes(24).toString("hex")}`;

    const [result] = await pool.query<ResultSetHeader>(
      "UPDATE chatbots SET api_key = ? WHERE id = ?",
      [api_key, req.params.id]
    );

    if (result.affectedRows === 0) throw NotFound("Chatbot");
    return ok(res, { api_key }, "API key regenerated");
  })
);

// DELETE /chatbots/:id
chatbotRoutes.delete(
  "/:id",
  asyncHandler(async (req: any, res: any) => {
    const [result] = await pool.query<ResultSetHeader>(
      "DELETE FROM chatbots WHERE id = ?",
      [req.params.id]
    );
    if (result.affectedRows === 0) throw NotFound("Chatbot");
    return ok(res, null, "Deleted successfully");
  })
);
