// Chat service — mirrors the website's chatService.ts

import { supabase } from '@/lib/supabase';
import { Conversation, Message, MessageWithSender } from '@/types/chat';

export async function getOrCreateConversation(bookingId: string, renterId: string, ownerId: string): Promise<Conversation> {
    const { data: existing } = await supabase.from('conversations').select('*').eq('booking_id', bookingId).single();
    if (existing) return existing;

    const { data: newConversation, error } = await supabase
        .from('conversations')
        .insert({ booking_id: bookingId, renter_id: renterId, owner_id: ownerId })
        .select()
        .single();

    if (error) throw error;
    return newConversation;
}

export async function getMessages(conversationId: string): Promise<MessageWithSender[]> {
    const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

    if (error) throw error;

    return Promise.all(
        (messages || []).map(async (message) => {
            const { data: sender } = await supabase.from('profiles').select('id, full_name').eq('id', message.sender_id).single();
            return { ...message, sender: sender || undefined } as MessageWithSender;
        })
    );
}

export async function sendMessage(conversationId: string, messageText: string): Promise<Message> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
        .from('messages')
        .insert({ conversation_id: conversationId, sender_id: user.id, message_text: messageText.trim() })
        .select()
        .single();

    if (error) throw error;
    return data;
}

export function subscribeToMessages(conversationId: string, onNewMessage: (message: Message) => void): () => void {
    const channel = supabase
        .channel(`messages:${conversationId}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` }, (payload) => {
            onNewMessage(payload.new as Message);
        })
        .subscribe();

    return () => { supabase.removeChannel(channel); };
}

export async function getUnreadMessageCount(): Promise<number> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    const { data: conversations } = await supabase.from('conversations').select('id').or(`renter_id.eq.${user.id},owner_id.eq.${user.id}`);
    if (!conversations || conversations.length === 0) return 0;

    const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .in('conversation_id', conversations.map(c => c.id))
        .neq('sender_id', user.id)
        .is('read_at', null);

    if (error) return 0;
    return count || 0;
}

export async function markMessagesAsRead(conversationId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .neq('sender_id', user.id)
        .is('read_at', null);
}
