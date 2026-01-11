// Script để xóa cột context_length khỏi bảng models
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

async function removeContextLength() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "3306"),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "llm_gateway",
  });

  try {
    console.log("Checking if context_length column exists...");

    const [columns] = await connection.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'models' AND COLUMN_NAME = 'context_length'`,
      [process.env.DB_NAME || "llm_gateway"]
    );

    if (columns.length > 0) {
      console.log("Removing context_length column from models table...");
      await connection.query("ALTER TABLE models DROP COLUMN context_length");
      console.log("Done! context_length column removed.");
    } else {
      console.log("context_length column does not exist. Nothing to do.");
    }
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await connection.end();
  }
}

removeContextLength();
