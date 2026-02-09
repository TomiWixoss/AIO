/**
 * API Key Management
 * Track usage, errors, and auto-disable problematic keys
 */

import type { ApiKey } from "../types.js";
import { logger } from "./logger.js";

export class KeyManager {
  /**
   * Get active key with lowest usage
   */
  static getActiveKey(keys: ApiKey[]): ApiKey | null {
    const activeKeys = keys
      .filter((k) => k.isActive !== false)
      .filter((k) => !k.dailyLimit || (k.requestsToday || 0) < k.dailyLimit)
      .sort((a, b) => {
        // Sort by priority first
        const priorityDiff = (b.priority || 0) - (a.priority || 0);
        if (priorityDiff !== 0) return priorityDiff;

        // Then by usage (prefer less used keys)
        return (a.requestsToday || 0) - (b.requestsToday || 0);
      });

    return activeKeys[0] || null;
  }

  /**
   * Increment key usage counter
   */
  static incrementUsage(key: ApiKey): void {
    key.requestsToday = (key.requestsToday || 0) + 1;
    key.lastUsed = new Date();

    logger.debug("Key usage incremented", {
      priority: key.priority,
      usage: key.requestsToday,
      limit: key.dailyLimit,
    });
  }

  /**
   * Mark key error and optionally disable
   */
  static markError(
    key: ApiKey,
    error: string,
    autoDisable: boolean = false
  ): void {
    key.errorCount = (key.errorCount || 0) + 1;
    key.lastError = error.substring(0, 200);

    logger.warn("Key error recorded", {
      priority: key.priority,
      errorCount: key.errorCount,
      error: error.substring(0, 100),
    });

    // Auto-disable after 3 consecutive errors
    if (autoDisable && key.errorCount >= 3) {
      key.isActive = false;
      logger.error("Key auto-disabled due to repeated errors", {
        priority: key.priority,
        errorCount: key.errorCount,
      });
    }
  }

  /**
   * Reset daily counters (call this daily)
   */
  static resetDailyCounters(keys: ApiKey[]): void {
    keys.forEach((key) => {
      key.requestsToday = 0;
    });
    logger.info("Daily counters reset", { keyCount: keys.length });
  }

  /**
   * Get key statistics
   */
  static getStats(keys: ApiKey[]): {
    total: number;
    active: number;
    disabled: number;
    totalUsage: number;
    totalErrors: number;
  } {
    return {
      total: keys.length,
      active: keys.filter((k) => k.isActive !== false).length,
      disabled: keys.filter((k) => k.isActive === false).length,
      totalUsage: keys.reduce((sum, k) => sum + (k.requestsToday || 0), 0),
      totalErrors: keys.reduce((sum, k) => sum + (k.errorCount || 0), 0),
    };
  }

  /**
   * Check if error should trigger key rotation
   */
  static shouldRotateKey(error: string): boolean {
    const rotationPatterns = [
      "rate",
      "limit",
      "429",
      "403",
      "quota",
      "exceeded",
      "leaked",
      "PERMISSION_DENIED",
      "invalid_api_key",
      "unauthorized",
    ];

    return rotationPatterns.some((pattern) =>
      error.toLowerCase().includes(pattern.toLowerCase())
    );
  }
}
