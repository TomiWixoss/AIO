/**
 * Script tạo bảng knowledge_bases và knowledge_items
 */

import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "3306"),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "llm_gateway",
  });

  console.log("📦 Creating knowledge tables...\n");

  // Drop existing tables (for reset)
  await connection.execute("DROP TABLE IF EXISTS knowledge_items");
  await connection.execute("DROP TABLE IF EXISTS knowledge_bases");
  console.log("🗑️  Dropped old tables (if existed)");

  // Create knowledge_bases table
  await connection.execute(`
    CREATE TABLE knowledge_bases (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE,
      description TEXT,
      collection_id INT,
      is_active BOOLEAN DEFAULT TRUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  console.log("✅ Created knowledge_bases table");

  // Create knowledge_items table
  await connection.execute(`
    CREATE TABLE knowledge_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      knowledge_base_id INT NOT NULL,
      content TEXT NOT NULL,
      metadata JSON,
      vector_doc_id INT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (knowledge_base_id) REFERENCES knowledge_bases(id) ON DELETE CASCADE,
      INDEX idx_knowledge_items_kb (knowledge_base_id)
    )
  `);
  console.log("✅ Created knowledge_items table");

  await connection.end();
  console.log("\n🎉 Done!");
}

main().catch(console.error);
