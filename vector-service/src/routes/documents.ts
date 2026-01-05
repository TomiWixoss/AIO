import { Router, Request, Response } from "express";
import { db, createVectorTable } from "../db/index.js";
import { ok, created } from "shared/response";
import { NotFound, BadRequest } from "shared/errors";
import { asyncHandler } from "shared/error-handler";
import {
  generateEmbedding,
  generateEmbeddings,
  generateQueryEmbedding,
} from "../services/embedding.js";

export const documentRoutes = Router();

interface Collection {
  id: number;
  dimensions: number;
}

// GET /documents/collection/:collectionId - List documents in collection
documentRoutes.get(
  "/collection/:collectionId",
  asyncHandler(async (req: Request, res: Response) => {
    const rows = db
      .prepare(
        "SELECT id, collection_id, content, metadata, created_at FROM documents WHERE collection_id = ? ORDER BY created_at DESC"
      )
      .all(req.params.collectionId);
    return ok(res, rows);
  })
);

// GET /documents/:id
documentRoutes.get(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const row = db
      .prepare("SELECT * FROM documents WHERE id = ?")
      .get(req.params.id);
    if (!row) throw NotFound("Document");
    return ok(res, row);
  })
);

// POST /documents - Add document with embedding
documentRoutes.post(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const { collection_id, content, metadata } = req.body;
    if (!collection_id || !content) {
      throw BadRequest("collection_id and content are required");
    }

    // Get collection
    const collection = db
      .prepare("SELECT id, dimensions FROM collections WHERE id = ?")
      .get(collection_id) as Collection | undefined;
    if (!collection) throw NotFound("Collection");

    // Generate embedding
    const embedding = await generateEmbedding(content);

    // Insert document
    const docResult = db
      .prepare(
        "INSERT INTO documents (collection_id, content, metadata) VALUES (?, ?, ?)"
      )
      .run(collection_id, content, metadata ? JSON.stringify(metadata) : null);

    const docId = Number(docResult.lastInsertRowid);

    // Insert embedding into vector table
    const vecTable = `vec_collection_${collection_id}`;
    createVectorTable(collection_id, collection.dimensions);

    db.prepare(`INSERT INTO ${vecTable} (rowid, embedding) VALUES (?, ?)`).run(
      BigInt(docId),
      new Float32Array(embedding)
    );

    return created(res, { id: docId, collection_id, content });
  })
);

// POST /documents/batch - Add multiple documents
documentRoutes.post(
  "/batch",
  asyncHandler(async (req: Request, res: Response) => {
    const { collection_id, documents } = req.body;
    if (!collection_id || !documents || !Array.isArray(documents)) {
      throw BadRequest("collection_id and documents array are required");
    }

    // Get collection
    const collection = db
      .prepare("SELECT id, dimensions FROM collections WHERE id = ?")
      .get(collection_id) as Collection | undefined;
    if (!collection) throw NotFound("Collection");

    // Generate embeddings in batch
    const contents = documents.map((d: { content: string }) => d.content);
    const embeddings = await generateEmbeddings(contents);

    // Ensure vector table exists
    const vecTable = `vec_collection_${collection_id}`;
    createVectorTable(collection_id, collection.dimensions);

    // Insert documents and embeddings
    const insertDoc = db.prepare(
      "INSERT INTO documents (collection_id, content, metadata) VALUES (?, ?, ?)"
    );
    const insertVec = db.prepare(
      `INSERT INTO ${vecTable} (rowid, embedding) VALUES (?, ?)`
    );

    const insertedIds: number[] = [];

    const transaction = db.transaction(() => {
      for (let i = 0; i < documents.length; i++) {
        const doc = documents[i];
        const docResult = insertDoc.run(
          collection_id,
          doc.content,
          doc.metadata ? JSON.stringify(doc.metadata) : null
        );
        const docId = Number(docResult.lastInsertRowid);
        insertVec.run(BigInt(docId), new Float32Array(embeddings[i]));
        insertedIds.push(docId);
      }
    });

    transaction();

    return created(res, {
      inserted: insertedIds.length,
      ids: insertedIds,
    });
  })
);

// POST /documents/search - Semantic search
documentRoutes.post(
  "/search",
  asyncHandler(async (req: Request, res: Response) => {
    const { collection_id, query, limit = 5 } = req.body;
    if (!collection_id || !query) {
      throw BadRequest("collection_id and query are required");
    }

    // Get collection
    const collection = db
      .prepare("SELECT id, dimensions FROM collections WHERE id = ?")
      .get(collection_id) as Collection | undefined;
    if (!collection) throw NotFound("Collection");

    // Generate query embedding
    const queryEmbedding = await generateQueryEmbedding(query);

    // Search in vector table
    const vecTable = `vec_collection_${collection_id}`;

    const results = db
      .prepare(
        `SELECT 
          v.rowid as document_id,
          v.distance,
          d.content,
          d.metadata
        FROM ${vecTable} v
        JOIN documents d ON d.id = v.rowid
        WHERE v.embedding MATCH ?
          AND k = ?
        ORDER BY v.distance`
      )
      .all(new Float32Array(queryEmbedding), limit) as Array<{
      document_id: number;
      distance: number;
      content: string;
      metadata: string | null;
    }>;

    // Format results with similarity score (1 - distance for cosine)
    const formatted = results.map((r) => ({
      id: r.document_id,
      content: r.content,
      metadata: r.metadata ? JSON.parse(r.metadata) : null,
      similarity: 1 - r.distance, // Convert distance to similarity
    }));

    return ok(res, formatted);
  })
);

// DELETE /documents/:id
documentRoutes.delete(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const doc = db
      .prepare("SELECT collection_id FROM documents WHERE id = ?")
      .get(req.params.id) as { collection_id: number } | undefined;

    if (!doc) throw NotFound("Document");

    // Delete from vector table
    const vecTable = `vec_collection_${doc.collection_id}`;
    try {
      db.prepare(`DELETE FROM ${vecTable} WHERE rowid = ?`).run(req.params.id);
    } catch (e) {
      // Ignore if vector doesn't exist
    }

    // Delete document
    db.prepare("DELETE FROM documents WHERE id = ?").run(req.params.id);

    return ok(res, null, "Deleted");
  })
);
