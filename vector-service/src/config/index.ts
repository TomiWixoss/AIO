import dotenv from "dotenv";

dotenv.config();

const requiredEnvVars = ["ENCRYPTION_KEY"];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ Missing required env var: ${envVar}`);
    process.exit(1);
  }
}

if (process.env.ENCRYPTION_KEY!.length < 32) {
  console.error("❌ ENCRYPTION_KEY must be at least 32 characters");
  process.exit(1);
}

export const config = {
  port: parseInt(process.env.PORT || "6000"),
  databaseServiceUrl:
    process.env.DATABASE_SERVICE_URL || "http://localhost:5000",
  encryptionKey: process.env.ENCRYPTION_KEY!,
  embeddingModel: process.env.EMBEDDING_MODEL || "gemini-embedding-001",
  embeddingDimensions: parseInt(process.env.EMBEDDING_DIMENSIONS || "768"),
  dbPath: process.env.DB_PATH || "./data/vectors.db",
};
