// Chat service for realtime messaging

import { createBrowserClient } from '@supabase/ssr';
import { Conversation, Message, MessageWithSender } from '@/types/chat';

const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ================================
// CONVERSATION FUNCTIONS
// ================================

/**
 * Get or create a conversation for a booking
 * Each booking has exactly one conversation
 */
export async function getOrCreateConversation(
    bookingId: string,
    renterId: string,
    ownerId: string
): Promise<Conversation> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // First, try to get existing conversation
    const { data: existing, error: fetchError } = await supabase
        .from('conversations')
        .select('*')
        .eq('booking_id', bookingId)
        .single();

    if (existing) {
        return existing;
    }

    // If no conversation exists, create one
    if (fetchError && fetchError.code === 'PGRST116') {
        const { data: newConversation, error: createError } = await supabase
            .from('conversations')
            .insert({
                booking_id: bookingId,
                renter_id: renterId,
                owner_id: ownerId,
            })
            .select()
            .single();

        if (createError) {
            console.error('Error creating conversation:', createError);
            throw createError;
        }

        return newConversation;
    }

    if (fetchError) {
        console.error('Error fetching conversation:', fetchError);
        throw fetchError;
    }

    throw new Error('Unexpected state in getOrCreateConversation');
}

/**
 * Get conversation by booking ID
 */
export async function getConversationByBookingId(bookingId: string): Promise<Conversation | null> {
    const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('booking_id', bookingId)
        .single();

    if (error && error.code === 'PGRST116') {
        return null; // No conversation exists yet
    }

    if (error) {
        console.error('Error fetching conversation:', error);
        throw error;
    }

    return data;
}

// ================================
// MESSAGE FUNCTIONS
// ================================

/**
 * Get all messages for a conversation
 */
export async function getMessages(conversationId: string): Promise<MessageWithSender[]> {
    const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching messages:', error);
        throw error;
    }

    // Fetch sender details for each message
    const messagesWithSenders = await Promise.all(
        (messages || []).map(async (message) => {
            const { data: sender } = await supabase
                .from('profiles')
                .select('id, full_name')
                .eq('id', message.sender_id)
                .single();

            return {
                ...message,
                sender: sender || undefined,
            } as MessageWithSender;
        })
    );

    return messagesWithSenders;
}

/**
 * Send a new message
 */
export async function sendMessage(
    conversationId: string,
    messageText: string
): Promise<Message> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
        .from('messages')
        .insert({
            conversation_id: conversationId,
            sender_id: user.id,
            message_text: messageText.trim(),
        })
        .select()
        .single();

    if (error) {
        console.error('Error sending message:', error);
        throw error;
    }

    return data;
}

// ================================
// REALTIME SUBSCRIPTION
// ================================

/**
 * Subscribe to new messages in a conversation
 * Returns an unsubscribe function
 */
export function subscribeToMessages(
    conversationId: string,
    onNewMessage: (message: Message) => void
): () => void {
    const channel = supabase
        .channel(`messages:${conversationId}`)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `conversation_id=eq.${conversationId}`,
            },
            (payload) => {
                onNewMessage(payload.new as Message);
            }
        )
        .subscribe();

    // Return unsubscribe function
    return () => {
        supabase.removeChannel(channel);
    };
}

/**
 * Get current user ID
 */
export async function getCurrentUserId(): Promise<string | null> {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
}

// ================================
// UNREAD MESSAGE FUNCTIONS
// ================================

/**
 * Get total unread message count for current user
 */
export async function getUnreadMessageCount(): Promise<number> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    // Get all conversations where user is a participant
    const { data: conversations, error: convError } = await supabase
        .from('conversations')
        .select('id')
        .or(`renter_id.eq.${user.id},owner_id.eq.${user.id}`);

    if (convError || !conversations || conversations.length === 0) {
        return 0;
    }

    const conversationIds = conversations.map(c => c.id);

    // Count unread messages (not sent by current user, and not read)
    const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .in('conversation_id', conversationIds)
        .neq('sender_id', user.id)
        .is('read_at', null);

    if (error) {
        console.error('Error getting unread count:', error);
        return 0;
    }

    return count || 0;
}

/**
 * Mark all messages in a conversation as read (for messages not sent by current user)
 */
export async function markMessagesAsRead(conversationId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .neq('sender_id', user.id)
        .is('read_at', null);

    if (error) {
        console.error('Error marking messages as read:', error);
    }
}

/**
 * Subscribe to all new messages for current user (for notification bell)
 * Returns an unsubscribe function
 */
export function subscribeToAllMessages(
    userId: string,
    onNewMessage: (message: Message) => void
): () => void {
    const channel = supabase
        .channel(`user-messages:${userId}`)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
            },
            (payload) => {
                const message = payload.new as Message;
                // Only notify if the message is NOT from the current user
                if (message.sender_id !== userId) {
                    onNewMessage(message);
                }
            }
        )
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
}

