import { Router } from "express";
import { dbGet, dbPost, dbPut, dbDelete } from "../utils/db-client.js";
import { authMiddleware } from "../middleware/auth.js";
import { ok, created } from "shared/response";
import { asyncHandler } from "shared/error-handler";

export const knowledgeBaseRoutes = Router();

knowledgeBaseRoutes.use(authMiddleware);

// ============ KNOWLEDGE BASES ============

// GET all knowledge bases
knowledgeBaseRoutes.get(
  "/",
  asyncHandler(async (_req: any, res: any) => {
    const kbs = await dbGet("/knowledge-bases");
    return ok(res, kbs);
  })
);

// GET active knowledge bases
knowledgeBaseRoutes.get(
  "/active",
  asyncHandler(async (_req: any, res: any) => {
    const kbs = await dbGet("/knowledge-bases/active");
    return ok(res, kbs);
  })
);

// GET knowledge base by id
knowledgeBaseRoutes.get(
  "/:id",
  asyncHandler(async (req: any, res: any) => {
    const kb = await dbGet(`/knowledge-bases/${req.params.id}`);
    return ok(res, kb);
  })
);

// POST create knowledge base
knowledgeBaseRoutes.post(
  "/",
  asyncHandler(async (req: any, res: any) => {
    const result = await dbPost("/knowledge-bases", req.body);
    return created(res, result);
  })
);

// PUT update knowledge base
knowledgeBaseRoutes.put(
  "/:id",
  asyncHandler(async (req: any, res: any) => {
    await dbPut(`/knowledge-bases/${req.params.id}`, req.body);
    return ok(res, { id: parseInt(req.params.id) }, "Updated");
  })
);

// DELETE knowledge base
knowledgeBaseRoutes.delete(
  "/:id",
  asyncHandler(async (req: any, res: any) => {
    await dbDelete(`/knowledge-bases/${req.params.id}`);
    return ok(res, null, "Deleted");
  })
);

// ============ KNOWLEDGE ITEMS ============

// GET items in knowledge base
knowledgeBaseRoutes.get(
  "/:id/items",
  asyncHandler(async (req: any, res: any) => {
    const items = await dbGet(`/knowledge-bases/${req.params.id}/items`);
    return ok(res, items);
  })
);

// POST add item to knowledge base (auto vectorize)
knowledgeBaseRoutes.post(
  "/:id/items",
  asyncHandler(async (req: any, res: any) => {
    const result = await dbPost(
      `/knowledge-bases/${req.params.id}/items`,
      req.body
    );
    return created(res, result);
  })
);

// POST add multiple items (batch)
knowledgeBaseRoutes.post(
  "/:id/items/batch",
  asyncHandler(async (req: any, res: any) => {
    const result = await dbPost(
      `/knowledge-bases/${req.params.id}/items/batch`,
      req.body
    );
    return created(res, result);
  })
);

// DELETE item from knowledge base
knowledgeBaseRoutes.delete(
  "/:kbId/items/:itemId",
  asyncHandler(async (req: any, res: any) => {
    await dbDelete(
      `/knowledge-bases/${req.params.kbId}/items/${req.params.itemId}`
    );
    return ok(res, null, "Deleted");
  })
);

// POST search in knowledge base
knowledgeBaseRoutes.post(
  "/:id/search",
  asyncHandler(async (req: any, res: any) => {
    const results = await dbPost(
      `/knowledge-bases/${req.params.id}/search`,
      req.body
    );
    return ok(res, results);
  })
);
