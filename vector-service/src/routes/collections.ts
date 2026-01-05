import { Router, Request, Response } from "express";
import { db, createVectorTable } from "../db/index.js";
import { ok, created } from "shared/response";
import { NotFound, BadRequest } from "shared/errors";
import { asyncHandler } from "shared/error-handler";
import { config } from "../config/index.js";

export const collectionRoutes = Router();

// GET /collections - List all collections
collectionRoutes.get(
  "/",
  asyncHandler(async (_req: Request, res: Response) => {
    const rows = db
      .prepare(
        `SELECT c.*, 
        (SELECT COUNT(*) FROM documents d WHERE d.collection_id = c.id) as document_count
       FROM collections c ORDER BY c.created_at DESC`
      )
      .all();
    return ok(res, rows);
  })
);

// GET /collections/:id
collectionRoutes.get(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const row = db
      .prepare(
        `SELECT c.*, 
        (SELECT COUNT(*) FROM documents d WHERE d.collection_id = c.id) as document_count
       FROM collections c WHERE c.id = ?`
      )
      .get(req.params.id);
    if (!row) throw NotFound("Collection");
    return ok(res, row);
  })
);

// POST /collections - Create collection
collectionRoutes.post(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const { name, description } = req.body;
    if (!name) throw BadRequest("name is required");

    const dimensions = config.embeddingDimensions;

    const result = db
      .prepare(
        "INSERT INTO collections (name, description, dimensions) VALUES (?, ?, ?)"
      )
      .run(name, description || null, dimensions);

    // Create vector table for this collection
    createVectorTable(Number(result.lastInsertRowid), dimensions);

    return created(res, {
      id: result.lastInsertRowid,
      name,
      dimensions,
    });
  })
);

// PUT /collections/:id
collectionRoutes.put(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const { name, description } = req.body;
    const result = db
      .prepare(
        "UPDATE collections SET name = COALESCE(?, name), description = COALESCE(?, description) WHERE id = ?"
      )
      .run(name, description, req.params.id);
    if (result.changes === 0) throw NotFound("Collection");
    return ok(res, { id: parseInt(req.params.id) }, "Updated");
  })
);

// DELETE /collections/:id
collectionRoutes.delete(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id;

    // Drop vector table
    try {
      db.exec(`DROP TABLE IF EXISTS vec_collection_${id}`);
    } catch (e) {
      // Ignore if table doesn't exist
    }

    const result = db.prepare("DELETE FROM collections WHERE id = ?").run(id);
    if (result.changes === 0) throw NotFound("Collection");
    return ok(res, null, "Deleted");
  })
);
