import { Router } from "express";
import { pool } from "../config/database.js";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

export const adminRoutes = Router();

// GET all admins
adminRoutes.get("/", async (_req, res) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT id, email, name, created_at FROM admins"
    );
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET admin by id
adminRoutes.get("/:id", async (req, res) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT id, email, name, created_at FROM admins WHERE id = ?",
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "Admin not found" });
    }
    res.json(rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET admin by email (for login)
adminRoutes.get("/email/:email", async (req, res) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM admins WHERE email = ?",
      [req.params.email]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "Admin not found" });
    }
    res.json(rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST create admin
adminRoutes.post("/", async (req, res) => {
  try {
    const { email, password_hash, name } = req.body;
    const [result] = await pool.query<ResultSetHeader>(
      "INSERT INTO admins (email, password_hash, name) VALUES (?, ?, ?)",
      [email, password_hash, name]
    );
    res.status(201).json({ id: result.insertId, email, name });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update admin
adminRoutes.put("/:id", async (req, res) => {
  try {
    const { email, name } = req.body;
    await pool.query("UPDATE admins SET email = ?, name = ? WHERE id = ?", [
      email,
      name,
      req.params.id,
    ]);
    res.json({ message: "Updated" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE admin
adminRoutes.delete("/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM admins WHERE id = ?", [req.params.id]);
    res.json({ message: "Deleted" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
