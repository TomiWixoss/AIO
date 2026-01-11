import { dbGet } from "../utils/db-client.js";
import { logger } from "../utils/logger.js";
import type { Provider } from "../types/index.js";

export interface AutoModel {
  id: number;
  provider_id: number;
  model_id: string;
  display_name: string;
  context_length: number | null;
  is_active: boolean;
  priority: number;
  provider_name: string;
  provider_priority: number;
  active_keys_count: number;
}

// Cache models để tránh query DB liên tục
let cachedModels: AutoModel[] = [];
let cacheTimestamp = 0;
const CACHE_TTL = 30000; // 30 seconds

// Track failed models/providers trong session
const failedModels = new Set<string>(); // "provider:model"
const exhaustedProviders = new Set<string>(); // providers hết key

// Reset failed tracking sau 5 phút
setInterval(() => {
  failedModels.clear();
  exhaustedProviders.clear();
}, 5 * 60 * 1000);

export async function getAutoModels(): Promise<AutoModel[]> {
  const now = Date.now();

  if (cachedModels.length > 0 && now - cacheTimestamp < CACHE_TTL) {
    return cachedModels;
  }

  try {
    const models = await dbGet<AutoModel[]>("/models/auto-priority");
    cachedModels = models;
    cacheTimestamp = now;
    return models;
  } catch (error) {
    logger.error("Failed to fetch auto models", { error });
    return cachedModels; // Return stale cache if available
  }
}

export function invalidateAutoCache(): void {
  cacheTimestamp = 0;
}

export interface SelectedModel {
  provider: Provider;
  model: string;
  modelId: number;
  providerId: number;
}

/**
 * Chọn model tiếp theo theo priority
 * @param excludeModels - Danh sách models đã thử (format: "provider:model")
 */
export async function selectNextModel(
  excludeModels: Set<string> = new Set()
): Promise<SelectedModel | null> {
  const models = await getAutoModels();

  // Combine với failed models
  const allExcluded = new Set([...excludeModels, ...failedModels]);

  for (const model of models) {
    const key = `${model.provider_name}:${model.model_id}`;

    // Skip nếu đã thử hoặc provider hết key
    if (allExcluded.has(key)) continue;
    if (exhaustedProviders.has(model.provider_name)) continue;

    // Skip nếu provider không có active keys
    if (model.active_keys_count === 0) {
      exhaustedProviders.add(model.provider_name);
      continue;
    }

    return {
      provider: model.provider_name as Provider,
      model: model.model_id,
      modelId: model.id,
      providerId: model.provider_id,
    };
  }

  return null;
}

/**
 * Đánh dấu model đã fail
 */
export function markModelFailed(provider: string, model: string): void {
  const key = `${provider}:${model}`;
  failedModels.add(key);
  logger.warn("Model marked as failed", { provider, model });
}

/**
 * Đánh dấu provider hết key
 */
export function markProviderExhausted(provider: string): void {
  exhaustedProviders.add(provider);
  logger.warn("Provider marked as exhausted", { provider });
}

/**
 * Kiểm tra xem còn model nào available không
 */
export async function hasAvailableModels(): Promise<boolean> {
  const models = await getAutoModels();

  for (const model of models) {
    const key = `${model.provider_name}:${model.model_id}`;
    if (
      !failedModels.has(key) &&
      !exhaustedProviders.has(model.provider_name)
    ) {
      if (model.active_keys_count > 0) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Reset tracking cho một session mới
 */
export function resetFailedTracking(): void {
  failedModels.clear();
  exhaustedProviders.clear();
}

/**
 * Lấy thông tin debug về auto selection
 */
export async function getAutoSelectionInfo(): Promise<{
  totalModels: number;
  availableModels: number;
  failedModels: string[];
  exhaustedProviders: string[];
}> {
  const models = await getAutoModels();
  let availableCount = 0;

  for (const model of models) {
    const key = `${model.provider_name}:${model.model_id}`;
    if (
      !failedModels.has(key) &&
      !exhaustedProviders.has(model.provider_name)
    ) {
      if (model.active_keys_count > 0) {
        availableCount++;
      }
    }
  }

  return {
    totalModels: models.length,
    availableModels: availableCount,
    failedModels: Array.from(failedModels),
    exhaustedProviders: Array.from(exhaustedProviders),
  };
}
