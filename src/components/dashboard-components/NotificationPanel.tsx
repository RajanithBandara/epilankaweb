'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    AlertCircle,
    AlertTriangle,
    Bell,
    BellOff,
    CheckCircle,
    CheckCheck,
    Info,
    Wifi,
    WifiOff,
    X,
} from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';

interface NotificationPanelProps {
    onClose: () => void;
}

/* ─── severity config ──────────────────────────────────────────────────── */
const SEVERITY = {
    info: {
        bg: 'rgba(59,130,246,0.07)',
        accent: 'rgb(59,130,246)',
        badge: 'rgba(59,130,246,0.15)',
        Icon: Info,
    },
    warning: {
        bg: 'rgba(245,158,11,0.07)',
        accent: 'rgb(245,158,11)',
        badge: 'rgba(245,158,11,0.15)',
        Icon: AlertTriangle,
    },
    critical: {
        bg: 'rgba(239,68,68,0.08)',
        accent: 'rgb(239,68,68)',
        badge: 'rgba(239,68,68,0.15)',
        Icon: AlertCircle,
    },
    success: {
        bg: 'rgba(34,197,94,0.07)',
        accent: 'rgb(34,197,94)',
        badge: 'rgba(34,197,94,0.15)',
        Icon: CheckCircle,
    },
} as const;

/* ─── stable relative-time formatter (no Date.now() drift inside renders) */
function relativeTime(iso: string): string {
    const diffS = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (diffS < 60) return 'Just now';
    if (diffS < 3600) return `${Math.floor(diffS / 60)}m ago`;
    if (diffS < 86400) return `${Math.floor(diffS / 3600)}h ago`;
    if (diffS < 604800) return `${Math.floor(diffS / 86400)}d ago`;
    return new Date(iso).toLocaleDateString();
}

/* ─── component ─────────────────────────────────────────────────────────── */
export default function NotificationPanel({ onClose }: NotificationPanelProps) {
    const { notifications, isLoading, isConnected, fetchNotifications } =
        useNotifications();

    const [filter, setFilter] = useState<'all' | 'unread'>('all');
    const [visible, setVisible] = useState(false);
    /** IDs of notifications the user locally marked as read in this session */
    const [localReadIds, setLocalReadIds] = useState<Set<string>>(new Set());
    const panelRef = useRef<HTMLDivElement>(null);

    /* slide-in on mount */
    useEffect(() => {
        requestAnimationFrame(() => setVisible(true));
    }, []);

    /* close with slide-out */
    const handleClose = () => {
        setVisible(false);
        setTimeout(onClose, 280);
    };

    /* close on Escape */
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') handleClose();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    });

    /* stable timestamps — recalculate once per minute, NOT on every heartbeat */
    const [tick, setTick] = useState(0);
    useEffect(() => {
        const id = setInterval(() => setTick((t) => t + 1), 60_000);
        return () => clearInterval(id);
    }, []);

    const timestamped = useMemo(
        () =>
            notifications.map((n) => ({
                ...n,
                read: n.read || localReadIds.has(n.notification_id),
                relTime: relativeTime(n.created_at),
            })),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [notifications, tick, localReadIds],
    );

    const localUnreadCount = useMemo(
        () => timestamped.filter((n) => !n.read).length,
        [timestamped],
    );

    const filtered = useMemo(
        () => (filter === 'unread' ? timestamped.filter((n) => !n.read) : timestamped),
        [timestamped, filter],
    );

    /* mark all read — optimistic local update + server persistence */
    const handleMarkAllRead = async () => {
        // Immediately mark all as read visually (optimistic)
        const allIds = new Set(notifications.map((n) => n.notification_id));
        setLocalReadIds(allIds);

        try {
            await fetch('/api/notifications/read-all', {
                method: 'POST',
                credentials: 'include',
            });
            // Server will push unread_count_updated via socket;
            // also refresh list to sync true read state from DB.
            await fetchNotifications();
        } catch {
            // non-fatal — heartbeat will reconcile on next tick
        }
    };

    return (
        <>
            {/* ── keyframes injected once ── */}
            <style>{`
                @keyframes notif-panel-in {
                    from { opacity: 0; transform: translateX(100%); }
                    to   { opacity: 1; transform: translateX(0); }
                }
                @keyframes notif-panel-out {
                    from { opacity: 1; transform: translateX(0); }
                    to   { opacity: 0; transform: translateX(100%); }
                }
                @keyframes notif-backdrop-in {
                    from { opacity: 0; }
                    to   { opacity: 1; }
                }
                @keyframes notif-backdrop-out {
                    from { opacity: 1; }
                    to   { opacity: 0; }
                }
                @keyframes notif-item-in {
                    from { opacity: 0; transform: translateY(8px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .notif-item-animate {
                    animation: notif-item-in 0.22s ease both;
                }
            `}</style>

            {/* ── Backdrop ── */}
            <div
                onClick={handleClose}
                style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 49,
                    background: 'rgba(0,0,0,0.45)',
                    backdropFilter: 'blur(3px)',
                    animation: visible
                        ? 'notif-backdrop-in 0.28s ease both'
                        : 'notif-backdrop-out 0.28s ease both',
                }}
            />

            {/* ── Panel ── */}
            <div
                ref={panelRef}
                role="dialog"
                aria-label="Notifications"
                style={{
                    position: 'fixed',
                    top: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 50,
                    width: '100%',
                    maxWidth: '22rem',
                    display: 'flex',
                    flexDirection: 'column',
                    background: 'var(--dash-card-bg)',
                    borderLeft: '1px solid var(--dash-card-border)',
                    boxShadow: '-8px 0 40px rgba(0,0,0,0.18)',
                    animation: visible
                        ? 'notif-panel-in 0.28s cubic-bezier(0.22,1,0.36,1) both'
                        : 'notif-panel-out 0.28s cubic-bezier(0.22,1,0.36,1) both',
                }}
            >
                {/* ── Header ── */}
                <div
                    style={{
                        padding: '1rem 1rem 0',
                        background: 'var(--dash-card-bg)',
                        borderBottom: '1px solid var(--dash-card-border)',
                        flexShrink: 0,
                    }}
                >
                    {/* Title row */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '0.75rem',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                            {/* Bell icon box */}
                            <div
                                style={{
                                    width: '2.25rem',
                                    height: '2.25rem',
                                    borderRadius: '0.625rem',
                                    background: 'rgba(59,130,246,0.12)',
                                    border: '1px solid rgba(59,130,246,0.25)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                }}
                            >
                                <Bell style={{ width: '1rem', height: '1rem', color: 'var(--color-primary)' }} />
                            </div>
                            <div>
                                <h2
                                    style={{
                                        margin: 0,
                                        fontSize: '0.9rem',
                                        fontWeight: 700,
                                        color: 'var(--dash-text-primary)',
                                        letterSpacing: '-0.01em',
                                    }}
                                >
                                    Notifications
                                </h2>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginTop: '0.1rem' }}>
                                    {/* connection dot */}
                                    {isConnected ? (
                                        <Wifi style={{ width: '0.7rem', height: '0.7rem', color: 'rgb(34,197,94)' }} />
                                    ) : (
                                        <WifiOff style={{ width: '0.7rem', height: '0.7rem', color: 'rgb(245,158,11)' }} />
                                    )}
                                    <span
                                        style={{
                                            fontSize: '0.7rem',
                                            color: isConnected ? 'rgb(34,197,94)' : 'rgb(245,158,11)',
                                            fontWeight: 500,
                                        }}
                                    >
                                        {isConnected ? 'Live' : 'Reconnecting…'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                            {/* Mark all read */}
                            {localUnreadCount > 0 && (
                                <button
                                    onClick={handleMarkAllRead}
                                    title="Mark all as read"
                                    style={{
                                        background: 'rgba(59,130,246,0.1)',
                                        border: '1px solid rgba(59,130,246,0.2)',
                                        borderRadius: '0.5rem',
                                        padding: '0.3rem 0.5rem',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.3rem',
                                        color: 'var(--color-primary)',
                                        fontSize: '0.7rem',
                                        fontWeight: 600,
                                        transition: 'background 0.15s',
                                    }}
                                >
                                    <CheckCheck style={{ width: '0.75rem', height: '0.75rem' }} />
                                    All read
                                </button>
                            )}
                            {/* Close */}
                            <button
                                onClick={handleClose}
                                aria-label="Close notifications"
                                style={{
                                    background: 'var(--dash-card-header-bg)',
                                    border: '1px solid var(--dash-card-border)',
                                    borderRadius: '0.5rem',
                                    padding: '0.3rem',
                                    cursor: 'pointer',
                                    color: 'var(--dash-text-secondary)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'background 0.15s',
                                }}
                            >
                                <X style={{ width: '1rem', height: '1rem' }} />
                            </button>
                        </div>
                    </div>

                    {/* Filter tabs */}
                    <div
                        style={{
                            display: 'flex',
                            gap: '0.25rem',
                            padding: '0.25rem',
                            background: 'var(--dash-card-header-bg)',
                            borderRadius: '0.625rem',
                            marginBottom: '0.75rem',
                        }}
                    >
                        {(['all', 'unread'] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setFilter(tab)}
                                style={{
                                    flex: 1,
                                    padding: '0.4rem 0.75rem',
                                    borderRadius: '0.45rem',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '0.78rem',
                                    fontWeight: 600,
                                    transition: 'all 0.18s',
                                    background: filter === tab ? 'var(--dash-card-bg)' : 'transparent',
                                    color: filter === tab ? 'var(--dash-text-primary)' : 'var(--dash-text-muted)',
                                    boxShadow: filter === tab ? '0 1px 4px rgba(0,0,0,0.10)' : 'none',
                                }}
                            >
                                {tab === 'all' ? (
                                    `All${notifications.length > 0 ? ` (${notifications.length})` : ''}`
                                ) : (
                                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}>
                                        Unread
                                        {localUnreadCount > 0 && (
                                            <span
                                                style={{
                                                    background: 'var(--color-danger, #dc2626)',
                                                    color: '#fff',
                                                    borderRadius: '999px',
                                                    padding: '0 0.4rem',
                                                    fontSize: '0.65rem',
                                                    fontWeight: 700,
                                                    lineHeight: '1.5',
                                                    minWidth: '1.25rem',
                                                    textAlign: 'center',
                                                }}
                                            >
                                                {localUnreadCount > 99 ? '99+' : localUnreadCount}
                                            </span>
                                        )}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── List ── */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '0.625rem' }}>
                    {isLoading ? (
                        /* skeleton shimmer */
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.5rem' }}>
                            {[...Array(4)].map((_, i) => (
                                <div
                                    key={i}
                                    style={{
                                        height: '4.5rem',
                                        borderRadius: '0.75rem',
                                        background: 'var(--dash-skeleton-bg)',
                                        animation: 'pulse 1.5s ease-in-out infinite',
                                        opacity: 1 - i * 0.15,
                                    }}
                                />
                            ))}
                        </div>
                    ) : filtered.length === 0 ? (
                        /* empty state */
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '3rem 1.5rem',
                                textAlign: 'center',
                                gap: '0.875rem',
                            }}
                        >
                            <div
                                style={{
                                    width: '3.5rem',
                                    height: '3.5rem',
                                    borderRadius: '50%',
                                    background: 'var(--dash-card-header-bg)',
                                    border: '1px solid var(--dash-card-border)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <BellOff style={{ width: '1.5rem', height: '1.5rem', color: 'var(--dash-text-muted)' }} />
                            </div>
                            <div>
                                <p
                                    style={{
                                        margin: 0,
                                        fontWeight: 600,
                                        fontSize: '0.88rem',
                                        color: 'var(--dash-text-primary)',
                                    }}
                                >
                                    {filter === 'unread' ? 'All caught up!' : 'No notifications yet'}
                                </p>
                                <p
                                    style={{
                                        margin: '0.25rem 0 0',
                                        fontSize: '0.78rem',
                                        color: 'var(--dash-text-muted)',
                                        lineHeight: 1.5,
                                    }}
                                >
                                    {filter === 'unread'
                                        ? 'You have no unread notifications.'
                                        : "We'll notify you when something arrives."}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            {filtered.map((notif, idx) => {
                                const sev = SEVERITY[notif.severity as keyof typeof SEVERITY] ?? SEVERITY.info;
                                const SevIcon = sev.Icon;

                                return (
                                    <div
                                        key={notif._id}
                                        className="notif-item-animate"
                                        style={{
                                            animationDelay: `${Math.min(idx * 30, 180)}ms`,
                                            borderRadius: '0.75rem',
                                            border: `1px solid ${notif.read ? 'var(--dash-card-border)' : sev.accent + '44'}`,
                                            background: notif.read ? 'var(--dash-card-header-bg)' : sev.bg,
                                            overflow: 'hidden',
                                            position: 'relative',
                                            transition: 'box-shadow 0.15s, transform 0.15s',
                                            cursor: 'default',
                                        }}
                                        onMouseEnter={(e) => {
                                            (e.currentTarget as HTMLDivElement).style.boxShadow =
                                                '0 2px 12px rgba(0,0,0,0.10)';
                                            (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-1px)';
                                        }}
                                        onMouseLeave={(e) => {
                                            (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                                            (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                                        }}
                                    >
                                        {/* Severity accent bar */}
                                        <div
                                            style={{
                                                position: 'absolute',
                                                left: 0,
                                                top: 0,
                                                bottom: 0,
                                                width: '3px',
                                                background: sev.accent,
                                                borderRadius: '3px 0 0 3px',
                                                opacity: notif.read ? 0.45 : 1,
                                            }}
                                        />

                                        <div
                                            style={{
                                                padding: '0.625rem 0.75rem 0.625rem 0.875rem',
                                                display: 'flex',
                                                gap: '0.625rem',
                                                alignItems: 'flex-start',
                                            }}
                                        >
                                            {/* Severity Icon */}
                                            <div
                                                style={{
                                                    flexShrink: 0,
                                                    width: '1.875rem',
                                                    height: '1.875rem',
                                                    borderRadius: '0.5rem',
                                                    background: sev.badge,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: sev.accent,
                                                    marginTop: '0.1rem',
                                                }}
                                            >
                                                <SevIcon style={{ width: '0.9rem', height: '0.9rem' }} />
                                            </div>

                                            {/* Text block */}
                                            <div style={{ flex: 1, minWidth: 0 }}>

                                                {/* Row 1: badges + time */}
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.3rem',
                                                        marginBottom: notif.title ? '0.2rem' : '0.25rem',
                                                        flexWrap: 'wrap',
                                                    }}
                                                >
                                                    {/* Severity pill */}
                                                    <span
                                                        style={{
                                                            fontSize: '0.6rem',
                                                            fontWeight: 700,
                                                            textTransform: 'uppercase',
                                                            letterSpacing: '0.07em',
                                                            color: sev.accent,
                                                            background: sev.badge,
                                                            padding: '0.1rem 0.4rem',
                                                            borderRadius: '999px',
                                                        }}
                                                    >
                                                        {notif.severity}
                                                    </span>
                                                    {/* Category pill */}
                                                    {notif.category && (
                                                        <span
                                                            style={{
                                                                fontSize: '0.6rem',
                                                                fontWeight: 600,
                                                                textTransform: 'capitalize',
                                                                color: 'var(--dash-text-muted)',
                                                                background: 'var(--dash-card-header-bg)',
                                                                border: '1px solid var(--dash-card-border)',
                                                                padding: '0.1rem 0.4rem',
                                                                borderRadius: '999px',
                                                            }}
                                                        >
                                                            {notif.category}
                                                        </span>
                                                    )}
                                                    {/* Timestamp */}
                                                    <span
                                                        style={{
                                                            fontSize: '0.68rem',
                                                            color: 'var(--dash-text-muted)',
                                                            marginLeft: 'auto',
                                                            whiteSpace: 'nowrap',
                                                        }}
                                                    >
                                                        {notif.relTime}
                                                    </span>
                                                </div>

                                                {/* Row 2: title (if present) */}
                                                {notif.title && (
                                                    <p
                                                        style={{
                                                            margin: '0 0 0.2rem',
                                                            fontSize: '0.82rem',
                                                            fontWeight: 700,
                                                            color: notif.read
                                                                ? 'var(--dash-text-secondary)'
                                                                : 'var(--dash-text-primary)',
                                                            lineHeight: 1.3,
                                                            whiteSpace: 'nowrap',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                        }}
                                                    >
                                                        {notif.title}
                                                    </p>
                                                )}

                                                {/* Row 3: body text */}
                                                <p
                                                    style={{
                                                        margin: 0,
                                                        fontSize: '0.78rem',
                                                        lineHeight: 1.55,
                                                        color: notif.read
                                                            ? 'var(--dash-text-muted)'
                                                            : 'var(--dash-text-secondary)',
                                                        fontWeight: 400,
                                                    }}
                                                >
                                                    {notif.text}
                                                </p>
                                            </div>

                                            {/* Unread dot */}
                                            {!notif.read && (
                                                <div
                                                    style={{
                                                        flexShrink: 0,
                                                        width: '7px',
                                                        height: '7px',
                                                        borderRadius: '50%',
                                                        background: sev.accent,
                                                        marginTop: '0.5rem',
                                                        boxShadow: `0 0 6px ${sev.accent}88`,
                                                    }}
                                                />
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* ── Footer ── */}
                <div
                    style={{
                        padding: '0.75rem 1rem',
                        borderTop: '1px solid var(--dash-card-border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                    }}
                >
                    <p
                        style={{
                            margin: 0,
                            fontSize: '0.7rem',
                            color: 'var(--dash-text-muted)',
                            textAlign: 'center',
                        }}
                    >
                        Notifications refresh automatically · Last {notifications.length} shown
                    </p>
                </div>
            </div>
        </>
    );
}
