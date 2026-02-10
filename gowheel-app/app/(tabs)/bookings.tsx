import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity, Image,
    RefreshControl, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Colors, Spacing, FontSize, Radius, cardShadow } from '@/lib/theme';
import { Ionicons } from '@expo/vector-icons';
import { getRenterBookings, getOwnerBookingRequests } from '@/services/bookingService';
import { BookingWithDetails, BookingStatus, PaymentStatus } from '@/types/booking';
import { format } from 'date-fns';

const statusConfig: Record<BookingStatus, { color: string; icon: string; label: string }> = {
    requested: { color: Colors.warning, icon: 'time', label: 'Requested' },
    approved: { color: Colors.info, icon: 'checkmark-circle', label: 'Approved' },
    confirmed: { color: Colors.success, icon: 'checkmark-done-circle', label: 'Confirmed' },
    rejected: { color: Colors.error, icon: 'close-circle', label: 'Rejected' },
    cancelled: { color: Colors.textMuted, icon: 'ban', label: 'Cancelled' },
};

export default function BookingsScreen() {
    const { profile } = useAuth();
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

    const renderBookingCard = ({ item }: { item: BookingWithDetails }) => {
        const sc = statusConfig[item.status];
        const primaryImage = item.vehicle?.images?.[0];
        const start = format(new Date(item.start_date), 'MMM dd');
        const end = format(new Date(item.end_date), 'MMM dd, yyyy');

        return (
            <TouchableOpacity
                style={styles.bookingCard}
                onPress={() => router.push(`/bookings/${item.id}`)}
                activeOpacity={0.85}
            >
                <View style={styles.cardTop}>
                    {primaryImage ? (
                        <Image source={{ uri: primaryImage.image_url }} style={styles.thumbnail} />
                    ) : (
                        <View style={[styles.thumbnail, styles.noImage]}>
                            <Ionicons name="car" size={24} color={Colors.textMuted} />
                        </View>
                    )}
                    <View style={styles.cardInfo}>
                        <Text style={styles.vehicleTitle} numberOfLines={1}>{item.vehicle?.title || 'Vehicle'}</Text>
                        <Text style={styles.brandModel}>{item.vehicle?.brand} {item.vehicle?.model}</Text>
                        <View style={styles.dateRow}>
                            <Ionicons name="calendar-outline" size={14} color={Colors.textMuted} />
                            <Text style={styles.dateText}>{start} → {end}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.cardBottom}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flexWrap: 'wrap' }}>
                        <View style={[styles.statusBadge, { backgroundColor: `${sc.color}20`, borderColor: sc.color }]}>
                            <Ionicons name={sc.icon as any} size={14} color={sc.color} />
                            <Text style={[styles.statusText, { color: sc.color }]}>{sc.label}</Text>
                        </View>
                        {item.ride_status && item.ride_status !== 'pending' && (
                            <View style={[styles.statusBadge, {
                                backgroundColor: item.ride_status === 'completed' ? `${Colors.success}20` : `${Colors.info}20`,
                                borderColor: item.ride_status === 'completed' ? Colors.success : Colors.info,
                            }]}>
                                <Text style={[styles.statusText, {
                                    color: item.ride_status === 'completed' ? Colors.success : Colors.info,
                                }]}>
                                    {item.ride_status === 'photos_uploaded' ? '📸 Photos' :
                                        item.ride_status === 'started' ? '🏍️ Riding' : '✅ Done'}
                                </Text>
                            </View>
                        )}
                    </View>
                    <Text style={styles.amount}>₹{item.total_amount.toLocaleString()}</Text>
                </View>

                {/* Person info */}
                <View style={styles.personRow}>
                    <Ionicons name="person-outline" size={14} color={Colors.textMuted} />
                    <Text style={styles.personText}>
                        {isOwner ? `Renter: ${item.renter?.full_name || 'Unknown'}` : `Owner: ${item.owner?.full_name || 'Unknown'}`}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    const filters: ('all' | BookingStatus)[] = ['all', 'requested', 'approved', 'confirmed', 'rejected', 'cancelled'];

    return (
        <View style={styles.container}>
            {/* Filter chips */}
            <View style={styles.filterBar}>
                <FlatList
                    horizontal
                    data={filters}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={[styles.filterChip, filterStatus === item && styles.filterChipActive]}
                            onPress={() => setFilterStatus(item)}
                        >
                            <Text style={[styles.filterText, filterStatus === item && styles.filterTextActive]}>
                                {item === 'all' ? 'All' : statusConfig[item].label}
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
                <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>
            ) : filtered.length === 0 ? (
                <View style={styles.center}>
                    <Ionicons name="document-text-outline" size={60} color={Colors.textMuted} />
                    <Text style={styles.emptyText}>No bookings found</Text>
                </View>
            ) : (
                <FlatList
                    data={filtered}
                    renderItem={renderBookingCard}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    filterBar: { backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border, paddingVertical: Spacing.sm },
    filterScroll: { paddingHorizontal: Spacing.lg, gap: Spacing.sm },
    filterChip: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border },
    filterChipActive: { borderColor: Colors.primary, backgroundColor: 'rgba(16, 185, 129, 0.12)' },
    filterText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '500' },
    filterTextActive: { color: Colors.primary },
    list: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: 30 },
    bookingCard: { backgroundColor: Colors.card, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, padding: Spacing.lg, marginBottom: Spacing.md, ...cardShadow },
    cardTop: { flexDirection: 'row', marginBottom: Spacing.md },
    thumbnail: { width: 80, height: 60, borderRadius: Radius.md },
    noImage: { backgroundColor: Colors.surface, justifyContent: 'center', alignItems: 'center' },
    cardInfo: { flex: 1, marginLeft: Spacing.md },
    vehicleTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text },
    brandModel: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
    dateRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: Spacing.xs },
    dateText: { fontSize: FontSize.xs, color: Colors.textMuted },
    cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: Radius.full, borderWidth: 1 },
    statusText: { fontSize: FontSize.xs, fontWeight: '600' },
    amount: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.primary },
    personRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: Spacing.sm, paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border },
    personText: { fontSize: FontSize.xs, color: Colors.textSecondary },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 80 },
    emptyText: { color: Colors.textMuted, fontSize: FontSize.md, marginTop: Spacing.md },
});
