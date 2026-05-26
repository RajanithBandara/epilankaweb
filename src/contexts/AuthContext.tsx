'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { Models } from 'appwrite';
import { account } from '@/lib/appwrite';
import { useRouter } from 'next/navigation';

interface AuthContextValue {
  user: Models.User<Models.Preferences> | null;
  loading: boolean;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

/**
 * Wipe browser-side data for this origin: localStorage, sessionStorage,
 * non-HttpOnly cookies, Cache Storage, and IndexedDB. HttpOnly cookies
 * are cleared server-side (see /api/auth/logout).
 */
async function clearBrowserData(): Promise<void> {
  if (typeof window === 'undefined') return;

  try { window.localStorage.clear(); } catch { /* private mode / disabled */ }
  try { window.sessionStorage.clear(); } catch { /* private mode / disabled */ }

  // Expire every cookie visible to JS on this origin
  try {
    const { hostname } = window.location;
    document.cookie.split(';').forEach((c) => {
      const name = c.split('=')[0].trim();
      if (!name) return;
      const expire = 'expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = `${name}=; ${expire}; path=/`;
      document.cookie = `${name}=; ${expire}; path=/; domain=${hostname}`;
      document.cookie = `${name}=; ${expire}; path=/; domain=.${hostname}`;
    });
  } catch { /* */ }

  // Cache Storage (PWA / service-worker caches)
  try {
    if (typeof caches !== 'undefined') {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } catch { /* */ }

  // IndexedDB — `databases()` isn't in Firefox; the catch handles that.
  try {
    const idb = window.indexedDB as IDBFactory & {
      databases?: () => Promise<{ name?: string }[]>;
    };
    if (idb && typeof idb.databases === 'function') {
      const dbs = await idb.databases();
      await Promise.all(
        dbs.map((db) =>
          db.name
            ? new Promise<void>((resolve) => {
                const req = idb.deleteDatabase(db.name!);
                req.onsuccess = () => resolve();
                req.onerror = () => resolve();
                req.onblocked = () => resolve();
              })
            : Promise.resolve(),
        ),
      );
    }
  } catch { /* */ }
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  logout: async () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const current = await account.get();
      setUser(current);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const logout = useCallback(async () => {
    try {
      await account.deleteSession('current');
    } catch {
      // session may already be gone
    }
    // Clear the HttpOnly JWT cookie via API route
    await fetch('/api/auth/logout', { method: 'POST' });

    // Wipe all browser-side data for this origin
    await clearBrowserData();

    setUser(null);
    router.push('/login');
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, loading, logout, refreshUser: fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
