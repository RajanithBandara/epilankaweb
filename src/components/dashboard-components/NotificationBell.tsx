'use client';

import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import NotificationPanel from './NotificationPanel';

export default function NotificationBell() {
    const { unreadCount, isConnected } = useNotifications();
    const [isOpen, setIsOpen] = useState(false);

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
                title={isConnected ? 'Notifications' : 'Connecting...'}
            >
                <Bell className="h-5 w-5" />

                {/* Red dot indicator - shows when unread notifications exist */}
                {unreadCount > 0 && (
                    <div
                        className="absolute -top-1 -right-1 h-3 w-3 rounded-full"
                        style={{ background: 'var(--color-danger)' }}
                        title={`${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`}
                    />
                )}
                
                {/* Unread count badge */}
                {unreadCount > 0 && (
                    <span
                        className="absolute -right-2.5 -bottom-1 flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold text-white"
                        style={{ background: 'var(--color-danger)' }}
                    >
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
                
                {/* Connection status indicator */}
                <div
                    className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border border-white/50 ${
                        isConnected ? 'animate-pulse' : ''
                    }`}
                    style={{ background: isConnected ? 'var(--color-success)' : 'var(--color-danger)' }}
                />
            </button>

            {/* Notification Panel Modal */}
            {isOpen && (
                <NotificationPanel onClose={() => setIsOpen(false)} />
            )}
        </>
    );
}
