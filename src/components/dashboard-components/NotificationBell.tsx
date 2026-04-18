'use client';

import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import NotificationPanel from './NotificationPanel';

export default function NotificationBell() {
    const { unreadCount, latestNew } = useNotifications();
    const [isOpen, setIsOpen] = useState(false);

    const hasUnread = Number.isFinite(unreadCount) && unreadCount > 0;
    const ringKey = latestNew?.notification_id ?? 'no-ring';

    return (
        <>
            <style>{`
                @keyframes bell-ring {
                    0%   { transform: rotate(0deg); }
                    15%  { transform: rotate(18deg); }
                    30%  { transform: rotate(-15deg); }
                    45%  { transform: rotate(12deg); }
                    60%  { transform: rotate(-8deg); }
                    75%  { transform: rotate(5deg); }
                    90%  { transform: rotate(-3deg); }
                    100% { transform: rotate(0deg); }
                }
                .bell-ringing {
                    animation: bell-ring 0.8s ease-in-out;
                    transform-origin: top center;
                }
                @keyframes bell-pulse {
                    0%   { transform: scale(0.9); opacity: 0.45; }
                    100% { transform: scale(1.15); opacity: 0; }
                }
                .bell-pulse {
                    animation: bell-pulse 0.8s ease-out;
                }
                @keyframes badge-pop {
                    0%   { transform: scale(0); }
                    70%  { transform: scale(1.25); }
                    100% { transform: scale(1); }
                }
                .badge-pop { animation: badge-pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
            `}</style>

            {/* Bell Icon Button */}
            <button
                id="notification-bell-btn"
                onClick={() => setIsOpen(true)}
                className="relative flex h-10 w-10 items-center justify-center rounded-lg border transition"
                style={{
                    background: 'var(--dash-card-bg)',
                    borderColor: hasUnread ? 'var(--color-primary)' : 'var(--dash-card-border)',
                    color: 'var(--dash-text-primary)',
                }}
                title="Notifications"
            >
                {latestNew ? (
                    <React.Fragment key={ringKey}>
                        <Bell
                            className="h-5 w-5 bell-ringing"
                            style={hasUnread ? { color: 'var(--color-primary)' } : undefined}
                        />
                        <span
                            className="bell-pulse absolute inset-0 rounded-lg"
                            style={{
                                boxShadow: '0 0 0 3px var(--color-primary, #3b82f6)',
                                pointerEvents: 'none',
                            }}
                        />
                    </React.Fragment>
                ) : (
                    <Bell
                        className="h-5 w-5"
                        style={hasUnread ? { color: 'var(--color-primary)' } : undefined}
                    />
                )}

                {/* Unread count badge */}
                {hasUnread && (
                    <span
                        key={unreadCount}   /* re-mount to replay animation on count change */
                        className="badge-pop absolute -right-2.5 -bottom-1 flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold text-white"
                        style={{ background: 'var(--color-danger, #dc2626)' }}
                        title={`${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`}
                    >
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Notification Panel Modal */}
            {isOpen && <NotificationPanel onClose={() => setIsOpen(false)} />}
        </>
    );
}
