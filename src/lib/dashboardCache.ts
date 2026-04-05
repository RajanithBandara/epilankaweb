const DASHBOARD_CACHE_PREFIX = "dashboard_cache_";
const DEFAULT_CACHE_TTL_MS = 5 * 60 * 1000;

interface CacheRecord<T> {
  data: T;
  timestamp: number;
}

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function namespacedKey(key: string): string {
  return `${DASHBOARD_CACHE_PREFIX}${key}`;
}

export function getDashboardCache<T>(key: string, ttlMs = DEFAULT_CACHE_TTL_MS): T | null {
  if (!isBrowser()) return null;

  try {
    const raw = localStorage.getItem(namespacedKey(key));
    if (!raw) return null;

    const parsed = JSON.parse(raw) as CacheRecord<T>;
    const isExpired = Date.now() - parsed.timestamp > ttlMs;
    if (isExpired) {
      localStorage.removeItem(namespacedKey(key));
      return null;
    }

    return parsed.data;
  } catch {
    return null;
  }
}

export function setDashboardCache<T>(key: string, data: T): void {
  if (!isBrowser()) return;

  try {
    const payload: CacheRecord<T> = { data, timestamp: Date.now() };
    localStorage.setItem(namespacedKey(key), JSON.stringify(payload));
  } catch {
    // Ignore quota/storage errors to avoid breaking UI flows.
  }
}


