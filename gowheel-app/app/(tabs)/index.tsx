import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Colors, Spacing, FontSize, Radius, cardShadow } from '@/lib/theme';
import { Ionicons } from '@expo/vector-icons';
import { getOwnerBookingCounts, getRenterStats, getRenterBookings } from '@/services/bookingService';
import { getOwnerVehicles } from '@/services/vehicleService';
import { BookingWithDetails } from '@/types/booking';

export default function HomeScreen() {
    const { profile, user } = useAuth();
    const router = useRouter();
    const isOwner = profile?.role === 'owner';
    const isAdmin = profile?.role === 'admin';
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState({ pending: 0, approved: 0, total: 0, vehicles: 0, active: 0, upcoming: 0, completed: 0 });
    const [recentBookings, setRecentBookings] = useState<BookingWithDetails[]>([]);

    const loadStats = async () => {
        try {
            if (isOwner) {
                const counts = await getOwnerBookingCounts();
                const vehicles = await getOwnerVehicles();
                setStats({ ...stats, ...counts, vehicles: vehicles.length });
            } else if (!isAdmin) {
                // Renter Stats
                const renterStats = await getRenterStats();
                setStats({ ...stats, ...renterStats });
                const bookings = await getRenterBookings();
                setRecentBookings(bookings.slice(0, 3));
            }
        } catch (e) { console.error(e); }
    };

    useEffect(() => { loadStats(); }, [profile?.role]);

    const onRefresh = async () => { setRefreshing(true); await loadStats(); setRefreshing(false); };

    const greeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    const renderRecentBooking = (booking: BookingWithDetails) => (
        <TouchableOpacity key={booking.id} style={styles.recentCard} onPress={() => router.push(`/bookings/${booking.id}`)}>
            <Image source={{ uri: booking.vehicle?.images?.[0]?.image_url }} style={styles.recentThumb} />
            <View style={styles.recentInfo}>
                <Text style={styles.recentTitle}>{booking.vehicle?.title || 'Vehicle'}</Text>
                <Text style={styles.recentDate}>{new Date(booking.start_date).toLocaleDateString()} • {booking.status}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
        </TouchableOpacity>
    );

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        >
            {/* Hero Section */}
            <View style={styles.hero}>
                <Text style={styles.greeting}>{greeting()}</Text>
                <Text style={styles.userName}>{profile?.full_name || 'User'} 👋</Text>
                <Text style={styles.roleTag}>
                    {isAdmin ? '🛡️ Administrator' : isOwner ? '🚗 Vehicle Owner' : '🔑 Renter'}
                </Text>
            </View>

            {/* Quick Actions */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Quick Actions</Text>
                <View style={styles.actionsGrid}>
                    {!isOwner && (
                        <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(tabs)/vehicles')}>
                            <View style={[styles.actionIcon, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                                <Ionicons name="search" size={24} color={Colors.primary} />
                            </View>
                            <Text style={styles.actionLabel}>Browse</Text>
                            <Text style={styles.actionDesc}>Find vehicles</Text>
                        </TouchableOpacity>
                    )}
                    {isOwner && (
                        <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/vehicles/add')}>
                            <View style={[styles.actionIcon, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                                <Ionicons name="add-circle" size={24} color={Colors.info} />
                            </View>
                            <Text style={styles.actionLabel}>Add Vehicle</Text>
                            <Text style={styles.actionDesc}>List yours</Text>
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(tabs)/bookings')}>
                        <View style={[styles.actionIcon, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                            <Ionicons name="calendar" size={24} color={Colors.warning} />
                        </View>
                        <Text style={styles.actionLabel}>Bookings</Text>
                        <Text style={styles.actionDesc}>{isOwner ? 'Manage' : 'My trips'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(tabs)/profile')}>
                        <View style={[styles.actionIcon, { backgroundColor: 'rgba(139, 92, 246, 0.15)' }]}>
                            <Ionicons name="person" size={24} color="#8b5cf6" />
                        </View>
                        <Text style={styles.actionLabel}>Profile</Text>
                        <Text style={styles.actionDesc}>Settings</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Owner Stats */}
            {isOwner && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Dashboard</Text>
                    <View style={styles.statsGrid}>
                        <View style={[styles.statCard, { borderLeftColor: Colors.warning }]}>
                            <Text style={styles.statNumber}>{stats.pending}</Text>
                            <Text style={styles.statLabel}>Pending</Text>
                        </View>
                        <View style={[styles.statCard, { borderLeftColor: Colors.primary }]}>
                            <Text style={styles.statNumber}>{stats.approved}</Text>
                            <Text style={styles.statLabel}>Approved</Text>
                        </View>
                        <View style={[styles.statCard, { borderLeftColor: Colors.info }]}>
                            <Text style={styles.statNumber}>{stats.vehicles}</Text>
                            <Text style={styles.statLabel}>Vehicles</Text>
                        </View>
                        <View style={[styles.statCard, { borderLeftColor: '#8b5cf6' }]}>
                            <Text style={styles.statNumber}>{stats.total}</Text>
                            <Text style={styles.statLabel}>Total</Text>
                        </View>
                    </View>
                </View>
            )}

            {/* Renter Stats & Activity */}
            {!isOwner && !isAdmin && (
                <>
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>My Activity</Text>
                        <View style={styles.statsGrid}>
                            <View style={[styles.statCard, { borderLeftColor: Colors.primary }]}>
                                <Text style={styles.statNumber}>{stats.active}</Text>
                                <Text style={styles.statLabel}>Active</Text>
                            </View>
                            <View style={[styles.statCard, { borderLeftColor: Colors.info }]}>
                                <Text style={styles.statNumber}>{stats.upcoming}</Text>
                                <Text style={styles.statLabel}>Upcoming</Text>
                            </View>
                            <View style={[styles.statCard, { borderLeftColor: Colors.success }]}>
                                <Text style={styles.statNumber}>{stats.completed}</Text>
                                <Text style={styles.statLabel}>Completed</Text>
                            </View>
                        </View>
                    </View>

                    {recentBookings.length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Recent Bookings</Text>
                            {recentBookings.map(renderRecentBooking)}
                        </View>
                    )}
                </>
            )}

            {/* How it Works */}
            {!isOwner && !isAdmin && recentBookings.length === 0 && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>How It Works</Text>
                    {[
                        { icon: 'search', title: 'Find a Vehicle', desc: 'Browse cars and bikes near you', color: Colors.primary },
                        { icon: 'calendar', title: 'Book & Pay', desc: 'Select dates and make payment', color: Colors.info },
                        { icon: 'car', title: 'Ride & Return', desc: 'Pick up, ride, and return safely', color: '#8b5cf6' },
                    ].map((step, idx) => (
                        <View key={idx} style={styles.stepCard}>
                            <View style={[styles.stepNumber, { backgroundColor: step.color }]}>
                                <Text style={styles.stepNumberText}>{idx + 1}</Text>
                            </View>
                            <View style={styles.stepContent}>
                                <Text style={styles.stepTitle}>{step.title}</Text>
                                <Text style={styles.stepDesc}>{step.desc}</Text>
                            </View>
                        </View>
                    ))}
                </View>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    content: { paddingBottom: 40 },
    hero: {
        paddingHorizontal: Spacing.xl, paddingTop: Spacing.xxl, paddingBottom: Spacing.xl,
        backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border,
    },
    greeting: { fontSize: FontSize.md, color: Colors.textSecondary },
    userName: { fontSize: FontSize.xxxl, fontWeight: '800', color: Colors.text, marginTop: Spacing.xs },
    roleTag: { fontSize: FontSize.sm, color: Colors.primary, marginTop: Spacing.sm, fontWeight: '500' },
    section: { paddingHorizontal: Spacing.xl, marginTop: Spacing.xxl },
    sectionTitle: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.text, marginBottom: Spacing.lg },
    actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
    actionCard: {
        flexBasis: '47%', backgroundColor: Colors.card, borderRadius: Radius.lg, borderWidth: 1,
        borderColor: Colors.border, padding: Spacing.lg, ...cardShadow,
    },
    actionIcon: { width: 48, height: 48, borderRadius: Radius.md, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.md },
    actionLabel: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text },
    actionDesc: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
    statCard: {
        flexBasis: '47%', backgroundColor: Colors.card, borderRadius: Radius.lg, borderWidth: 1,
        borderColor: Colors.border, borderLeftWidth: 4, padding: Spacing.lg, ...cardShadow,
    },
    statNumber: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.text },
    statLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: Spacing.xs },
    stepCard: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card,
        borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border,
        padding: Spacing.lg, marginBottom: Spacing.md,
    },
    stepNumber: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    stepNumberText: { color: Colors.white, fontWeight: '700', fontSize: FontSize.md },
    stepContent: { marginLeft: Spacing.lg, flex: 1 },
    stepTitle: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text },
    stepDesc: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
    recentCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, padding: Spacing.md, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.sm },
    recentThumb: { width: 48, height: 48, borderRadius: Radius.md, marginRight: Spacing.md, backgroundColor: Colors.surface },
    recentInfo: { flex: 1 },
    recentTitle: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text },
    recentDate: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
});
