import crypto from "crypto";
import { config } from "../config/index.js";

export function decrypt(encryptedText: string): string {
  const parts = encryptedText.split(":");
  if (parts.length !== 3) {
    // Not encrypted, try to parse as JSON
    try {
      const creds = JSON.parse(encryptedText);
      return creds.api_key || encryptedText;
    } catch {
      return encryptedText;
    }
  }

  const iv = Buffer.from(parts[0], "hex");
  const authTag = Buffer.from(parts[1], "hex");
  const encrypted = parts[2];

  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    Buffer.from(config.encryptionKey, "utf8"),
    iv
  );

  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  // Parse JSON and return api_key
  try {
    const creds = JSON.parse(decrypted);
    return creds.api_key || decrypted;
  } catch {
    return decrypted;
  }
}
