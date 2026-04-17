'use client';

import React from 'react';
import { Bell, X, AlertCircle, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';

interface NotificationPanelProps {
    onClose: () => void;
}

export default function NotificationPanel({ onClose }: NotificationPanelProps) {
    const { notifications, unreadCount, isLoading } = useNotifications();

    const severityStyles = {
        info: {
            bg: 'rgba(59, 130, 246, 0.1)',
            border: 'rgba(59, 130, 246, 0.3)',
            icon: Info,
            color: 'rgb(59, 130, 246)',
        },
        warning: {
            bg: 'rgba(245, 158, 11, 0.1)',
            border: 'rgba(245, 158, 11, 0.3)',
            icon: AlertTriangle,
            color: 'rgb(245, 158, 11)',
        },
        critical: {
            bg: 'rgba(239, 68, 68, 0.1)',
            border: 'rgba(239, 68, 68, 0.3)',
            icon: AlertCircle,
            color: 'rgb(239, 68, 68)',
        },
        success: {
            bg: 'rgba(34, 197, 94, 0.1)',
            border: 'rgba(34, 197, 94, 0.3)',
            icon: CheckCircle,
            color: 'rgb(34, 197, 94)',
        },
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffSeconds < 60) return 'Just now';
        if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
        if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
        if (diffSeconds < 604800) return `${Math.floor(diffSeconds / 86400)}d ago`;

        return date.toLocaleDateString();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-end">
            {/* Backdrop */}
            <button
                onClick={onClose}
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                aria-label="Close notifications"
            />

            {/* Panel */}
            <div
                className="relative w-full max-w-sm max-h-screen overflow-hidden flex flex-col rounded-l-2xl border shadow-2xl"
                style={{
                    background: 'var(--dash-card-bg)',
                    borderColor: 'var(--dash-card-border)',
                }}
            >
                {/* Header */}
                <div
                    className="flex items-center justify-between border-b p-4"
                    style={{ borderColor: 'var(--dash-card-border)' }}
                >
                    <div className="flex items-center gap-3">
                        <div
                            className="flex h-9 w-9 items-center justify-center rounded-lg border"
                            style={{
                                background: 'var(--dash-card-header-bg)',
                                borderColor: 'var(--dash-card-border)',
                            }}
                        >
                            <Bell className="h-4 w-4" style={{ color: 'var(--color-primary)' }} />
                        </div>
                        <div>
                            <h2 className="text-sm font-semibold" style={{ color: 'var(--dash-text-primary)' }}>
                                Notifications
                            </h2>
                            <p className="text-xs" style={{ color: 'var(--dash-text-muted)' }}>
                                {unreadCount} unread
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="rounded-lg p-1 transition"
                        style={{
                            background: 'var(--dash-card-header-bg)',
                            color: 'var(--dash-text-secondary)',
                        }}
                        aria-label="Close"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Notifications list */}
                <div className="flex-1 overflow-y-auto">
                    {isLoading ? (
                        <div className="flex items-center justify-center p-8">
                            <p style={{ color: 'var(--dash-text-secondary)' }}>Loading...</p>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-8 text-center">
                            <Bell className="h-8 w-8 mb-3" style={{ color: 'var(--dash-text-muted)' }} />
                            <p className="text-sm font-medium" style={{ color: 'var(--dash-text-primary)' }}>
                                No notifications yet
                            </p>
                            <p className="mt-1 text-xs" style={{ color: 'var(--dash-text-secondary)' }}>
                                You&apos;re all caught up!
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3 p-3">
                            {notifications.map((notif) => {
                                const style = severityStyles[notif.severity as keyof typeof severityStyles] || severityStyles.info;
                                const SeverityIcon = style.icon;

                                return (
                                    <div
                                        key={notif._id}
                                        className="rounded-xl border p-3 transition hover:shadow-sm"
                                        style={{
                                            background: style.bg,
                                            borderColor: style.border,
                                        }}
                                    >
                                        <div className="flex items-start gap-3">
                                            {/* Icon */}
                                            <div className="mt-0.5 shrink-0">
                                                <SeverityIcon
                                                    className="h-4 w-4"
                                                    style={{ color: style.color }}
                                                />
                                            </div>

                                            {/* Content */}
                                            <div className="min-w-0 flex-1">
                                                <div className="mb-1.5 flex flex-wrap items-center gap-2">
                                                    <span
                                                        className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                                                        style={{
                                                            background: 'rgba(255,255,255,0.5)',
                                                            color: style.color,
                                                        }}
                                                    >
                                                        {notif.severity}
                                                    </span>
                                                    <span
                                                        className="text-xs"
                                                        style={{ color: 'var(--dash-text-secondary)' }}
                                                    >
                                                        {formatTime(notif.created_at)}
                                                    </span>
                                                </div>

                                                <p
                                                    className="text-sm leading-relaxed"
                                                    style={{ color: 'var(--dash-text-primary)' }}
                                                >
                                                    {notif.text}
                                                </p>
                                            </div>

                                            {/* Status */}
                                            <div className="flex shrink-0 items-center gap-1.5">
                                                {!notif.read && (
                                                    <div className="h-2 w-2 rounded-full" style={{ background: 'var(--color-primary)' }} />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
