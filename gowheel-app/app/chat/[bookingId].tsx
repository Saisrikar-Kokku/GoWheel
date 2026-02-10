import React, { useEffect, useState, useRef } from 'react';
import {
    View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
    KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Spacing, FontSize, Radius } from '@/lib/theme';
import { Ionicons } from '@expo/vector-icons';
import { getOrCreateConversation, getMessages, sendMessage, subscribeToMessages, markMessagesAsRead } from '@/services/chatService';
import { MessageWithSender, Message } from '@/types/chat';
import { format } from 'date-fns';

export default function ChatScreen() {
    const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
    const { user, profile } = useAuth();
    const { colors } = useTheme();
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
                const { supabase } = await import('@/lib/supabase');
                const { data: booking } = await supabase.from('bookings').select('renter_id, owner_id').eq('id', bookingId).single();
                if (!booking) return;

                const conversation = await getOrCreateConversation(bookingId, booking.renter_id, booking.owner_id);
                setConversationId(conversation.id);

                const msgs = await getMessages(conversation.id);
                setMessages(msgs);
                setLoading(false);

                await markMessagesAsRead(conversation.id);

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
                    <View style={s.dateDivider}>
                        <Text style={[s.dateText, { color: colors.textMuted, backgroundColor: colors.surface }]}>{format(new Date(item.created_at), 'MMMM dd, yyyy')}</Text>
                    </View>
                )}
                <View style={[
                    s.messageBubble,
                    mine
                        ? [s.myMessage, { backgroundColor: colors.primary }]
                        : [s.otherMessage, { backgroundColor: colors.card, borderColor: colors.border }]
                ]}>
                    {!mine && <Text style={[s.senderName, { color: colors.primary }]}>{item.sender?.full_name}</Text>}
                    <Text style={[s.messageText, mine ? { color: '#fff' } : { color: colors.text }]}>{item.message_text}</Text>
                    <Text style={[s.messageTime, mine ? { color: 'rgba(255,255,255,0.7)' } : { color: colors.textMuted }]}>{format(new Date(item.created_at), 'HH:mm')}</Text>
                </View>
            </>
        );
    };

    return (
        <>
            <Stack.Screen options={{ title: 'Chat', headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.text }} />
            <KeyboardAvoidingView style={[s.container, { backgroundColor: colors.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
                {loading ? (
                    <View style={s.center}><ActivityIndicator size="large" color={colors.primary} /></View>
                ) : (
                    <FlatList
                        ref={flatListRef}
                        data={messages}
                        renderItem={renderMessage}
                        keyExtractor={item => item.id}
                        contentContainerStyle={s.messageList}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={
                            <View style={s.emptyChat}>
                                <Ionicons name="chatbubble-outline" size={60} color={colors.textMuted} />
                                <Text style={[s.emptyChatText, { color: colors.textMuted }]}>No messages yet</Text>
                                <Text style={[s.emptyChatSub, { color: colors.textMuted }]}>Say hello! 👋</Text>
                            </View>
                        }
                    />
                )}

                {/* Input Bar */}
                <View style={[s.inputBar, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
                    <TextInput
                        style={[s.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                        placeholder="Type a message..."
                        placeholderTextColor={colors.textMuted}
                        value={messageText}
                        onChangeText={setMessageText}
                        multiline
                        maxLength={500}
                    />
                    <TouchableOpacity
                        style={[s.sendButton, { backgroundColor: messageText.trim() ? colors.primary : colors.surface }]}
                        onPress={handleSend}
                        disabled={!messageText.trim() || sending}
                    >
                        <Ionicons name="send" size={20} color={messageText.trim() ? '#fff' : colors.textMuted} />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </>
    );
}

const s = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    messageList: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.md, flexGrow: 1 },
    dateDivider: { alignItems: 'center', marginVertical: Spacing.lg },
    dateText: { fontSize: FontSize.xs, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: Radius.full },
    messageBubble: { maxWidth: '78%', padding: Spacing.md, borderRadius: Radius.lg, marginBottom: Spacing.sm },
    myMessage: { alignSelf: 'flex-end', borderBottomRightRadius: 4 },
    otherMessage: { alignSelf: 'flex-start', borderWidth: 1, borderBottomLeftRadius: 4 },
    senderName: { fontSize: FontSize.xs, fontWeight: '600', marginBottom: 2 },
    messageText: { fontSize: FontSize.md, lineHeight: 20 },
    messageTime: { fontSize: FontSize.xs, marginTop: 4, alignSelf: 'flex-end' },
    emptyChat: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },
    emptyChatText: { fontSize: FontSize.lg, marginTop: Spacing.md },
    emptyChatSub: { fontSize: FontSize.sm, marginTop: Spacing.xs },
    inputBar: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderTopWidth: 1 },
    input: { flex: 1, borderRadius: Radius.xl, paddingHorizontal: Spacing.lg, paddingVertical: 10, fontSize: FontSize.md, maxHeight: 100, borderWidth: 1 },
    sendButton: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginLeft: Spacing.sm },
});
