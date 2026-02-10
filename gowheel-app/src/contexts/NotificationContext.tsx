import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
    AppNotification,
    getNotifications,
    getUnreadCount,
    markAsRead as markAsReadService,
    markAllAsRead as markAllAsReadService,
    subscribeToNotifications,
} from '@/services/notificationService';

interface NotificationContextType {
    notifications: AppNotification[];
    unreadCount: number;
    loading: boolean;
    refresh: () => Promise<void>;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);

    const refresh = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const [notifs, count] = await Promise.all([
                getNotifications(),
                getUnreadCount(),
            ]);
            setNotifications(notifs);
            setUnreadCount(count);
        } catch (e) {
            console.error('Notification refresh error:', e);
        } finally {
            setLoading(false);
        }
    }, [user]);

    // Initial load
    useEffect(() => {
        if (user) {
            refresh();
        } else {
            setNotifications([]);
            setUnreadCount(0);
        }
    }, [user]);

    // Real-time subscription
    useEffect(() => {
        if (!user) return;

        const unsubscribe = subscribeToNotifications(user.id, (newNotif) => {
            setNotifications((prev) => [newNotif, ...prev]);
            setUnreadCount((prev) => prev + 1);
        });

        return unsubscribe;
    }, [user]);

    const markAsRead = async (id: string) => {
        await markAsReadService(id);
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
    };

    const markAllAsRead = async () => {
        await markAllAsReadService();
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
    };

    return (
        <NotificationContext.Provider
            value={{ notifications, unreadCount, loading, refresh, markAsRead, markAllAsRead }}
        >
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationContext);
    if (!context) {
        return {
            notifications: [],
            unreadCount: 0,
            loading: false,
            refresh: async () => { },
            markAsRead: async () => { },
            markAllAsRead: async () => { },
        };
    }
    return context;
}
