// Script thêm cột priority vào bảng models
// Chạy: node scripts/add-model-priority.js

import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "3306"),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "llm_gateway",
});

async function migrate() {
  const conn = await pool.getConnection();

  try {
    console.log("🔄 Checking if priority column exists...");

    // Check if column exists
    const [columns] = await conn.query(
      `
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'models' AND COLUMN_NAME = 'priority'
    `,
      [process.env.DB_NAME || "llm_gateway"]
    );

    if (columns.length > 0) {
      console.log("✅ Column 'priority' already exists in models table");
    } else {
      console.log("📝 Adding 'priority' column to models table...");

      await conn.query(`
        ALTER TABLE models 
        ADD COLUMN priority INT DEFAULT 0 AFTER is_fallback
      `);

      console.log("✅ Column 'priority' added successfully");

      // Add index for better performance
      console.log("📝 Adding index for priority...");
      await conn
        .query(
          `
        CREATE INDEX idx_models_priority ON models (is_active, priority DESC)
      `
        )
        .catch(() => {
          console.log("⚠️ Index might already exist, skipping...");
        });
    }

    // Set default priorities based on existing models
    console.log("\n📊 Setting default priorities for existing models...");

    // Get all providers
    const [providers] = await conn.query(
      `SELECT id, provider_id FROM providers ORDER BY priority DESC`
    );

    for (const provider of providers) {
      // Get models for this provider
      const [models] = await conn.query(
        `SELECT id, model_id FROM models WHERE provider_id = ? ORDER BY id`,
        [provider.id]
      );

      // Set priority based on order (first model = highest priority)
      let priority = models.length * 10;
      for (const model of models) {
        await conn.query(`UPDATE models SET priority = ? WHERE id = ?`, [
          priority,
          model.id,
        ]);
        priority -= 10;
      }

      console.log(
        `  ✅ ${provider.provider_id}: ${models.length} models updated`
      );
    }

    console.log("\n✅ Migration completed successfully!");

    // Show current state
    console.log("\n📋 Current models with priorities:");
    const [result] = await conn.query(`
      SELECT m.model_id, m.display_name, m.priority, p.provider_id, p.priority as provider_priority
      FROM models m
      JOIN providers p ON m.provider_id = p.id
      WHERE m.is_active = TRUE
      ORDER BY p.priority DESC, m.priority DESC
      LIMIT 20
    `);

    console.table(result);
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    throw error;
  } finally {
    conn.release();
    await pool.end();
  }
}

migrate().catch(console.error);
