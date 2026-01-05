/**
 * Script mã hóa API key bằng AES-256-GCM
 * Chạy: node scripts/encrypt-key.js <api_key>
 *
 * Ví dụ: node scripts/encrypt-key.js sk-or-v1-xxx
 */

import crypto from "crypto";
import { config } from "dotenv";

// Load .env từ thư mục hiện tại (llm-gateway)
config();

// Secret key từ env (bắt buộc, 32 bytes cho AES-256)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length < 32) {
  console.error("❌ ENCRYPTION_KEY not found in .env or invalid length");
  console.error("   Key must be exactly 32 characters for AES-256");
  process.exit(1);
}

function encrypt(text) {
  // Tạo IV ngẫu nhiên (12 bytes cho GCM)
  const iv = crypto.randomBytes(12);

  // Tạo cipher
  const cipher = crypto.createCipheriv(
    "aes-256-gcm",
    Buffer.from(ENCRYPTION_KEY, "utf8"),
    iv
  );

  // Mã hóa
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  // Lấy auth tag
  const authTag = cipher.getAuthTag();

  // Kết hợp: iv:authTag:encrypted (hex format)
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

function decrypt(encryptedText) {
  const parts = encryptedText.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted format");
  }

  const iv = Buffer.from(parts[0], "hex");
  const authTag = Buffer.from(parts[1], "hex");
  const encrypted = parts[2];

  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    Buffer.from(ENCRYPTION_KEY, "utf8"),
    iv
  );

  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

// Main
const apiKey = process.argv[2];

if (!apiKey) {
  console.log("Usage: node scripts/encrypt-key.js <api_key>");
  console.log("Example: node scripts/encrypt-key.js sk-or-v1-xxx");
  process.exit(1);
}

console.log("=".repeat(60));
console.log("API Key Encryption Tool");
console.log("=".repeat(60));
console.log("");
console.log("Original key:", apiKey);
console.log("");

const encrypted = encrypt(apiKey);
console.log("Encrypted:", encrypted);
console.log("");

// Verify
const decrypted = decrypt(encrypted);
console.log("Decrypted (verify):", decrypted);
console.log("");

if (decrypted === apiKey) {
  console.log("✅ Encryption/Decryption OK!");
  console.log("");
  console.log("SQL INSERT:");
  console.log(
    `INSERT INTO provider_keys (provider_id, api_key_encrypted, name, priority) VALUES`
  );
  console.log(`(1, '${encrypted}', 'OpenRouter Key', 100);`);
} else {
  console.log("❌ Encryption/Decryption FAILED!");
}
