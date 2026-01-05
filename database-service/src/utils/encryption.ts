import { createEncryption } from "shared/encryption";

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length < 32) {
  console.error("❌ ENCRYPTION_KEY not found or invalid (need 32 chars)");
  process.exit(1);
}

const { encrypt, decrypt, decryptApiKey } = createEncryption(ENCRYPTION_KEY);

export { encrypt, decrypt, decryptApiKey };
