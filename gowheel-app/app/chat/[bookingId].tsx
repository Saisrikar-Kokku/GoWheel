import React, { useEffect, useState, useRef } from 'react';
import {
    View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
    KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Colors, Spacing, FontSize, Radius } from '@/lib/theme';
import { Ionicons } from '@expo/vector-icons';
import { getOrCreateConversation, getMessages, sendMessage, subscribeToMessages, markMessagesAsRead } from '@/services/chatService';
import { MessageWithSender, Message } from '@/types/chat';
import { format } from 'date-fns';

export default function ChatScreen() {
    const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
    const { user, profile } = useAuth();
    const flatListRef = useRef<FlatList>(null);

    const [messages, setMessages] = useState<MessageWithSender[]>([]);
    const [messageText, setMessageText] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [conversationId, setConversationId] = useState<string | null>(null);

    useEffect(() => {
        const init = async () => {
            if (!bookingId || !user) return;

            try {
                // Get booking to find renter/owner IDs
                const { supabase } = await import('@/lib/supabase');
                const { data: booking } = await supabase.from('bookings').select('renter_id, owner_id').eq('id', bookingId).single();
                if (!booking) return;

                const conversation = await getOrCreateConversation(bookingId, booking.renter_id, booking.owner_id);
                setConversationId(conversation.id);

                const msgs = await getMessages(conversation.id);
                setMessages(msgs);
                setLoading(false);

                await markMessagesAsRead(conversation.id);

                // Subscribe to new messages
                const unsubscribe = subscribeToMessages(conversation.id, (newMsg: Message) => {
                    setMessages(prev => {
                        if (prev.find(m => m.id === newMsg.id)) return prev;
                        return [...prev, { ...newMsg, sender: { id: newMsg.sender_id, full_name: newMsg.sender_id === user.id ? (profile?.full_name || 'You') : 'Other' } }];
                    });
                    markMessagesAsRead(conversation.id);
                });

                return () => { unsubscribe(); };
            } catch (e) {
                console.error('Chat init error:', e);
                setLoading(false);
            }
        };

        init();
    }, [bookingId, user]);

    useEffect(() => {
        if (messages.length > 0) {
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 200);
        }
    }, [messages]);

    const handleSend = async () => {
        if (!messageText.trim() || !conversationId || sending) return;
        const text = messageText.trim();
        setMessageText('');
        setSending(true);

        try {
            await sendMessage(conversationId, text);
        } catch (e) {
            setMessageText(text);
            console.error('Send error:', e);
        }
        setSending(false);
    };

    const isMe = (senderId: string) => senderId === user?.id;

    const renderMessage = ({ item, index }: { item: MessageWithSender; index: number }) => {
        const mine = isMe(item.sender_id);
        const showDate = index === 0 || format(new Date(messages[index - 1].created_at), 'yyyy-MM-dd') !== format(new Date(item.created_at), 'yyyy-MM-dd');

        return (
            <>
                {showDate && (
                    <View style={styles.dateDivider}>
                        <Text style={styles.dateText}>{format(new Date(item.created_at), 'MMMM dd, yyyy')}</Text>
                    </View>
                )}
                <View style={[styles.messageBubble, mine ? styles.myMessage : styles.otherMessage]}>
                    {!mine && <Text style={styles.senderName}>{item.sender?.full_name}</Text>}
                    <Text style={[styles.messageText, mine ? styles.myMessageText : styles.otherMessageText]}>{item.message_text}</Text>
                    <Text style={[styles.messageTime, mine ? styles.myTimeText : styles.otherTimeText]}>{format(new Date(item.created_at), 'HH:mm')}</Text>
                </View>
            </>
        );
    };

    return (
        <>
            <Stack.Screen options={{ title: 'Chat', headerStyle: { backgroundColor: Colors.background }, headerTintColor: Colors.text }} />
            <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
                {loading ? (
                    <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>
                ) : (
                    <FlatList
                        ref={flatListRef}
                        data={messages}
                        renderItem={renderMessage}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.messageList}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={
                            <View style={styles.emptyChat}>
                                <Ionicons name="chatbubble-outline" size={60} color={Colors.textMuted} />
                                <Text style={styles.emptyChatText}>No messages yet</Text>
                                <Text style={styles.emptyChatSub}>Say hello! 👋</Text>
                            </View>
                        }
                    />
                )}

                {/* Input Bar */}
                <View style={styles.inputBar}>
                    <TextInput
                        style={styles.input}
                        placeholder="Type a message..."
                        placeholderTextColor={Colors.textMuted}
                        value={messageText}
                        onChangeText={setMessageText}
                        multiline
                        maxLength={500}
                    />
                    <TouchableOpacity
                        style={[styles.sendButton, !messageText.trim() && styles.sendDisabled]}
                        onPress={handleSend}
                        disabled={!messageText.trim() || sending}
                    >
                        <Ionicons name="send" size={20} color={messageText.trim() ? Colors.white : Colors.textMuted} />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    messageList: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.md, flexGrow: 1 },
    dateDivider: { alignItems: 'center', marginVertical: Spacing.lg },
    dateText: { fontSize: FontSize.xs, color: Colors.textMuted, backgroundColor: Colors.surface, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: Radius.full },
    messageBubble: { maxWidth: '78%', padding: Spacing.md, borderRadius: Radius.lg, marginBottom: Spacing.sm },
    myMessage: { alignSelf: 'flex-end', backgroundColor: Colors.primary, borderBottomRightRadius: 4 },
    otherMessage: { alignSelf: 'flex-start', backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, borderBottomLeftRadius: 4 },
    senderName: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: '600', marginBottom: 2 },
    messageText: { fontSize: FontSize.md, lineHeight: 20 },
    myMessageText: { color: Colors.white },
    otherMessageText: { color: Colors.text },
    messageTime: { fontSize: FontSize.xs, marginTop: 4, alignSelf: 'flex-end' },
    myTimeText: { color: 'rgba(255,255,255,0.7)' },
    otherTimeText: { color: Colors.textMuted },
    emptyChat: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },
    emptyChatText: { color: Colors.textMuted, fontSize: FontSize.lg, marginTop: Spacing.md },
    emptyChatSub: { color: Colors.textMuted, fontSize: FontSize.sm, marginTop: Spacing.xs },
    inputBar: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, backgroundColor: Colors.card, borderTopWidth: 1, borderTopColor: Colors.border },
    input: { flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.xl, paddingHorizontal: Spacing.lg, paddingVertical: 10, color: Colors.text, fontSize: FontSize.md, maxHeight: 100, borderWidth: 1, borderColor: Colors.border },
    sendButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', marginLeft: Spacing.sm },
    sendDisabled: { backgroundColor: Colors.surface },
});
