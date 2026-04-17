'use client';

import React, { createContext, useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { account } from '@/lib/appwrite';
import api from '@/lib/api';

export interface Notification {
    _id: string;
    notification_id: string;
    text: string;
    severity: 'info' | 'warning' | 'critical' | 'success';
    created_at: string;
    read: boolean;
    read_at?: string | null;
    metadata?: Record<string, unknown>;
    user_id?: string | null;
}

export interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    isConnected: boolean;
    isLoading: boolean;
    error: string | null;
    fetchNotifications: (skip?: number, limit?: number) => Promise<void>;
    reconnect: () => void;
}

export const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const RECONNECT_DELAY = 3000;
const MAX_RECONNECT_ATTEMPTS = 5;
const WS_PING_INTERVAL = 25000;

function getWebSocketBaseUrl(): string {
    const apiBase = process.env.NEXT_PUBLIC_API_URL;

    if (apiBase) {
        try {
            const parsed = new URL(apiBase);
            parsed.protocol = parsed.protocol === 'https:' ? 'wss:' : 'ws:';
            return parsed.origin;
        } catch {
            // Fallback below
        }
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.hostname}:8000`;
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const { user, loading: authLoading } = useAuth();
    const websocketRef = useRef<WebSocket | null>(null);
    const reconnectAttemptsRef = useRef(0);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isConnected, setIsConnected] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch notifications from API
    const fetchNotifications = useCallback(async (skip = 0, limit = 20) => {
        if (!user) return;

        setIsLoading(true);
        try {
            const response = await api.get('/notifications/', {
                params: { skip, limit, unread_only: false }
            });
            setNotifications(response.data.items || []);
            
            // Fetch unread count
            const countResponse = await api.get('/notifications/unread/count');
            setUnreadCount(countResponse.data.unread_count || 0);
            
            setError(null);
        } catch (err) {
            console.error('Failed to fetch notifications:', err);
            setError('Failed to load notifications');
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    // WebSocket connection
    const connectWebSocket = useCallback(async () => {
        if (!user || authLoading) return;

        try {
            if (websocketRef.current) {
                websocketRef.current.close();
                websocketRef.current = null;
            }

            // Get fresh JWT from Appwrite
            const jwtObj = await account.createJWT();
            const token = jwtObj.jwt;

            const wsBase = getWebSocketBaseUrl();
            const url = `${wsBase}/notifications/ws/${encodeURIComponent(token)}`;

            const ws = new WebSocket(url);

            ws.onopen = () => {
                console.log('✅ WebSocket connected');
                setIsConnected(true);
                reconnectAttemptsRef.current = 0;
                setError(null);

                if (pingIntervalRef.current) {
                    clearInterval(pingIntervalRef.current);
                }
                pingIntervalRef.current = setInterval(() => {
                    if (ws.readyState === WebSocket.OPEN) {
                        ws.send('ping');
                    }
                }, WS_PING_INTERVAL);
            };

            ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);

                    if (message.type === 'notification') {
                        const newNotif = message.data as Notification;

                        // Add to notifications list without duplicates
                        setNotifications(prev => {
                            const exists = prev.some(item => item.notification_id === newNotif.notification_id);
                            if (exists) return prev;
                            return [newNotif, ...prev];
                        });

                        // Increment unread count only for unread messages
                        if (!newNotif.read) {
                            setUnreadCount(prev => prev + 1);
                        }
                    } else if (message.type === 'connection') {
                        console.log('Connection status:', message.status);
                    }
                } catch (err) {
                    // Ignore plain-text heartbeats such as "pong"
                    if (event.data !== 'pong') {
                        console.error('Failed to parse WebSocket message:', err);
                    }
                }
            };

            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                setError('Connection error occurred');
            };

            ws.onclose = () => {
                console.log('WebSocket disconnected');
                setIsConnected(false);
                websocketRef.current = null;

                if (pingIntervalRef.current) {
                    clearInterval(pingIntervalRef.current);
                    pingIntervalRef.current = null;
                }

                // Attempt to reconnect
                if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
                    reconnectAttemptsRef.current += 1;
                    reconnectTimeoutRef.current = setTimeout(() => {
                        connectWebSocket();
                    }, RECONNECT_DELAY);
                }
            };

            websocketRef.current = ws;
        } catch (err) {
            console.error('Failed to create WebSocket:', err);
            setError('Failed to connect to notifications');
        }
    }, [user, authLoading]);

    // Initial fetch on mount
    useEffect(() => {
        if (!authLoading && user) {
            fetchNotifications();
        }
    }, [user, authLoading, fetchNotifications]);

    // Connect/disconnect WebSocket
    useEffect(() => {
        if (!authLoading && user) {
            connectWebSocket();
        }

        return () => {
            if (websocketRef.current) {
                websocketRef.current.close();
                websocketRef.current = null;
            }
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            if (pingIntervalRef.current) {
                clearInterval(pingIntervalRef.current);
                pingIntervalRef.current = null;
            }
        };
    }, [user, authLoading, connectWebSocket]);

    const value: NotificationContextType = {
        notifications,
        unreadCount,
        isConnected,
        isLoading,
        error,
        fetchNotifications,
        reconnect: connectWebSocket,
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
}
