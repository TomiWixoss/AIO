import { Router } from "express";
import { dbGet } from "../utils/db-client.js";
import { authMiddleware } from "../middleware/auth.js";
import { ok } from "shared/response";
import { asyncHandler } from "shared/error-handler";

export const statsRoutes = Router();

statsRoutes.use(authMiddleware);

// GET /stats - Thống kê tổng quan từ các bảng
statsRoutes.get(
  "/",
  asyncHandler(async (_req: any, res: any) => {
    const [
      providers,
      models,
      tools,
      apiKeys,
      chatbots,
      sessions,
    ] = await Promise.all([
      dbGet<any[]>("/providers").catch(() => []),
      dbGet<any[]>("/models").catch(() => []),
      dbGet<any[]>("/tools").catch(() => []),
      dbGet<any[]>("/api-keys").catch(() => []),
      dbGet<any[]>("/chatbots").catch(() => []),
      dbGet<any[]>("/chat-sessions").catch(() => []),
    ]);

    const stats = {
      providers: {
        total: providers.length,
        active: providers.filter((p: any) => p.is_active).length,
      },
      models: {
        total: models.length,
        active: models.filter((m: any) => m.is_active).length,
      },
      tools: {
        total: tools.length,
        active: tools.filter((t: any) => t.is_active).length,
      },
      api_keys: {
        total: apiKeys.length,
        active: apiKeys.filter((k: any) => k.is_active).length,
      },
      chatbots: {
        total: chatbots.length,
        active: chatbots.filter((c: any) => c.is_active).length,
        public: chatbots.filter((c: any) => c.is_public).length,
      },
      chat_sessions: {
        total: sessions.length,
      },
    };

    return ok(res, stats);
  })
);

