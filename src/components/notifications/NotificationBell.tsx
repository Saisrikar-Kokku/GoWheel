'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { useAuth } from '@/contexts/AuthContext';
import {
    getUnreadMessageCount,
    subscribeToAllMessages,
} from '@/services/chatService';

export default function NotificationBell() {
    const { user, profile } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [hasNewMessage, setHasNewMessage] = useState(false);

    // Fetch initial unread count
    const fetchUnreadCount = useCallback(async () => {
        if (!user) {
            setUnreadCount(0);
            return;
        }
        const count = await getUnreadMessageCount();
        setUnreadCount(count);
    }, [user]);

    useEffect(() => {
        fetchUnreadCount();
    }, [fetchUnreadCount]);

    // Subscribe to new messages
    useEffect(() => {
        if (!user?.id) return;

        const unsubscribe = subscribeToAllMessages(user.id, (message) => {
            // Increment unread count and show animation
            setUnreadCount((prev) => prev + 1);
            setHasNewMessage(true);

            // Reset animation after 2 seconds
            setTimeout(() => setHasNewMessage(false), 2000);
        });

        return () => {
            unsubscribe();
        };
    }, [user?.id]);

    // Refresh count when popover opens
    useEffect(() => {
        if (isOpen) {
            fetchUnreadCount();
        }
    }, [isOpen, fetchUnreadCount]);

    if (!user) return null;

    const dashboardPath = profile?.role === 'owner'
        ? '/dashboard/owner/bookings'
        : '/dashboard/renter/bookings';

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative h-9 w-9"
                >
                    {/* Bell Icon */}
                    <motion.div
                        animate={hasNewMessage ? { rotate: [0, -15, 15, -15, 15, 0] } : {}}
                        transition={{ duration: 0.5 }}
                    >
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                            />
                        </svg>
                    </motion.div>

                    {/* Unread Badge */}
                    <AnimatePresence>
                        {unreadCount > 0 && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                                className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1"
                            >
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </Button>
            </PopoverTrigger>

            <PopoverContent className="w-80 p-0" align="end">
                <div className="p-4 border-b border-border/50">
                    <h4 className="font-semibold flex items-center gap-2">
                        <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        Messages
                    </h4>
                </div>

                <div className="p-4">
                    {unreadCount > 0 ? (
                        <div className="text-center">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                                <span className="text-lg font-bold gradient-text">{unreadCount}</span>
                            </div>
                            <p className="text-sm text-muted-foreground mb-4">
                                You have {unreadCount} unread message{unreadCount !== 1 ? 's' : ''}
                            </p>
                            <Link href={dashboardPath} onClick={() => setIsOpen(false)}>
                                <Button
                                    size="sm"
                                    className="w-full bg-gradient-to-r from-primary to-emerald-500"
                                >
                                    View Bookings
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="text-center py-4">
                            <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
                                <svg className="w-6 h-6 text-muted-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                </svg>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                No new messages
                            </p>
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
