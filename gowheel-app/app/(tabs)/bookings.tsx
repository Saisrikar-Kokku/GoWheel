import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity, Image,
    RefreshControl, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Spacing, FontSize, Radius } from '@/lib/theme';
import { Ionicons } from '@expo/vector-icons';
import { getRenterBookings, getOwnerBookingRequests } from '@/services/bookingService';
import { BookingWithDetails, BookingStatus } from '@/types/booking';
import { format } from 'date-fns';

const STATUS_META: Record<BookingStatus, { icon: string; label: string }> = {
    requested: { icon: 'time', label: 'Requested' },
    approved: { icon: 'checkmark-circle', label: 'Approved' },
    confirmed: { icon: 'checkmark-done-circle', label: 'Confirmed' },
    rejected: { icon: 'close-circle', label: 'Rejected' },
    cancelled: { icon: 'ban', label: 'Cancelled' },
};

export default function BookingsScreen() {
    const { profile } = useAuth();
    const { colors, shadow } = useTheme();
    const router = useRouter();
    const isOwner = profile?.role === 'owner';

    const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filterStatus, setFilterStatus] = useState<'all' | BookingStatus>('all');

    const loadBookings = useCallback(async () => {
        try {
            const data = isOwner ? await getOwnerBookingRequests() : await getRenterBookings();
            setBookings(data);
        } catch (e) { console.error(e); }
        setLoading(false);
    }, [isOwner]);

    useEffect(() => { setLoading(true); loadBookings(); }, [loadBookings]);
    const onRefresh = async () => { setRefreshing(true); await loadBookings(); setRefreshing(false); };

    const filtered = filterStatus === 'all' ? bookings : bookings.filter(b => b.status === filterStatus);

    const getStatusColor = (status: BookingStatus) => {
        const colorMap: Record<BookingStatus, string> = {
            requested: colors.warning,
            approved: colors.info,
            confirmed: colors.success,
            rejected: colors.error,
            cancelled: colors.textMuted,
        };
        return colorMap[status];
    };

    const renderBookingCard = ({ item }: { item: BookingWithDetails }) => {
        const meta = STATUS_META[item.status];
        const sc = getStatusColor(item.status);
        const primaryImage = item.vehicle?.images?.[0];
        const start = format(new Date(item.start_date), 'MMM dd');
        const end = format(new Date(item.end_date), 'MMM dd, yyyy');

        return (
            <TouchableOpacity
                style={[styles.bookingCard, { backgroundColor: colors.card, borderColor: colors.border, ...shadow }]}
                onPress={() => router.push(`/bookings/${item.id}`)}
                activeOpacity={0.85}
            >
                <View style={styles.cardTop}>
                    {primaryImage ? (
                        <Image source={{ uri: primaryImage.image_url }} style={styles.thumbnail} />
                    ) : (
                        <View style={[styles.thumbnail, styles.noImage, { backgroundColor: colors.surface }]}>
                            <Ionicons name="car" size={24} color={colors.textMuted} />
                        </View>
                    )}
                    <View style={styles.cardInfo}>
                        <Text style={[styles.vehicleTitle, { color: colors.text }]} numberOfLines={1}>
                            {item.vehicle?.title || 'Vehicle'}
                        </Text>
                        <Text style={[styles.brandModel, { color: colors.textSecondary }]}>
                            {item.vehicle?.brand} {item.vehicle?.model}
                        </Text>
                        <View style={styles.dateRow}>
                            <Ionicons name="calendar-outline" size={14} color={colors.textMuted} />
                            <Text style={[styles.dateText, { color: colors.textMuted }]}>{start} → {end}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.cardBottom}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flexWrap: 'wrap' }}>
                        <View style={[styles.statusBadge, { backgroundColor: `${sc}20`, borderColor: sc }]}>
                            <Ionicons name={meta.icon as any} size={14} color={sc} />
                            <Text style={[styles.statusText, { color: sc }]}>{meta.label}</Text>
                        </View>
                        {item.ride_status && item.ride_status !== 'pending' && (
                            <View style={[styles.statusBadge, {
                                backgroundColor: item.ride_status === 'completed' ? `${colors.success}20` : `${colors.info}20`,
                                borderColor: item.ride_status === 'completed' ? colors.success : colors.info,
                            }]}>
                                <Text style={[styles.statusText, {
                                    color: item.ride_status === 'completed' ? colors.success : colors.info,
                                }]}>
                                    {item.ride_status === 'photos_uploaded' ? '📸 Photos' :
                                        item.ride_status === 'started' ? '🏍️ Riding' : '✅ Done'}
                                </Text>
                            </View>
                        )}
                    </View>
                    <Text style={[styles.amount, { color: colors.primary }]}>₹{item.total_amount.toLocaleString()}</Text>
                </View>

                <View style={[styles.personRow, { borderTopColor: colors.border }]}>
                    <Ionicons name="person-outline" size={14} color={colors.textMuted} />
                    <Text style={[styles.personText, { color: colors.textSecondary }]}>
                        {isOwner ? `Renter: ${item.renter?.full_name || 'Unknown'}` : `Owner: ${item.owner?.full_name || 'Unknown'}`}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    const filters: ('all' | BookingStatus)[] = ['all', 'requested', 'approved', 'confirmed', 'rejected', 'cancelled'];

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.filterBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                <FlatList
                    horizontal
                    data={filters}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={[
                                styles.filterChip,
                                { borderColor: colors.border },
                                filterStatus === item && { borderColor: colors.primary, backgroundColor: `${colors.primary}15` },
                            ]}
                            onPress={() => setFilterStatus(item)}
                        >
                            <Text style={[
                                styles.filterText,
                                { color: colors.textSecondary },
                                filterStatus === item && { color: colors.primary },
                            ]}>
                                {item === 'all' ? 'All' : STATUS_META[item].label}
                                {item !== 'all' && ` (${bookings.filter(b => b.status === item).length})`}
                            </Text>
                        </TouchableOpacity>
                    )}
                    keyExtractor={item => item}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filterScroll}
                />
            </View>

            {loading ? (
                <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>
            ) : filtered.length === 0 ? (
                <View style={styles.center}>
                    <Ionicons name="document-text-outline" size={60} color={colors.textMuted} />
                    <Text style={[styles.emptyText, { color: colors.textMuted }]}>No bookings found</Text>
                </View>
            ) : (
                <FlatList
                    data={filtered}
                    renderItem={renderBookingCard}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    filterBar: { borderBottomWidth: 1, paddingVertical: Spacing.sm },
    filterScroll: { paddingHorizontal: Spacing.lg, gap: Spacing.sm },
    filterChip: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: Radius.full, borderWidth: 1 },
    filterText: { fontSize: FontSize.sm, fontWeight: '500' },
    list: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: 100 },
    bookingCard: { borderRadius: Radius.lg, borderWidth: 1, padding: Spacing.lg, marginBottom: Spacing.md },
    cardTop: { flexDirection: 'row', marginBottom: Spacing.md },
    thumbnail: { width: 80, height: 60, borderRadius: Radius.md },
    noImage: { justifyContent: 'center', alignItems: 'center' },
    cardInfo: { flex: 1, marginLeft: Spacing.md },
    vehicleTitle: { fontSize: FontSize.md, fontWeight: '700' },
    brandModel: { fontSize: FontSize.sm, marginTop: 2 },
    dateRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: Spacing.xs },
    dateText: { fontSize: FontSize.xs },
    cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: Radius.full, borderWidth: 1 },
    statusText: { fontSize: FontSize.xs, fontWeight: '600' },
    amount: { fontSize: FontSize.lg, fontWeight: '800' },
    personRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: Spacing.sm, paddingTop: Spacing.sm, borderTopWidth: 1 },
    personText: { fontSize: FontSize.xs },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 80 },
    emptyText: { fontSize: FontSize.md, marginTop: Spacing.md },
});
