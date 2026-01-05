import { Router } from "express";
import bcrypt from "bcryptjs";
import { dbGet, dbPost, dbPut, dbDelete } from "../utils/db-client.js";
import { authMiddleware } from "../middleware/auth.js";
import { ok, created } from "shared/response";
import { BadRequest } from "shared/errors";
import { asyncHandler } from "shared/error-handler";

export const adminRoutes = Router();

adminRoutes.use(authMiddleware);

// GET all admins
adminRoutes.get(
  "/",
  asyncHandler(async (_req: any, res: any) => {
    const admins = await dbGet("/admins");
    return ok(res, admins);
  })
);

// GET admin by id
adminRoutes.get(
  "/:id",
  asyncHandler(async (req: any, res: any) => {
    const admin = await dbGet(`/admins/${req.params.id}`);
    return ok(res, admin);
  })
);

// POST create admin
adminRoutes.post(
  "/",
  asyncHandler(async (req: any, res: any) => {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      throw BadRequest("email, password, name are required");
    }
    const password_hash = await bcrypt.hash(password, 10);
    const result = await dbPost("/admins", { email, password_hash, name });
    return created(res, result);
  })
);

// PUT update admin
adminRoutes.put(
  "/:id",
  asyncHandler(async (req: any, res: any) => {
    const { name, password } = req.body;
    const updateData: any = {};
    if (name) updateData.name = name;
    if (password) updateData.password_hash = await bcrypt.hash(password, 10);

    await dbPut(`/admins/${req.params.id}`, updateData);
    return ok(res, { id: parseInt(req.params.id) }, "Updated successfully");
  })
);

// DELETE admin
adminRoutes.delete(
  "/:id",
  asyncHandler(async (req: any, res: any) => {
    await dbDelete(`/admins/${req.params.id}`);
    return ok(res, null, "Deleted successfully");
  })
);
