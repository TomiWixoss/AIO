import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { config } from "../config/index.js";
import { dbGet, dbPost } from "../utils/db-client.js";
import { authMiddleware, AuthRequest } from "../middleware/auth.js";

export const authRoutes = Router();

interface Admin {
  id: number;
  email: string;
  password_hash: string;
  name: string;
}

// POST /auth/login
authRoutes.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    const admin = await dbGet<Admin>(
      `/admins/email/${encodeURIComponent(email)}`
    ).catch(() => null);

    if (!admin) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const validPassword = await bcrypt.compare(password, admin.password_hash);

    if (!validPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: admin.id, email: admin.email },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn as jwt.SignOptions["expiresIn"] }
    );

    res.json({
      token,
      admin: { id: admin.id, email: admin.email, name: admin.name },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /auth/register (first admin only)
authRoutes.post("/register", async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res
        .status(400)
        .json({ error: "Email, password and name required" });
    }

    // Check if any admin exists
    const admins = await dbGet<Admin[]>("/admins");
    if (admins.length > 0) {
      return res
        .status(403)
        .json({ error: "Admin already exists. Use login." });
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

    res.status(201).json({
      token,
      admin: { id: result.id, email, name },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /auth/me
authRoutes.get("/me", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const admin = await dbGet<Admin>(`/admins/${req.admin!.id}`);
    res.json(admin);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
