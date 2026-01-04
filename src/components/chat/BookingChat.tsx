'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import ChatMessage from './ChatMessage';
import {
    getOrCreateConversation,
    getMessages,
    sendMessage,
    subscribeToMessages,
    getCurrentUserId,
    markMessagesAsRead,
} from '@/services/chatService';
import { Message, MessageWithSender, isChatEnabled } from '@/types/chat';

interface BookingChatProps {
    bookingId: string;
    bookingStatus: string;
    renterId: string;
    ownerId: string;
    renterName: string;
    ownerName: string;
}

export default function BookingChat({
    bookingId,
    bookingStatus,
    renterId,
    ownerId,
    renterName,
    ownerName,
}: BookingChatProps) {
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [messages, setMessages] = useState<MessageWithSender[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const chatEnabled = isChatEnabled(bookingStatus);

    // Scroll to bottom of messages
    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    // Initialize chat
    useEffect(() => {
        if (!chatEnabled) {
            setLoading(false);
            return;
        }

        const initChat = async () => {
            try {
                setLoading(true);
                setError(null);

                // Get current user
                const userId = await getCurrentUserId();
                setCurrentUserId(userId);

                // Get or create conversation
                const conversation = await getOrCreateConversation(bookingId, renterId, ownerId);
                setConversationId(conversation.id);

                // Load existing messages
                const existingMessages = await getMessages(conversation.id);
                setMessages(existingMessages);

                // Mark messages as read when opening chat
                await markMessagesAsRead(conversation.id);
            } catch (err: any) {
                console.error('Error initializing chat:', err);
                setError('Failed to load chat');
            } finally {
                setLoading(false);
            }
        };

        initChat();
    }, [bookingId, renterId, ownerId, chatEnabled]);

    // Subscribe to realtime messages
    useEffect(() => {
        if (!conversationId || !chatEnabled) return;

        const unsubscribe = subscribeToMessages(conversationId, (newMsg: Message) => {
            // Only add if not already in the list (avoid duplicates from optimistic updates)
            setMessages((prev) => {
                const exists = prev.some((m) => m.id === newMsg.id);
                if (exists) return prev;

                // Add sender info
                const senderName = newMsg.sender_id === renterId ? renterName : ownerName;
                const messageWithSender: MessageWithSender = {
                    ...newMsg,
                    sender: {
                        id: newMsg.sender_id,
                        full_name: senderName,
                    },
                };

                return [...prev, messageWithSender];
            });
        });

        return () => {
            unsubscribe();
        };
    }, [conversationId, chatEnabled, renterId, ownerId, renterName, ownerName]);

    // Auto-scroll when new messages arrive
    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    // Handle send message
    const handleSend = async () => {
        if (!newMessage.trim() || !conversationId || sending) return;

        const messageText = newMessage.trim();
        setNewMessage('');
        setSending(true);

        // Optimistic update
        const optimisticMessage: MessageWithSender = {
            id: `optimistic-${Date.now()}`,
            conversation_id: conversationId,
            sender_id: currentUserId || '',
            message_text: messageText,
            created_at: new Date().toISOString(),
            sender: {
                id: currentUserId || '',
                full_name: 'You',
            },
        };

        setMessages((prev) => [...prev, optimisticMessage]);

        try {
            const sentMessage = await sendMessage(conversationId, messageText);

            // Replace optimistic message with real one
            setMessages((prev) =>
                prev.map((m) =>
                    m.id === optimisticMessage.id
                        ? {
                            ...sentMessage,
                            sender: optimisticMessage.sender,
                        }
                        : m
                )
            );
        } catch (err) {
            console.error('Error sending message:', err);
            // Remove optimistic message on error
            setMessages((prev) => prev.filter((m) => m.id !== optimisticMessage.id));
            setNewMessage(messageText); // Restore the message
        } finally {
            setSending(false);
            inputRef.current?.focus();
        }
    };

    // Handle enter key
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // Chat disabled state
    if (!chatEnabled) {
        return (
            <Card className="bg-card/50 border-border/50">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        Chat
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8">
                        <div className="w-14 h-14 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
                            <svg className="w-7 h-7 text-muted-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Chat is available once the booking is approved.
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Loading state
    if (loading) {
        return (
            <Card className="bg-card/50 border-border/50">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        Chat
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        <Skeleton className="h-10 w-2/3" />
                        <Skeleton className="h-10 w-1/2 ml-auto" />
                        <Skeleton className="h-10 w-3/4" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Error state
    if (error) {
        return (
            <Card className="bg-red-500/10 border-red-500/20">
                <CardContent className="py-8 text-center">
                    <p className="text-sm text-red-400">{error}</p>
                    <Button
                        variant="outline"
                        size="sm"
                        className="mt-3"
                        onClick={() => window.location.reload()}
                    >
                        Try Again
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-3 border-b border-border/50">
                <CardTitle className="text-base flex items-center gap-2">
                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Chat
                    <span className="text-xs text-muted-foreground font-normal">
                        ({messages.length} message{messages.length !== 1 ? 's' : ''})
                    </span>
                </CardTitle>
            </CardHeader>

            <CardContent className="p-0">
                {/* Messages area */}
                <div className="h-64 overflow-y-auto p-4 space-y-3">
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                No messages yet. Start the conversation!
                            </p>
                        </div>
                    ) : (
                        <AnimatePresence>
                            {messages.map((msg) => (
                                <ChatMessage
                                    key={msg.id}
                                    message={msg.message_text}
                                    senderName={msg.sender?.full_name || 'Unknown'}
                                    timestamp={msg.created_at}
                                    isOwn={msg.sender_id === currentUserId}
                                    isOptimistic={msg.id.startsWith('optimistic-')}
                                    isRead={!!msg.read_at}
                                />
                            ))}
                        </AnimatePresence>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input area */}
                <div className="border-t border-border/50 p-3">
                    <div className="flex gap-2">
                        <Input
                            ref={inputRef}
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Type a message..."
                            disabled={sending}
                            className="flex-1"
                        />
                        <Button
                            onClick={handleSend}
                            disabled={!newMessage.trim() || sending}
                            size="icon"
                            className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                        >
                            {sending ? (
                                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                            ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                            )}
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
