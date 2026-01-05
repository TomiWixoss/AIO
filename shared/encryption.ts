import crypto from "crypto";

export function createEncryption(encryptionKey: string) {
  if (!encryptionKey || encryptionKey.length < 32) {
    throw new Error("ENCRYPTION_KEY must be at least 32 characters");
  }

  function encrypt(text: string): string {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(
      "aes-256-gcm",
      Buffer.from(encryptionKey, "utf8"),
      iv
    );

    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    const authTag = cipher.getAuthTag();

    // Format: iv:authTag:encrypted (hex)
    return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
  }

  function decrypt(encryptedText: string): string {
    const parts = encryptedText.split(":");
    if (parts.length !== 3) {
      throw new Error("Invalid encrypted format");
    }

    const iv = Buffer.from(parts[0], "hex");
    const authTag = Buffer.from(parts[1], "hex");
    const encrypted = parts[2];

    const decipher = crypto.createDecipheriv(
      "aes-256-gcm",
      Buffer.from(encryptionKey, "utf8"),
      iv
    );

    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  }

  function decryptApiKey(encryptedText: string): string {
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

    const decrypted = decrypt(encryptedText);

    // Parse JSON and return api_key
    try {
      const creds = JSON.parse(decrypted);
      return creds.api_key || decrypted;
    } catch {
      return decrypted;
    }
  }

  return { encrypt, decrypt, decryptApiKey };
}

export type Encryption = ReturnType<typeof createEncryption>;
