import { LRUCache } from "lru-cache";

const cache = new LRUCache<string, any>({ max: 200, ttl: 5 * 60 * 1000 });

export const getCache = <T>(key: string): T | undefined => cache.get(key) as T | undefined;

export const setCache = (key: string, value: unknown, ttlMs?: number) => {
  cache.set(key, value, ttlMs ? { ttl: ttlMs } : undefined);
};

export const invalidateCache = (prefix?: string) => {
  if (!prefix) {
    cache.clear();
    return;
  }
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) cache.delete(key);
  }
};