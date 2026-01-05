#!/usr/bin/env node

/**
 * Script xóa toàn bộ dữ liệu trong database
 * Giữ lại cấu trúc bảng
 */

import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(dirname(__dirname), ".env") });

const config = {
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "3306"),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "llm_gateway",
};

const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function resetDatabase() {
  let connection;

  try {
    log("\n🔌 Connecting to database...", "cyan");
    connection = await mysql.createConnection(config);
    log("✓ Connected successfully", "green");

    // Disable foreign key checks
    log("\n⚙️  Disabling foreign key checks...", "yellow");
    await connection.query("SET FOREIGN_KEY_CHECKS = 0");

    // Get all tables
    const [tables] = await connection.query(
      `SELECT table_name FROM information_schema.tables 
       WHERE table_schema = ?`,
      [config.database]
    );

    if (tables.length === 0) {
      log("\n⚠️  No tables found in database", "yellow");
      return;
    }

    log(`\n🗑️  Deleting data from ${tables.length} tables...`, "cyan");

    // Delete data from each table
    for (const table of tables) {
      const tableName = table.table_name || table.TABLE_NAME;
      try {
        const [result] = await connection.query(`DELETE FROM ${tableName}`);
        const affected = result.affectedRows || 0;
        log(`  ✓ ${tableName}: ${affected} rows deleted`, "green");
      } catch (error) {
        log(`  ✗ ${tableName}: ${error.message}`, "red");
      }
    }

    // Reset auto increment
    log("\n🔄 Resetting auto increment...", "yellow");
    for (const table of tables) {
      const tableName = table.table_name || table.TABLE_NAME;
      try {
        await connection.query(`ALTER TABLE ${tableName} AUTO_INCREMENT = 1`);
        log(`  ✓ ${tableName}`, "green");
      } catch (error) {
        // Some tables might not have auto increment
      }
    }

    // Re-enable foreign key checks
    log("\n⚙️  Re-enabling foreign key checks...", "yellow");
    await connection.query("SET FOREIGN_KEY_CHECKS = 1");

    log("\n✅ Database reset completed!", "green");
    log("All data has been deleted, table structure preserved.\n", "cyan");
  } catch (error) {
    log(`\n❌ Error: ${error.message}`, "red");
    console.error(error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      log("🔌 Connection closed", "cyan");
    }
  }
}

// Confirmation prompt
const args = process.argv.slice(2);
if (!args.includes("--confirm")) {
  log("\n⚠️  WARNING: This will DELETE ALL DATA in the database!", "red");
  log(
    "Table structure will be preserved, but all records will be removed.\n",
    "yellow"
  );
  log("To proceed, run:", "cyan");
  log("  npm run reset-db\n", "green");
  log("Or directly:", "cyan");
  log("  node scripts/reset-database.js --confirm\n", "green");
  process.exit(0);
}

resetDatabase();
