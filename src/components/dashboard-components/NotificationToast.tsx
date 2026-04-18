'use client';

import React, { useEffect, useRef } from 'react';
import { AlertCircle, AlertTriangle, Bell, CheckCircle, Info, X } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import type { Notification } from '@/contexts/NotificationContext';

const SEVERITY_STYLES: Record<
    Notification['severity'],
    { bg: string; border: string; iconColor: string; Icon: React.ComponentType<{ className?: string }> }
> = {
    info: {
        bg: 'rgba(59,130,246,0.12)',
        border: 'rgba(59,130,246,0.4)',
        iconColor: 'rgb(59,130,246)',
        Icon: Info,
    },
    warning: {
        bg: 'rgba(245,158,11,0.12)',
        border: 'rgba(245,158,11,0.4)',
        iconColor: 'rgb(245,158,11)',
        Icon: AlertTriangle,
    },
    critical: {
        bg: 'rgba(239,68,68,0.12)',
        border: 'rgba(239,68,68,0.4)',
        iconColor: 'rgb(239,68,68)',
        Icon: AlertCircle,
    },
    success: {
        bg: 'rgba(34,197,94,0.12)',
        border: 'rgba(34,197,94,0.4)',
        iconColor: 'rgb(34,197,94)',
        Icon: CheckCircle,
    },
};

/**
 * Renders a slide-in toast in the bottom-right corner whenever a new
 * notification arrives from the officer dashboard.  Place this component
 * anywhere *inside* <NotificationProvider> (e.g. the dashboard layout).
 */
export default function NotificationToast() {
    const { latestNew, clearLatestNew } = useNotifications();
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const notif = latestNew;

    // Auto-dismiss after 6 seconds
    useEffect(() => {
        if (!notif) return;

        // Try to fire a native browser notification too
        if (typeof window !== 'undefined' && 'Notification' in window) {
            if (window.Notification.permission === 'granted') {
                new window.Notification('EpiLanka Health Alert', {
                    body: notif.text,
                    icon: '/favicon.ico',
                });
            } else if (window.Notification.permission !== 'denied') {
                void window.Notification.requestPermission().then((perm) => {
                    if (perm === 'granted') {
                        new window.Notification('EpiLanka Health Alert', {
                            body: notif.text,
                            icon: '/favicon.ico',
                        });
                    }
                });
            }
        }

        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            clearLatestNew();
        }, 6000);

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [notif, clearLatestNew]);

    if (!notif) return null;

    const style = SEVERITY_STYLES[notif.severity as keyof typeof SEVERITY_STYLES] ?? SEVERITY_STYLES.info;
    const { Icon } = style;

    return (
        <div
            role="alert"
            aria-live="assertive"
            style={{
                position: 'fixed',
                bottom: '1.5rem',
                right: '1.5rem',
                zIndex: 9999,
                maxWidth: '22rem',
                width: 'calc(100vw - 2rem)',
                background: style.bg,
                border: `1px solid ${style.border}`,
                borderRadius: '1rem',
                boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
                backdropFilter: 'blur(12px)',
                padding: '0.875rem 1rem',
                display: 'flex',
                gap: '0.75rem',
                alignItems: 'flex-start',
                animation: 'notif-slide-in 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
        >
            {/* Severity icon */}
            <div
                style={{
                    flexShrink: 0,
                    width: '2rem',
                    height: '2rem',
                    borderRadius: '0.5rem',
                    background: `${style.iconColor}22`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: style.iconColor,
                }}
            >
                <Icon className="h-4 w-4" />
            </div>

            {/* Text area */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.375rem',
                        marginBottom: '0.25rem',
                    }}
                >
                    <Bell className="h-3.5 w-3.5" style={{ color: style.iconColor }} />
                    <span
                        style={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.06em',
                            color: style.iconColor,
                        }}
                    >
                        {notif.severity} · Health Officer Alert
                    </span>
                </div>
                <p
                    style={{
                        margin: 0,
                        fontSize: '0.83rem',
                        lineHeight: 1.5,
                        color: 'var(--dash-text-primary, #1a1a1a)',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                    }}
                >
                    {notif.text}
                </p>
            </div>

            {/* Dismiss button */}
            <button
                onClick={clearLatestNew}
                aria-label="Dismiss notification"
                style={{
                    flexShrink: 0,
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0.25rem',
                    borderRadius: '0.375rem',
                    color: 'var(--dash-text-muted, #888)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <X className="h-4 w-4" />
            </button>

            {/* Keyframe animation is injected via a <style> tag */}
            <style>{`
                @keyframes notif-slide-in {
                    from { opacity: 0; transform: translateX(2rem) scale(0.95); }
                    to   { opacity: 1; transform: translateX(0)     scale(1); }
                }
            `}</style>
        </div>
    );
}
