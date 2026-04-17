'use client';

import { useContext } from 'react';
import { NotificationContext, NotificationContextType } from '@/contexts/NotificationContext';

/**
 * Hook to use the notification context
 * Must be used within NotificationProvider
 */
export function useNotifications(): NotificationContextType {
    const context = useContext(NotificationContext);
    
    if (!context) {
        throw new Error('useNotifications must be used within NotificationProvider');
    }
    
    return context;
}
