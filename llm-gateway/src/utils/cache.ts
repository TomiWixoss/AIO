import { config } from "../config/index.js";
import {
  ChatCompletionRequest,
  ChatCompletionResponse,
} from "../types/index.js";
import crypto from "crypto";

interface CacheEntry {
  response: ChatCompletionResponse;
  expiresAt: number;
}

class LRUCache {
  private cache = new Map<string, CacheEntry>();
  private maxSize: number;
  private ttlMs: number;

  constructor(maxSize: number, ttlSeconds: number) {
    this.maxSize = maxSize;
    this.ttlMs = ttlSeconds * 1000;
  }

  private generateKey(request: ChatCompletionRequest): string {
    const keyData = {
      provider: request.provider,
      model: request.model,
      messages: request.messages,
      temperature: request.temperature,
      max_tokens: request.max_tokens,
      top_p: request.top_p,
    };
    return crypto
      .createHash("sha256")
      .update(JSON.stringify(keyData))
      .digest("hex");
  }

  get(request: ChatCompletionRequest): ChatCompletionResponse | null {
    // Don't cache streaming requests
    if (request.stream) return null;

    const key = this.generateKey(request);
    const entry = this.cache.get(key);

    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.response;
  }

  set(request: ChatCompletionRequest, response: ChatCompletionResponse): void {
    // Don't cache streaming requests
    if (request.stream) return;

    const key = this.generateKey(request);

    // Evict oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      response,
      expiresAt: Date.now() + this.ttlMs,
    });
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }
}

export const responseCache = new LRUCache(
  config.cache.maxSize,
  config.cache.ttlSeconds
);
