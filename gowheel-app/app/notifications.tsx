import React, { useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    RefreshControl, ActivityIndicator,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useNotifications } from '@/contexts/NotificationContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Spacing, FontSize, Radius } from '@/lib/theme';
import { Ionicons } from '@expo/vector-icons';
import { AppNotification } from '@/services/notificationService';
import { format } from 'date-fns';

const ICON_MAP: Record<string, { icon: string; color: string }> = {
    booking_request: { icon: 'calendar-outline', color: '#f59e0b' },
    booking_approved: { icon: 'checkmark-circle', color: '#22c55e' },
    booking_rejected: { icon: 'close-circle', color: '#ef4444' },
    ride_started: { icon: 'car-sport', color: '#3b82f6' },
    ride_completed: { icon: 'flag', color: '#8b5cf6' },
    payment_received: { icon: 'cash', color: '#10b981' },
    general: { icon: 'notifications', color: '#6b7280' },
};

export default function NotificationsScreen() {
    const { notifications, unreadCount, loading, refresh, markAsRead, markAllAsRead } = useNotifications();
    const { colors } = useTheme();
    const router = useRouter();

    const handlePress = useCallback(async (notification: AppNotification) => {
        if (!notification.read) {
            await markAsRead(notification.id);
        }
        // Navigate to relevant screen if booking_id exists
        if (notification.data?.booking_id) {
            router.push(`/bookings/${notification.data.booking_id}`);
        }
    }, [markAsRead, router]);

    const renderItem = useCallback(({ item }: { item: AppNotification }) => {
        const config = ICON_MAP[item.type] || ICON_MAP.general;
        const timeAgo = format(new Date(item.created_at), 'MMM d, h:mm a');

        return (
            <TouchableOpacity
                style={[
                    styles.notifCard,
                    {
                        backgroundColor: item.read ? colors.card : `${colors.primary}10`,
                        borderColor: item.read ? colors.border : `${colors.primary}30`,
                    },
                ]}
                onPress={() => handlePress(item)}
                activeOpacity={0.7}
            >
                <View style={[styles.iconWrap, { backgroundColor: `${config.color}20` }]}>
                    <Ionicons name={config.icon as any} size={22} color={config.color} />
                </View>
                <View style={styles.content}>
                    <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
                        {item.title}
                    </Text>
                    <Text style={[styles.body, { color: colors.textSecondary }]} numberOfLines={2}>
                        {item.body}
                    </Text>
                    <Text style={[styles.time, { color: colors.textMuted }]}>{timeAgo}</Text>
                </View>
                {!item.read && <View style={[styles.dot, { backgroundColor: colors.primary }]} />}
            </TouchableOpacity>
        );
    }, [colors, handlePress]);

    return (
        <>
            <Stack.Screen
                options={{
                    title: 'Notifications',
                    headerStyle: { backgroundColor: colors.background },
                    headerTintColor: colors.text,
                    headerRight: () =>
                        unreadCount > 0 ? (
                            <TouchableOpacity onPress={markAllAsRead} style={{ marginRight: Spacing.lg }}>
                                <Text style={{ color: colors.primary, fontWeight: '600', fontSize: FontSize.sm }}>
                                    Mark all read
                                </Text>
                            </TouchableOpacity>
                        ) : null,
                }}
            />
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                {loading && notifications.length === 0 ? (
                    <View style={styles.center}>
                        <ActivityIndicator size="large" color={colors.primary} />
                    </View>
                ) : notifications.length === 0 ? (
                    <View style={styles.center}>
                        <Ionicons name="notifications-off-outline" size={64} color={colors.textMuted} />
                        <Text style={[styles.emptyTitle, { color: colors.text }]}>No notifications yet</Text>
                        <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
                            You'll see booking updates and ride alerts here
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        data={notifications}
                        renderItem={renderItem}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.list}
                        refreshControl={
                            <RefreshControl
                                refreshing={loading}
                                onRefresh={refresh}
                                tintColor={colors.primary}
                            />
                        }
                    />
                )}
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.xxxl },
    list: { padding: Spacing.lg },
    notifCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.lg,
        borderRadius: Radius.lg,
        borderWidth: 1,
        marginBottom: Spacing.sm,
    },
    iconWrap: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: { flex: 1, marginLeft: Spacing.md },
    title: { fontSize: FontSize.md, fontWeight: '600' },
    body: { fontSize: FontSize.sm, marginTop: 2, lineHeight: 18 },
    time: { fontSize: FontSize.xs, marginTop: 4 },
    dot: { width: 10, height: 10, borderRadius: 5, marginLeft: Spacing.sm },
    emptyTitle: { fontSize: FontSize.xl, fontWeight: '700', marginTop: Spacing.xl },
    emptyDesc: { fontSize: FontSize.md, textAlign: 'center', marginTop: Spacing.sm },
});
