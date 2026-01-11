// Drop usage_logs table
// Chạy: node scripts/drop-usage-logs.js

import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

async function dropUsageLogs() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "llm_gateway",
  });

  try {
    console.log("🗑️ Dropping usage_logs table...");
    await connection.execute("DROP TABLE IF EXISTS usage_logs");
    console.log("✅ usage_logs table dropped successfully!");
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await connection.end();
  }
}

dropUsageLogs();
