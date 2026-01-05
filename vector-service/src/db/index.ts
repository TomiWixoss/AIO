import Database from "better-sqlite3";
import type { Database as DatabaseType } from "better-sqlite3";
import * as sqliteVec from "sqlite-vec";
import { config } from "../config/index.js";
import fs from "fs";
import path from "path";

// Ensure data directory exists
const dataDir = path.dirname(config.dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize SQLite with sqlite-vec extension
const db: DatabaseType = new Database(config.dbPath);
sqliteVec.load(db);

// Initialize schema
db.exec(`
  -- Collections table (mỗi chatbot/tenant có thể có nhiều collections)
  CREATE TABLE IF NOT EXISTS collections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    dimensions INTEGER NOT NULL DEFAULT ${config.embeddingDimensions},
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Documents table (lưu nội dung gốc)
  CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    collection_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    metadata TEXT, -- JSON metadata
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE
  );

  -- Create index for faster lookups
  CREATE INDEX IF NOT EXISTS idx_documents_collection ON documents(collection_id);
`);

// Create virtual table for vector search (per collection)
export function createVectorTable(collectionId: number, dimensions: number) {
  const tableName = `vec_collection_${collectionId}`;
  db.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS ${tableName} USING vec0(
      embedding FLOAT[${dimensions}]
    );
  `);
  return tableName;
}

export { db };
