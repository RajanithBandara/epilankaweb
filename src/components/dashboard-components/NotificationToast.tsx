'use client';

import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, AlertTriangle, Bell, CheckCircle, Info, X } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import type { Notification } from '@/contexts/NotificationContext';

/* ─── constants ─────────────────────────────────────────────────────────── */
const DISMISS_MS = 6000;

/* ─── severity config ──────────────────────────────────────────────────── */
const SEVERITY_STYLES: Record<
    Notification['severity'],
    {
        bg: string;
        border: string;
        glow: string;
        iconColor: string;
        barColor: string;
        Icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
        label: string;
    }
> = {
    info: {
        bg: 'rgba(30,58,138,0.92)',
        border: 'rgba(59,130,246,0.55)',
        glow: '0 8px 32px rgba(59,130,246,0.25)',
        iconColor: 'rgb(147,197,253)',
        barColor: 'rgb(59,130,246)',
        Icon: Info,
        label: 'Info',
    },
    warning: {
        bg: 'rgba(120,53,15,0.92)',
        border: 'rgba(245,158,11,0.55)',
        glow: '0 8px 32px rgba(245,158,11,0.2)',
        iconColor: 'rgb(253,211,77)',
        barColor: 'rgb(245,158,11)',
        Icon: AlertTriangle,
        label: 'Warning',
    },
    critical: {
        bg: 'rgba(127,29,29,0.94)',
        border: 'rgba(239,68,68,0.55)',
        glow: '0 8px 32px rgba(239,68,68,0.25)',
        iconColor: 'rgb(252,165,165)',
        barColor: 'rgb(239,68,68)',
        Icon: AlertCircle,
        label: 'Critical Alert',
    },
    success: {
        bg: 'rgba(5,46,22,0.92)',
        border: 'rgba(34,197,94,0.55)',
        glow: '0 8px 32px rgba(34,197,94,0.2)',
        iconColor: 'rgb(134,239,172)',
        barColor: 'rgb(34,197,94)',
        Icon: CheckCircle,
        label: 'Success',
    },
};

/**
 * Slide-in toast shown in the bottom-right corner whenever a new notification
 * arrives.  Place this anywhere inside <NotificationProvider>.
 */
export default function NotificationToast() {
    const { latestNew, clearLatestNew } = useNotifications();
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const notif = latestNew;

    /* progress bar: counts 100 → 0 over DISMISS_MS */
    const [progress, setProgress] = useState(100);
    const rafRef = useRef<number | null>(null);
    const startRef = useRef<number | null>(null);

    /* slide visibility */
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (!notif) {
            setVisible(false);
            return;
        }

        /* --- fire browser notification --- */
        if (typeof window !== 'undefined' && 'Notification' in window) {
            const browserTitle = notif.title ?? 'EpiLanka Health Alert';
            const browserBody  = notif.text;
            if (window.Notification.permission === 'granted') {
                new window.Notification(browserTitle, {
                    body: browserBody,
                    icon: '/favicon.ico',
                });
            } else if (window.Notification.permission !== 'denied') {
                void window.Notification.requestPermission().then((perm) => {
                    if (perm === 'granted') {
                        new window.Notification(browserTitle, {
                            body: browserBody,
                            icon: '/favicon.ico',
                        });
                    }
                });
            }
        }

        /* --- animate in --- */
        setProgress(100);
        startRef.current = null;
        setVisible(true);

        /* --- progress bar RAF loop --- */
        const tick = (now: number) => {
            if (!startRef.current) startRef.current = now;
            const elapsed = now - startRef.current;
            const pct = Math.max(0, 100 - (elapsed / DISMISS_MS) * 100);
            setProgress(pct);
            if (pct > 0) {
                rafRef.current = requestAnimationFrame(tick);
            }
        };
        rafRef.current = requestAnimationFrame(tick);

        /* --- auto dismiss --- */
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            setVisible(false);
            setTimeout(clearLatestNew, 320); // wait for slide-out
        }, DISMISS_MS);

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [notif, clearLatestNew]);

    if (!notif) return null;

    const s = SEVERITY_STYLES[notif.severity as keyof typeof SEVERITY_STYLES] ?? SEVERITY_STYLES.info;
    const { Icon } = s;

    return (
        <>
            <style>{`
                @keyframes toast-slide-in {
                    from { opacity: 0; transform: translateX(110%) scale(0.95); }
                    to   { opacity: 1; transform: translateX(0)    scale(1); }
                }
                @keyframes toast-slide-out {
                    from { opacity: 1; transform: translateX(0)    scale(1); }
                    to   { opacity: 0; transform: translateX(110%) scale(0.95); }
                }
            `}</style>

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
                    background: s.bg,
                    border: `1px solid ${s.border}`,
                    borderRadius: '1rem',
                    boxShadow: s.glow,
                    backdropFilter: 'blur(16px)',
                    overflow: 'hidden',
                    animation: visible
                        ? 'toast-slide-in 0.35s cubic-bezier(0.34,1.56,0.64,1) both'
                        : 'toast-slide-out 0.3s ease both',
                }}
            >
                {/* Main content */}
                <div
                    style={{
                        padding: '0.875rem 1rem',
                        display: 'flex',
                        gap: '0.75rem',
                        alignItems: 'flex-start',
                    }}
                >
                    {/* Severity icon */}
                    <div
                        style={{
                            flexShrink: 0,
                            width: '2.25rem',
                            height: '2.25rem',
                            borderRadius: '0.625rem',
                            background: `${s.iconColor}22`,
                            border: `1px solid ${s.iconColor}33`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: s.iconColor,
                        }}
                    >
                        <Icon style={{ width: '1rem', height: '1rem' }} />
                    </div>

                    {/* Text area */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        {/* Label row: severity · category */}
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.375rem',
                                marginBottom: '0.3rem',
                            }}
                        >
                            <Bell style={{ width: '0.75rem', height: '0.75rem', color: s.iconColor, flexShrink: 0 }} />
                            <span
                                style={{
                                    fontSize: '0.68rem',
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.07em',
                                    color: s.iconColor,
                                }}
                            >
                                {s.label}
                                {notif.category && notif.category !== 'system' && (
                                    <span style={{ fontWeight: 500, opacity: 0.8 }}>
                                        {' · '}{notif.category.charAt(0).toUpperCase() + notif.category.slice(1)}
                                    </span>
                                )}
                            </span>
                        </div>

                        {/* Title (bold heading) if present */}
                        {notif.title && (
                            <p
                                style={{
                                    margin: '0 0 0.2rem',
                                    fontSize: '0.87rem',
                                    fontWeight: 700,
                                    lineHeight: 1.3,
                                    color: 'rgba(255,255,255,0.97)',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                }}
                            >
                                {notif.title}
                            </p>
                        )}

                        {/* Body text */}
                        <p
                            style={{
                                margin: 0,
                                fontSize: notif.title ? '0.78rem' : '0.83rem',
                                lineHeight: 1.5,
                                color: notif.title ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.92)',
                                display: '-webkit-box',
                                WebkitLineClamp: notif.title ? 2 : 3,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                            }}
                        >
                            {notif.text}
                        </p>
                    </div>

                    {/* Dismiss button */}
                    <button
                        onClick={() => {
                            setVisible(false);
                            setTimeout(clearLatestNew, 320);
                        }}
                        aria-label="Dismiss notification"
                        style={{
                            flexShrink: 0,
                            background: 'rgba(255,255,255,0.08)',
                            border: '1px solid rgba(255,255,255,0.12)',
                            borderRadius: '0.5rem',
                            cursor: 'pointer',
                            padding: '0.3rem',
                            color: 'rgba(255,255,255,0.6)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'background 0.15s, color 0.15s',
                        }}
                        onMouseEnter={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.16)';
                            (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.9)';
                        }}
                        onMouseLeave={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.08)';
                            (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.6)';
                        }}
                    >
                        <X style={{ width: '0.875rem', height: '0.875rem' }} />
                    </button>
                </div>

                {/* Auto-dismiss progress bar */}
                <div
                    style={{
                        height: '3px',
                        background: 'rgba(255,255,255,0.08)',
                    }}
                >
                    <div
                        style={{
                            height: '100%',
                            width: `${progress}%`,
                            background: s.barColor,
                            borderRadius: '0 2px 2px 0',
                            transition: 'width 0.1s linear',
                            boxShadow: `0 0 6px ${s.barColor}88`,
                        }}
                    />
                </div>
            </div>
        </>
    );
}
