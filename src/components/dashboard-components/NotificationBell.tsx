'use client';

import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import NotificationPanel from './NotificationPanel';

export default function NotificationBell() {
    const { unreadCount } = useNotifications();
    const [isOpen, setIsOpen] = useState(false);
    const hasUnreadCount = Number.isFinite(unreadCount) && unreadCount > 0;

    return (
        <>
            {/* Bell Icon Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="relative flex h-10 w-10 items-center justify-center rounded-lg border transition"
                style={{
                    background: 'var(--dash-card-bg)',
                    borderColor: 'var(--dash-card-border)',
                    color: 'var(--dash-text-primary)',
                }}
                title="Notifications"
            >
                <Bell className="h-5 w-5" />

                {/* Unread count badge */}
                {hasUnreadCount && (
                    <span
                        className="absolute -right-2.5 -bottom-1 flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold text-white"
                        style={{ background: 'var(--color-danger)' }}
                        title={`${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`}
                    >
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Notification Panel Modal */}
            {isOpen && (
                <NotificationPanel onClose={() => setIsOpen(false)} />
            )}
        </>
    );
}
