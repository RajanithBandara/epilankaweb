// Cache management for analytics data
const CACHE_KEY_PREFIX = "analytics_cache_";
const DEFAULT_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

export interface CachedData {
  data: unknown;
  timestamp: number;
}

export function getCachedData(key: string): unknown | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY_PREFIX + key);
    if (!cached) return null;

    const parsed: CachedData = JSON.parse(cached);
    const age = Date.now() - parsed.timestamp;

    if (age > DEFAULT_CACHE_DURATION) {
      localStorage.removeItem(CACHE_KEY_PREFIX + key);
      return null;
    }

    return parsed.data;
  } catch {
    return null;
  }
}

export function setCachedData(key: string, data: unknown): void {
  try {
    const cacheData: CachedData = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(CACHE_KEY_PREFIX + key, JSON.stringify(cacheData));
  } catch {
    // Silently fail if storage quota exceeded
  }
}

export function clearAnalyticsCache(): void {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith(CACHE_KEY_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  } catch {
    // Silently fail
  }
}

export function getCacheAge(key: string): number {
  try {
    const cached = localStorage.getItem(CACHE_KEY_PREFIX + key);
    if (!cached) return Infinity;

    const parsed: CachedData = JSON.parse(cached);
    return Date.now() - parsed.timestamp;
  } catch {
    return Infinity;
  }
}
