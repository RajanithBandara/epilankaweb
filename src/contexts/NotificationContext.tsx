'use client';

import React, {
    createContext,
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/contexts/AuthContext';
import { account } from '@/lib/appwrite';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface Notification {
    _id: string;
    notification_id: string;
    title?: string | null;
    text: string;
    severity: 'info' | 'warning' | 'critical' | 'success';
    category: 'disease' | 'report' | 'system' | 'alert' | 'announcement';
    created_at: string;
    read: boolean;
    read_at?: string | null;
    metadata?: Record<string, unknown>;
    user_id?: string | null;  // kept for backwards-compat with old docs in DB
}

export interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    isConnected: boolean;
    isLoading: boolean;
    error: string | null;
    /** The most-recent notification that arrived since the page loaded (for toasts). */
    latestNew: Notification | null;
    /** Call after displaying the toast so it doesn't re-fire. */
    clearLatestNew: () => void;
    fetchNotifications: (skip?: number, limit?: number) => Promise<void>;
    reconnect: () => void;
}

export const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const RECONNECT_DELAY = 3_000;
const MAX_RECONNECT_ATTEMPTS = 5;

/** Fallback poll interval when socket is disconnected (ms). */
const OFFLINE_POLL_MS = 10_000;

/** Heartbeat poll interval even when socket IS connected (ms).
 *  Acts as a safety net if a socket event is missed. */
const HEARTBEAT_POLL_MS = 30_000;

/**
 * Appwrite JWTs expire after 15 minutes.
 * We refresh the JWT at this interval (ms) so the socket stays authenticated.
 * 13 minutes gives a 2-minute safety margin.
 */
const JWT_REFRESH_INTERVAL_MS = 13 * 60 * 1_000;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function getSocketBaseUrl(): string {
    const apiBase = process.env.NEXT_PUBLIC_API_URL;
    if (apiBase) {
        try {
            const parsed = new URL(apiBase);
            return parsed.origin;
        } catch {
            // fall through
        }
    }
    const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
    return `${protocol}//${window.location.hostname}:8000`;
}

/** Merge a single incoming notification into the list (prepend or update in-place). */
function mergeNotification(current: Notification[], incoming: Notification): Notification[] {
    const idx = current.findIndex(
        (item) => item.notification_id === incoming.notification_id,
    );

    if (idx === -1) {
        return [incoming, ...current];
    }

    const next = [...current];
    next[idx] = { ...next[idx], ...incoming };

    if (idx === 0) return next;
    const [updated] = next.splice(idx, 1);
    return [updated, ...next];
}

/** Merge a full fetched list (replace matching items, prepend new ones). */
function reconcileList(current: Notification[], fetched: Notification[]): Notification[] {
    if (current.length === 0) return fetched;

    const map = new Map(current.map((n) => [n.notification_id, n]));
    const merged: Notification[] = [];

    for (const item of fetched) {
        const existing = map.get(item.notification_id);
        merged.push(existing ? { ...existing, ...item } : item);
        map.delete(item.notification_id);
    }

    // Items no longer in the fetched list are removed (e.g. deleted by officer).
    return merged;
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const { user, loading: authLoading } = useAuth();

    const socketRef = useRef<Socket | null>(null);
    const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const offlinePollRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
    /** Timer that refreshes the JWT before it expires. */
    const jwtRefreshRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isConnected, setIsConnected] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    // Latest notification that arrived AFTER the initial page load (for toast display)
    const [latestNew, setLatestNew] = useState<Notification | null>(null);
    const initialLoadDoneRef = useRef(false);

    // -----------------------------------------------------------------------
    // Sync unread count from server
    // -----------------------------------------------------------------------
    const syncUnreadCount = useCallback(async () => {
        if (!user) return;
        try {
            const res = await fetch('/api/notifications/unread-count', { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                setUnreadCount(data.unread_count ?? 0);
            }
        } catch {
            // non-fatal
        }
    }, [user]);

    // -----------------------------------------------------------------------
    // Fetch / reconcile notification list
    // -----------------------------------------------------------------------
    const fetchNotifications = useCallback(
        async (skip = 0, limit = 30) => {
            if (!user) return;

            // Only show the loading spinner on the very first ever fetch (initial mount).
            // All subsequent background heartbeat / offline-poll fetches are silent.
            const isInitialLoad = skip === 0 && !initialLoadDoneRef.current;
            if (isInitialLoad) setIsLoading(true);

            try {
                const params = new URLSearchParams({
                    skip: String(skip),
                    limit: String(limit),
                    unread_only: 'false',
                });
                const res = await fetch(`/api/notifications?${params}`, { credentials: 'include' });

                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data = await res.json();
                const fetched: Notification[] = data.items ?? [];

                setNotifications((prev) => {
                    const next = reconcileList(prev, fetched);

                    // Detect genuinely new items (not in the previous list).
                    // Only fire after initial load so we don't toast on mount.
                    if (initialLoadDoneRef.current) {
                        const prevIds = new Set(prev.map((n) => n.notification_id));
                        const newItems = fetched.filter((n) => !prevIds.has(n.notification_id));
                        if (newItems.length > 0) {
                            setLatestNew(newItems[0]);
                        }
                    }

                    return next;
                });

                await syncUnreadCount();
                setError(null);
            } catch (err) {
                console.error('[Notifications] fetch failed:', err);
                if (isInitialLoad) {
                    setError('Failed to load notifications');
                }
            } finally {
                if (isInitialLoad) {
                    setIsLoading(false);
                    initialLoadDoneRef.current = true;
                }
            }
        },
        [user, syncUnreadCount],
    );

    // -----------------------------------------------------------------------
    // Handle an individual notification pushed via socket
    // -----------------------------------------------------------------------
    const handleSocketNotification = useCallback(
        (incoming: Notification) => {
            setNotifications((prev) => {
                const isNew = !prev.some((n) => n.notification_id === incoming.notification_id);
                if (isNew && initialLoadDoneRef.current) {
                    setLatestNew(incoming);
                }
                return mergeNotification(prev, incoming);
            });
            void syncUnreadCount();
        },
        [syncUnreadCount],
    );

    // -----------------------------------------------------------------------
    // JWT refresh — push a new token to the server WITHOUT disconnecting
    // -----------------------------------------------------------------------
    // connectWebSocketRef is set after connectWebSocket is defined below.
    // We use a ref so refreshJwt can call it without being in its dep array.
    const connectWebSocketRef = useRef<(() => Promise<void>) | undefined>(undefined);

    // -----------------------------------------------------------------------
    // Clear heartbeat / offline timers
    // -----------------------------------------------------------------------
    const clearTimers = useCallback(() => {
        if (offlinePollRef.current) {
            clearInterval(offlinePollRef.current);
            offlinePollRef.current = null;
        }
        if (heartbeatRef.current) {
            clearInterval(heartbeatRef.current);
            heartbeatRef.current = null;
        }
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }
        if (jwtRefreshRef.current) {
            clearInterval(jwtRefreshRef.current);
            jwtRefreshRef.current = null;
        }
    }, []);

    // -----------------------------------------------------------------------
    // Socket.IO connection
    // -----------------------------------------------------------------------
    const connectWebSocket = useCallback(async () => {
        if (!user || authLoading) return;

        // Tear down any previous socket cleanly
        if (socketRef.current) {
            socketRef.current.removeAllListeners();
            socketRef.current.disconnect();
            socketRef.current = null;
        }
        // Clear any pending timers
        if (jwtRefreshRef.current) {
            clearInterval(jwtRefreshRef.current);
            jwtRefreshRef.current = null;
        }

        try {
            const jwtObj = await account.createJWT();
            const token = jwtObj.jwt;

            const socketBase = getSocketBaseUrl();
            const socket = io(socketBase, {
                path: '/socket.io',
                // Try WebSocket first for lowest latency.
                // Falls back to long-polling automatically if WebSocket is blocked.
                transports: ['websocket', 'polling'],
                auth: { token },
                query: { token },
                reconnection: true,
                reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
                reconnectionDelay: RECONNECT_DELAY,
                reconnectionDelayMax: 10_000,
                timeout: 10_000,
            });

            socket.on('connect', () => {
                console.log('[Notifications] ✅ Socket.IO connected (transport:', socket.io.engine.transport.name, ')');
                setIsConnected(true);
                setError(null);

                // Stop offline poll, start heartbeat
                if (offlinePollRef.current) {
                    clearInterval(offlinePollRef.current);
                    offlinePollRef.current = null;
                }
                if (!heartbeatRef.current) {
                    heartbeatRef.current = setInterval(
                        () => void fetchNotifications(),
                        HEARTBEAT_POLL_MS,
                    );
                }

                // Schedule JWT refresh before it expires
                if (!jwtRefreshRef.current) {
                    jwtRefreshRef.current = setInterval(
                        () => {
                            // Inline JWT refresh: push new token over the live socket
                            // so we never need to disconnect due to token expiry.
                            void (async () => {
                                if (!socket.connected) return;
                                try {
                                    const refreshed = await account.createJWT();
                                    socket.emit('refresh_token', { token: refreshed.jwt });
                                    console.log('[Notifications] 🔄 JWT refreshed over existing socket');
                                } catch (refreshErr) {
                                    console.warn('[Notifications] JWT refresh failed — reconnecting:', refreshErr);
                                    void connectWebSocketRef.current?.();
                                }
                            })();
                        },
                        JWT_REFRESH_INTERVAL_MS,
                    );
                }

                void fetchNotifications();
            });

            // ── Notification events ──
            socket.on('notification', handleSocketNotification);

            socket.on('notification_updated', (updated: Notification) => {
                setNotifications((prev) => mergeNotification(prev, updated));
                void syncUnreadCount();
            });

            socket.on('notification_deleted', (payload: { notification_id?: string }) => {
                if (!payload.notification_id) return;
                setNotifications((prev) =>
                    prev.filter((n) => n.notification_id !== payload.notification_id),
                );
                void syncUnreadCount();
            });

            // Real-time unread count push (server emits this after mark-read operations)
            socket.on('unread_count_updated', (payload: { unread_count: number }) => {
                if (typeof payload.unread_count === 'number') {
                    setUnreadCount(payload.unread_count);
                }
            });

            // ── JWT refresh acknowledgements ──
            socket.on('token_refreshed', (data: { user_id: string }) => {
                console.log('[Notifications] ✅ JWT refreshed for user:', data.user_id);
            });

            socket.on('token_refresh_error', (data: { error: string }) => {
                console.warn('[Notifications] JWT refresh rejected by server:', data.error, '— reconnecting');
                // Token is truly dead — full reconnect to get a fresh JWT
                void connectWebSocket();
            });

            // ── Connection lifecycle ──
            socket.on('connection', (message: { status?: string }) => {
                if (message?.status) console.log('[Notifications] server status:', message.status);
            });

            socket.on('connect_error', (err: Error) => {
                console.warn('[Notifications] connect_error:', err.message);
                setError('Connection error — will retry');
                setIsConnected(false);
            });

            socket.on('disconnect', (reason: string) => {
                console.log('[Notifications] Socket.IO disconnected — reason:', reason);
                setIsConnected(false);

                // Stop heartbeat and JWT refresh timer; let Socket.IO auto-reconnect handle the rest
                if (heartbeatRef.current) {
                    clearInterval(heartbeatRef.current);
                    heartbeatRef.current = null;
                }
                if (jwtRefreshRef.current) {
                    clearInterval(jwtRefreshRef.current);
                    jwtRefreshRef.current = null;
                }
            });

            socketRef.current = socket;
            connectWebSocketRef.current = connectWebSocket;
        } catch (err) {
            console.error('[Notifications] Failed to create socket:', err);
            setError('Failed to connect to notifications');

            reconnectTimeoutRef.current = setTimeout(
                () => void connectWebSocket(),
                RECONNECT_DELAY,
            );
        }
    }, [user, authLoading, fetchNotifications, handleSocketNotification, syncUnreadCount]);

    // Keep the ref in sync so refreshJwt can call connectWebSocket
    useEffect(() => {
        connectWebSocketRef.current = connectWebSocket;
    }, [connectWebSocket]);

    // -----------------------------------------------------------------------
    // Effects
    // -----------------------------------------------------------------------

    // Initial fetch on auth ready
    useEffect(() => {
        if (!authLoading && user) {
            initialLoadDoneRef.current = false;
            void fetchNotifications();
        }
    }, [user, authLoading, fetchNotifications]);

    // Connect/disconnect socket
    useEffect(() => {
        if (!authLoading && user) {
            void connectWebSocket();
        }
        return () => {
            socketRef.current?.removeAllListeners();
            socketRef.current?.disconnect();
            socketRef.current = null;
            clearTimers();
        };
    }, [user, authLoading, connectWebSocket, clearTimers]);

    // Offline polling: run when socket is NOT connected
    useEffect(() => {
        if (!user || authLoading || isConnected) {
            if (offlinePollRef.current) {
                clearInterval(offlinePollRef.current);
                offlinePollRef.current = null;
            }
            return;
        }

        // Immediately fetch on disconnect then poll
        void fetchNotifications();

        offlinePollRef.current = setInterval(
            () => void fetchNotifications(),
            OFFLINE_POLL_MS,
        );

        return () => {
            if (offlinePollRef.current) {
                clearInterval(offlinePollRef.current);
                offlinePollRef.current = null;
            }
        };
    }, [user, authLoading, isConnected, fetchNotifications]);

    // -----------------------------------------------------------------------
    // Context value
    // -----------------------------------------------------------------------
    const value: NotificationContextType = {
        notifications,
        unreadCount,
        isConnected,
        isLoading,
        error,
        latestNew,
        clearLatestNew: () => setLatestNew(null),
        fetchNotifications,
        reconnect: connectWebSocket,
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
}
