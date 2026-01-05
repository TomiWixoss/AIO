import { dbGet } from "../utils/db-client.js";
import { decrypt } from "../utils/encryption.js";

interface ProviderKey {
  id: number;
  credentials_encrypted: string;
}

interface Provider {
  id: number;
  provider_id: string;
}

// Cache
let cachedApiKey: string | null = null;
let cacheExpiry = 0;
const CACHE_TTL = 60000; // 1 minute

export async function getGeminiApiKey(): Promise<string> {
  const now = Date.now();
  if (cachedApiKey && now < cacheExpiry) {
    return cachedApiKey;
  }

  // Get google-ai provider
  const provider = await dbGet<Provider>("/providers/name/google-ai");

  // Get active keys
  const keys = await dbGet<ProviderKey[]>(
    `/api-keys/provider/${provider.id}/active`
  );

  if (keys.length === 0) {
    throw new Error("No active API keys for Google AI");
  }

  // Decrypt and cache
  cachedApiKey = decrypt(keys[0].credentials_encrypted);
  cacheExpiry = now + CACHE_TTL;

  return cachedApiKey;
}

// Reset cache (khi cần refresh key)
export function resetKeyCache() {
  cachedApiKey = null;
  cacheExpiry = 0;
}
