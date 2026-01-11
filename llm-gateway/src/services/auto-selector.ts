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

/**
 * Lấy danh sách models đã sắp xếp theo priority
 * Sắp xếp: provider_priority DESC → model_priority DESC
 */
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
 * Lấy model đầu tiên theo priority (cho auto mode khi bắt đầu)
 */
export async function getFirstPriorityModel(): Promise<SelectedModel | null> {
  const models = await getAutoModels();

  // Tìm model đầu tiên có active keys
  for (const model of models) {
    if (model.active_keys_count > 0) {
      return {
        provider: model.provider_name as Provider,
        model: model.model_id,
        modelId: model.id,
        providerId: model.provider_id,
      };
    }
  }

  return null;
}

/**
 * Lấy model tiếp theo để fallback
 * @param currentProvider - Provider hiện tại
 * @param currentModel - Model hiện tại
 * @param failedModels - Set các model đã thử và fail (format: "provider:model")
 * @param exhaustedProviders - Set các provider đã hết key
 */
export async function getNextFallbackModel(
  currentProvider: string,
  currentModel: string,
  failedModels: Set<string>,
  exhaustedProviders: Set<string>
): Promise<SelectedModel | null> {
  const models = await getAutoModels();

  // Đánh dấu model hiện tại là đã fail
  const currentKey = `${currentProvider}:${currentModel}`;
  failedModels.add(currentKey);

  // Tìm model tiếp theo
  for (const model of models) {
    const modelKey = `${model.provider_name}:${model.model_id}`;

    // Skip nếu đã thử
    if (failedModels.has(modelKey)) continue;

    // Skip nếu provider đã hết key
    if (exhaustedProviders.has(model.provider_name)) continue;

    // Skip nếu provider không có active keys
    if (model.active_keys_count === 0) {
      exhaustedProviders.add(model.provider_name);
      continue;
    }

    logger.info("Auto fallback: selected next model", {
      from: { provider: currentProvider, model: currentModel },
      to: { provider: model.provider_name, model: model.model_id },
    });

    return {
      provider: model.provider_name as Provider,
      model: model.model_id,
      modelId: model.id,
      providerId: model.provider_id,
    };
  }

  // Không còn model nào
  logger.error("Auto fallback: no more models available", {
    failedModels: Array.from(failedModels),
    exhaustedProviders: Array.from(exhaustedProviders),
  });

  return null;
}

/**
 * Kiểm tra xem còn model nào available không
 */
export async function hasAvailableModels(
  failedModels: Set<string>,
  exhaustedProviders: Set<string>
): Promise<boolean> {
  const models = await getAutoModels();

  for (const model of models) {
    const modelKey = `${model.provider_name}:${model.model_id}`;
    if (
      !failedModels.has(modelKey) &&
      !exhaustedProviders.has(model.provider_name) &&
      model.active_keys_count > 0
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Kiểm tra lỗi có phải do provider hết key không
 */
export function isProviderExhaustedError(errorMsg: string): boolean {
  return (
    errorMsg.includes("No active API key") ||
    errorMsg.includes("All API keys exhausted")
  );
}

/**
 * Kiểm tra lỗi có nên fallback không (rate limit, model error, etc.)
 */
export function shouldFallback(errorMsg: string): boolean {
  return (
    errorMsg.includes("rate") ||
    errorMsg.includes("limit") ||
    errorMsg.includes("429") ||
    errorMsg.includes("403") ||
    errorMsg.includes("404") ||
    errorMsg.includes("model") ||
    errorMsg.includes("not found") ||
    errorMsg.includes("PERMISSION_DENIED") ||
    errorMsg.includes("No active API key") ||
    errorMsg.includes("All API keys exhausted")
  );
}
