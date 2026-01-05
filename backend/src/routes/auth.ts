import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { config } from "../config/index.js";
import { dbGet, dbPost } from "../utils/db-client.js";
import { authMiddleware, AuthRequest } from "../middleware/auth.js";
import { ok, created } from "shared/response";
import { BadRequest, Unauthorized, Forbidden } from "shared/errors";
import { asyncHandler } from "shared/error-handler";

export const authRoutes = Router();

interface Admin {
  id: number;
  email: string;
  password_hash: string;
  name: string;
}

// POST /auth/login
authRoutes.post(
  "/login",
  asyncHandler(async (req: any, res: any) => {
    const { email, password } = req.body;

    if (!email || !password) {
      throw BadRequest("Email and password are required");
    }

    const admin = await dbGet<Admin>(
      `/admins/email/${encodeURIComponent(email)}`
    ).catch(() => null);

    if (!admin) {
      throw Unauthorized("Invalid credentials");
    }

    const validPassword = await bcrypt.compare(password, admin.password_hash);

    if (!validPassword) {
      throw Unauthorized("Invalid credentials");
    }

    const token = jwt.sign(
      { id: admin.id, email: admin.email },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn as jwt.SignOptions["expiresIn"] }
    );

    return ok(res, {
      token,
      admin: { id: admin.id, email: admin.email, name: admin.name },
    });
  })
);

// POST /auth/register (first admin only)
authRoutes.post(
  "/register",
  asyncHandler(async (req: any, res: any) => {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      throw BadRequest("Email, password and name are required");
    }

    // Check if any admin exists
    const admins = await dbGet<Admin[]>("/admins");
    if (admins.length > 0) {
      throw Forbidden("Admin already exists. Use login.");
    }

    const password_hash = await bcrypt.hash(password, 10);
    const result = await dbPost<{ id: number }>("/admins", {
      email,
      password_hash,
      name,
    });

    const token = jwt.sign({ id: result.id, email }, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn as jwt.SignOptions["expiresIn"],
    });

    return created(res, {
      token,
      admin: { id: result.id, email, name },
    });
  })
);

// GET /auth/me
authRoutes.get(
  "/me",
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: any) => {
    const admin = await dbGet<Admin>(`/admins/${req.admin!.id}`);
    return ok(res, admin);
  })
);
