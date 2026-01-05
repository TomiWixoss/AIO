import { dbGet, dbPut } from "../utils/db-client.js";
import { decryptApiKey as decryptKey } from "../utils/encryption.js";
import { logger } from "../utils/logger.js";

interface ProviderKey {
  id: number;
  provider_id: number;
  credentials_encrypted: string;
  name: string;
  is_active: boolean;
  priority: number;
  requests_today: number;
  daily_limit: number | null;
}

interface Provider {
  id: number;
  provider_id: string;
  is_active: boolean;
}

// Cache để giảm số lần gọi DB
const providerCache = new Map<string, Provider>();
const CACHE_TTL = 60000; // 1 minute
let lastCacheUpdate = 0;

async function refreshCache() {
  const now = Date.now();
  if (now - lastCacheUpdate < CACHE_TTL) return;

  try {
    const providers = await dbGet<Provider[]>("/providers/active");
    providerCache.clear();
    for (const p of providers) {
      providerCache.set(p.provider_id, p);
    }
    lastCacheUpdate = now;
  } catch (error) {
    logger.error("Failed to refresh provider cache", { error });
  }
}

export async function getProviderByName(
  name: string
): Promise<Provider | null> {
  await refreshCache();
  return providerCache.get(name) || null;
}

export async function getActiveKey(
  providerId: number
): Promise<ProviderKey | null> {
  try {
    const keys = await dbGet<ProviderKey[]>(
      `/api-keys/provider/${providerId}/active`
    );
    if (keys.length === 0) return null;

    // Return highest priority key that hasn't hit limit
    return keys[0];
  } catch (error) {
    logger.error("Failed to get active key", { providerId, error });
    return null;
  }
}

export async function incrementKeyUsage(keyId: number): Promise<void> {
  try {
    await dbPut(`/api-keys/${keyId}/increment`, {});
  } catch (error) {
    logger.error("Failed to increment key usage", { keyId, error });
  }
}

export async function markKeyError(
  keyId: number,
  errorMessage: string,
  deactivate = false
): Promise<void> {
  try {
    await dbPut(`/api-keys/${keyId}/error`, {
      error_message: errorMessage,
      deactivate,
    });
  } catch (error) {
    logger.error("Failed to mark key error", { keyId, error });
  }
}

export async function decryptApiKey(
  encryptedCredentials: string
): Promise<string> {
  try {
    return decryptKey(encryptedCredentials);
  } catch (error) {
    logger.error("Failed to decrypt API key", { error });
    throw new Error("Failed to decrypt API key");
  }
}
