// Script tạo bảng chatbots
// Chạy: node scripts/add-chatbots-table.js

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
    console.log("🔄 Checking if chatbots table exists...");

    const [tables] = await conn.query(
      `
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'chatbots'
    `,
      [process.env.DB_NAME || "llm_gateway"]
    );

    if (tables.length > 0) {
      console.log("✅ Table 'chatbots' already exists");
    } else {
      console.log("📝 Creating 'chatbots' table...");

      await conn.query(`
        CREATE TABLE chatbots (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          slug VARCHAR(100) NOT NULL UNIQUE,
          description TEXT,
          
          provider_id INT,
          model_id INT,
          auto_mode BOOLEAN DEFAULT FALSE,
          
          system_prompt TEXT,
          temperature DECIMAL(3,2) DEFAULT 0.7,
          max_tokens INT DEFAULT 2048,
          
          tool_ids JSON,
          knowledge_base_ids JSON,
          
          welcome_message TEXT,
          placeholder_text VARCHAR(255) DEFAULT 'Nhập tin nhắn...',
          
          is_public BOOLEAN DEFAULT FALSE,
          api_key VARCHAR(64),
          allowed_origins JSON,
          
          is_active BOOLEAN DEFAULT TRUE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          
          FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE SET NULL,
          FOREIGN KEY (model_id) REFERENCES models(id) ON DELETE SET NULL,
          INDEX idx_chatbots_slug (slug),
          INDEX idx_chatbots_api_key (api_key)
        )
      `);

      console.log("✅ Table 'chatbots' created successfully");
    }

    console.log("\n✅ Migration completed!");
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    throw error;
  } finally {
    conn.release();
    await pool.end();
  }
}

migrate().catch(console.error);
