import { Router } from "express";
import { pool } from "../config/database.js";
import { ok, created } from "shared/response";
import { NotFound, BadRequest } from "shared/errors";
import { asyncHandler } from "shared/error-handler";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

export const knowledgeBaseRoutes = Router();

const VECTOR_SERVICE_URL =
  process.env.VECTOR_SERVICE_URL || "http://localhost:6100";

// Response type from vector service
interface VectorResponse {
  success: boolean;
  data?: any;
  error?: { message?: string };
}

// Helper: Call vector service
async function vectorRequest(
  method: string,
  path: string,
  body?: any
): Promise<VectorResponse> {
  const res = await fetch(`${VECTOR_SERVICE_URL}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json() as Promise<VectorResponse>;
}

// GET /knowledge-bases - List all
knowledgeBaseRoutes.get(
  "/",
  asyncHandler(async (_req: any, res: any) => {
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT kb.*, 
        (SELECT COUNT(*) FROM knowledge_items ki WHERE ki.knowledge_base_id = kb.id) as items_count
      FROM knowledge_bases kb 
      ORDER BY kb.created_at DESC
    `);
    return ok(res, rows);
  })
);

// GET /knowledge-bases/active
knowledgeBaseRoutes.get(
  "/active",
  asyncHandler(async (_req: any, res: any) => {
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT * FROM knowledge_bases WHERE is_active = TRUE ORDER BY name
    `);
    return ok(res, rows);
  })
);

// GET /knowledge-bases/:id
knowledgeBaseRoutes.get(
  "/:id",
  asyncHandler(async (req: any, res: any) => {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM knowledge_bases WHERE id = ?",
      [req.params.id]
    );
    if (rows.length === 0) throw NotFound("Knowledge base");
    return ok(res, rows[0]);
  })
);

// POST /knowledge-bases - Create knowledge base
// Tự động tạo collection trong vector-service
knowledgeBaseRoutes.post(
  "/",
  asyncHandler(async (req: any, res: any) => {
    const { name, description, is_active = true } = req.body;
    if (!name) throw BadRequest("name is required");

    // Tạo collection trong vector-service
    const collectionRes = await vectorRequest("POST", "/collections", {
      name: `kb_${name.toLowerCase().replace(/\s+/g, "_")}`,
      description: description || `Knowledge base: ${name}`,
    });

    if (!collectionRes.success) {
      throw BadRequest(
        `Failed to create vector collection: ${collectionRes.error?.message}`
      );
    }

    const collectionId = collectionRes.data.id;

    // Lưu vào MySQL với collection_id
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO knowledge_bases (name, description, collection_id, is_active)
       VALUES (?, ?, ?, ?)`,
      [name, description || null, collectionId, is_active]
    );

    return created(res, {
      id: result.insertId,
      name,
      collection_id: collectionId,
    });
  })
);

// PUT /knowledge-bases/:id
knowledgeBaseRoutes.put(
  "/:id",
  asyncHandler(async (req: any, res: any) => {
    const { name, description, is_active } = req.body;

    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE knowledge_bases SET 
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        is_active = COALESCE(?, is_active)
       WHERE id = ?`,
      [name, description, is_active, req.params.id]
    );

    if (result.affectedRows === 0) throw NotFound("Knowledge base");
    return ok(res, { id: parseInt(req.params.id) }, "Updated");
  })
);

// DELETE /knowledge-bases/:id
knowledgeBaseRoutes.delete(
  "/:id",
  asyncHandler(async (req: any, res: any) => {
    // Get collection_id first
    const [kbRows] = await pool.query<RowDataPacket[]>(
      "SELECT collection_id FROM knowledge_bases WHERE id = ?",
      [req.params.id]
    );

    if (kbRows.length > 0 && kbRows[0].collection_id) {
      // Xóa collection trong vector-service
      try {
        await vectorRequest(
          "DELETE",
          `/collections/${kbRows[0].collection_id}`
        );
      } catch (e) {
        // Ignore if collection doesn't exist
      }
    }

    const [result] = await pool.query<ResultSetHeader>(
      "DELETE FROM knowledge_bases WHERE id = ?",
      [req.params.id]
    );
    if (result.affectedRows === 0) throw NotFound("Knowledge base");
    return ok(res, null, "Deleted");
  })
);

// ============ KNOWLEDGE ITEMS ============

// GET /knowledge-bases/:id/items - List items in knowledge base
knowledgeBaseRoutes.get(
  "/:id/items",
  asyncHandler(async (req: any, res: any) => {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM knowledge_items WHERE knowledge_base_id = ? ORDER BY created_at DESC`,
      [req.params.id]
    );

    // Parse metadata JSON
    const items = rows.map((row) => ({
      ...row,
      metadata: row.metadata ? JSON.parse(row.metadata) : null,
    }));

    return ok(res, items);
  })
);

// POST /knowledge-bases/:id/items - Add item (auto vectorize)
knowledgeBaseRoutes.post(
  "/:id/items",
  asyncHandler(async (req: any, res: any) => {
    const kbId = parseInt(req.params.id);
    const { content, metadata } = req.body;

    if (!content) throw BadRequest("content is required");

    // Check knowledge base exists and get collection_id
    const [kbRows] = await pool.query<RowDataPacket[]>(
      "SELECT id, collection_id FROM knowledge_bases WHERE id = ?",
      [kbId]
    );
    if (kbRows.length === 0) throw NotFound("Knowledge base");

    const collectionId = kbRows[0].collection_id;

    // Add to vector-service (auto generate embedding)
    const vectorRes = await vectorRequest("POST", "/documents", {
      collection_id: collectionId,
      content,
      metadata,
    });

    if (!vectorRes.success) {
      throw BadRequest(`Failed to vectorize: ${vectorRes.error?.message}`);
    }

    // Save to MySQL
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO knowledge_items (knowledge_base_id, content, metadata, vector_doc_id)
       VALUES (?, ?, ?, ?)`,
      [
        kbId,
        content,
        metadata ? JSON.stringify(metadata) : null,
        vectorRes.data.id,
      ]
    );

    return created(res, {
      id: result.insertId,
      vector_doc_id: vectorRes.data.id,
      content: content.substring(0, 100) + (content.length > 100 ? "..." : ""),
    });
  })
);

// POST /knowledge-bases/:id/items/batch - Add multiple items
knowledgeBaseRoutes.post(
  "/:id/items/batch",
  asyncHandler(async (req: any, res: any) => {
    const kbId = parseInt(req.params.id);
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      throw BadRequest("items array is required");
    }

    // Check knowledge base exists and get collection_id
    const [kbRows] = await pool.query<RowDataPacket[]>(
      "SELECT id, collection_id FROM knowledge_bases WHERE id = ?",
      [kbId]
    );
    if (kbRows.length === 0) throw NotFound("Knowledge base");

    const collectionId = kbRows[0].collection_id;

    // Add to vector-service in batch
    const documents = items.map((item: any) => ({
      content: item.content,
      metadata: item.metadata,
    }));

    const vectorRes = await vectorRequest("POST", "/documents/batch", {
      collection_id: collectionId,
      documents,
    });

    if (!vectorRes.success) {
      throw BadRequest(`Failed to vectorize: ${vectorRes.error?.message}`);
    }

    // Save to MySQL
    const insertedIds: number[] = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const vectorDocId = vectorRes.data.ids[i];

      const [result] = await pool.query<ResultSetHeader>(
        `INSERT INTO knowledge_items (knowledge_base_id, content, metadata, vector_doc_id)
         VALUES (?, ?, ?, ?)`,
        [
          kbId,
          item.content,
          item.metadata ? JSON.stringify(item.metadata) : null,
          vectorDocId,
        ]
      );
      insertedIds.push(result.insertId);
    }

    return created(res, {
      inserted: insertedIds.length,
      ids: insertedIds,
    });
  })
);

// DELETE /knowledge-bases/:kbId/items/:itemId
knowledgeBaseRoutes.delete(
  "/:kbId/items/:itemId",
  asyncHandler(async (req: any, res: any) => {
    const { kbId, itemId } = req.params;

    // Get vector_doc_id
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT vector_doc_id FROM knowledge_items WHERE id = ? AND knowledge_base_id = ?",
      [itemId, kbId]
    );
    if (rows.length === 0) throw NotFound("Knowledge item");

    // Delete from vector-service
    if (rows[0].vector_doc_id) {
      try {
        await vectorRequest("DELETE", `/documents/${rows[0].vector_doc_id}`);
      } catch (e) {
        // Ignore
      }
    }

    // Delete from MySQL
    await pool.query("DELETE FROM knowledge_items WHERE id = ?", [itemId]);

    return ok(res, null, "Deleted");
  })
);

// POST /knowledge-bases/:id/search - Search in knowledge base
knowledgeBaseRoutes.post(
  "/:id/search",
  asyncHandler(async (req: any, res: any) => {
    const kbId = parseInt(req.params.id);
    const { query, limit = 5 } = req.body;

    if (!query) throw BadRequest("query is required");

    // Get collection_id
    const [kbRows] = await pool.query<RowDataPacket[]>(
      "SELECT collection_id FROM knowledge_bases WHERE id = ?",
      [kbId]
    );
    if (kbRows.length === 0) throw NotFound("Knowledge base");

    const collectionId = kbRows[0].collection_id;

    // Search in vector-service
    const vectorRes = await vectorRequest("POST", "/documents/search", {
      collection_id: collectionId,
      query,
      limit,
    });

    if (!vectorRes.success) {
      throw BadRequest(`Search failed: ${vectorRes.error?.message}`);
    }

    return ok(res, vectorRes.data);
  })
);
