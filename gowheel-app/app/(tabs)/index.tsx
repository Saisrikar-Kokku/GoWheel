import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Image, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { Spacing, FontSize, Radius, cardShadow } from '@/lib/theme';
import { Ionicons } from '@expo/vector-icons';
import { getOwnerBookingCounts, getRenterStats, getRenterBookings } from '@/services/bookingService';
import { getOwnerVehicles } from '@/services/vehicleService';
import { BookingWithDetails } from '@/types/booking';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
    const { profile, user } = useAuth();
    const { colors, isDark, shadow } = useTheme();
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

    const avatarUri = profile?.avatar_url;

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: colors.background }]}
            contentContainerStyle={styles.content}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        >
            {/* ===== HERO SECTION ===== */}
            <View style={[styles.hero, { backgroundColor: isDark ? '#0f1a15' : '#ecfdf5' }]}>
                <View style={styles.heroTop}>
                    <View style={styles.heroText}>
                        <Text style={[styles.greeting, { color: colors.textSecondary }]}>{greeting()}</Text>
                        <Text style={[styles.userName, { color: colors.text }]}>
                            {profile?.full_name || 'User'} 👋
                        </Text>
                        <View style={[styles.rolePill, { backgroundColor: `${colors.primary}20` }]}>
                            <Ionicons
                                name={isAdmin ? 'shield-checkmark' : isOwner ? 'car-sport' : 'key'}
                                size={12}
                                color={colors.primary}
                            />
                            <Text style={[styles.roleText, { color: colors.primary }]}>
                                {isAdmin ? 'Administrator' : isOwner ? 'Vehicle Owner' : 'Renter'}
                            </Text>
                        </View>
                    </View>
                    <TouchableOpacity onPress={() => router.push('/(tabs)/profile')}>
                        {avatarUri ? (
                            <Image source={{ uri: avatarUri }} style={styles.heroAvatar} />
                        ) : (
                            <View style={[styles.heroAvatar, { backgroundColor: colors.primary }]}>
                                <Text style={styles.heroAvatarText}>
                                    {profile?.full_name?.charAt(0)?.toUpperCase() || '?'}
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            {/* ===== QUICK ACTIONS ===== */}
            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.actionsRow}>
                    {!isOwner && (
                        <TouchableOpacity
                            style={[styles.actionPill, { backgroundColor: colors.card, borderColor: colors.border, ...shadow }]}
                            onPress={() => router.push('/(tabs)/vehicles')}
                        >
                            <View style={[styles.actionDot, { backgroundColor: `${colors.primary}20` }]}>
                                <Ionicons name="search" size={20} color={colors.primary} />
                            </View>
                            <Text style={[styles.actionLabel, { color: colors.text }]}>Browse</Text>
                        </TouchableOpacity>
                    )}
                    {isOwner && (
                        <TouchableOpacity
                            style={[styles.actionPill, { backgroundColor: colors.card, borderColor: colors.border, ...shadow }]}
                            onPress={() => router.push('/vehicles/add')}
                        >
                            <View style={[styles.actionDot, { backgroundColor: `${colors.info}20` }]}>
                                <Ionicons name="add-circle" size={20} color={colors.info} />
                            </View>
                            <Text style={[styles.actionLabel, { color: colors.text }]}>Add Vehicle</Text>
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity
                        style={[styles.actionPill, { backgroundColor: colors.card, borderColor: colors.border, ...shadow }]}
                        onPress={() => router.push('/(tabs)/bookings')}
                    >
                        <View style={[styles.actionDot, { backgroundColor: `${colors.warning}20` }]}>
                            <Ionicons name="receipt" size={20} color={colors.warning} />
                        </View>
                        <Text style={[styles.actionLabel, { color: colors.text }]}>Bookings</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionPill, { backgroundColor: colors.card, borderColor: colors.border, ...shadow }]}
                        onPress={() => router.push('/notifications')}
                    >
                        <View style={[styles.actionDot, { backgroundColor: `${colors.completed}20` }]}>
                            <Ionicons name="notifications" size={20} color={colors.completed} />
                        </View>
                        <Text style={[styles.actionLabel, { color: colors.text }]}>Alerts</Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>

            {/* ===== OWNER STATS ===== */}
            {isOwner && (
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Dashboard</Text>
                    <View style={styles.statsGrid}>
                        {[
                            { value: stats.pending, label: 'Pending', color: colors.warning, icon: 'time' },
                            { value: stats.approved, label: 'Approved', color: colors.primary, icon: 'checkmark-circle' },
                            { value: stats.vehicles, label: 'Vehicles', color: colors.info, icon: 'car-sport' },
                            { value: stats.total, label: 'Total', color: colors.completed, icon: 'layers' },
                        ].map((stat, idx) => (
                            <View
                                key={idx}
                                style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border, ...shadow }]}
                            >
                                <View style={[styles.statIcon, { backgroundColor: `${stat.color}15` }]}>
                                    <Ionicons name={stat.icon as any} size={20} color={stat.color} />
                                </View>
                                <Text style={[styles.statNumber, { color: colors.text }]}>{stat.value}</Text>
                                <Text style={[styles.statLabel, { color: colors.textMuted }]}>{stat.label}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            )}

            {/* ===== RENTER STATS ===== */}
            {!isOwner && !isAdmin && (
                <>
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>My Activity</Text>
                        <View style={styles.statsGrid}>
                            {[
                                { value: stats.active, label: 'Active', color: colors.primary, icon: 'flash' },
                                { value: stats.upcoming, label: 'Upcoming', color: colors.info, icon: 'arrow-forward-circle' },
                                { value: stats.completed, label: 'Completed', color: colors.success, icon: 'checkmark-done-circle' },
                            ].map((stat, idx) => (
                                <View
                                    key={idx}
                                    style={[styles.statCard, styles.statCard3, { backgroundColor: colors.card, borderColor: colors.border, ...shadow }]}
                                >
                                    <View style={[styles.statIcon, { backgroundColor: `${stat.color}15` }]}>
                                        <Ionicons name={stat.icon as any} size={20} color={stat.color} />
                                    </View>
                                    <Text style={[styles.statNumber, { color: colors.text }]}>{stat.value}</Text>
                                    <Text style={[styles.statLabel, { color: colors.textMuted }]}>{stat.label}</Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* Recent Bookings */}
                    {recentBookings.length > 0 && (
                        <View style={styles.section}>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Bookings</Text>
                            {recentBookings.map((booking) => (
                                <TouchableOpacity
                                    key={booking.id}
                                    style={[styles.recentCard, { backgroundColor: colors.card, borderColor: colors.border, ...shadow }]}
                                    onPress={() => router.push(`/bookings/${booking.id}`)}
                                >
                                    <Image
                                        source={{ uri: booking.vehicle?.images?.[0]?.image_url }}
                                        style={[styles.recentThumb, { backgroundColor: colors.surface }]}
                                    />
                                    <View style={styles.recentInfo}>
                                        <Text style={[styles.recentTitle, { color: colors.text }]}>
                                            {booking.vehicle?.title || 'Vehicle'}
                                        </Text>
                                        <Text style={[styles.recentDate, { color: colors.textSecondary }]}>
                                            {new Date(booking.start_date).toLocaleDateString()}
                                        </Text>
                                    </View>
                                    <View style={[styles.statusDot, { backgroundColor: colors[booking.status as keyof typeof colors] || colors.textMuted }]} />
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </>
            )}

            {/* ===== HOW IT WORKS (New users) ===== */}
            {!isOwner && !isAdmin && recentBookings.length === 0 && (
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>How It Works</Text>
                    {[
                        { icon: 'search', title: 'Find a Vehicle', desc: 'Browse cars and bikes near you', color: colors.primary },
                        { icon: 'card', title: 'Book & Pay', desc: 'Select dates and make payment', color: colors.info },
                        { icon: 'car-sport', title: 'Ride & Return', desc: 'Pick up, ride, and return safely', color: colors.completed },
                    ].map((step, idx) => (
                        <View key={idx} style={[styles.stepCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <View style={[styles.stepNum, { backgroundColor: step.color }]}>
                                <Text style={styles.stepNumText}>{idx + 1}</Text>
                            </View>
                            <View style={styles.stepContent}>
                                <Text style={[styles.stepTitle, { color: colors.text }]}>{step.title}</Text>
                                <Text style={[styles.stepDesc, { color: colors.textSecondary }]}>{step.desc}</Text>
                            </View>
                        </View>
                    ))}
                </View>
            )}

            {/* Bottom padding for floating tab bar */}
            <View style={{ height: 80 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { paddingBottom: 20 },
    // Hero
    hero: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.xxl, paddingBottom: Spacing.xl, borderBottomLeftRadius: Radius.xl, borderBottomRightRadius: Radius.xl },
    heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    heroText: { flex: 1 },
    greeting: { fontSize: FontSize.sm, fontWeight: '500' },
    userName: { fontSize: 28, fontWeight: '800', marginTop: 2 },
    rolePill: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 5, paddingHorizontal: Spacing.md, paddingVertical: 5, borderRadius: Radius.full, marginTop: Spacing.sm },
    roleText: { fontSize: FontSize.xs, fontWeight: '600' },
    heroAvatar: { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center' },
    heroAvatarText: { fontSize: FontSize.xxl, fontWeight: '700', color: '#fff' },
    // Sections
    section: { paddingHorizontal: Spacing.xl, marginTop: Spacing.xxl },
    sectionTitle: { fontSize: FontSize.lg, fontWeight: '700', marginBottom: Spacing.md },
    // Actions
    actionsRow: { gap: Spacing.md, paddingRight: Spacing.xl },
    actionPill: { borderRadius: Radius.lg, borderWidth: 1, paddingVertical: Spacing.lg, paddingHorizontal: Spacing.lg, alignItems: 'center', width: 100 },
    actionDot: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.sm },
    actionLabel: { fontSize: FontSize.sm, fontWeight: '600' },
    // Stats
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
    statCard: { flexBasis: '47%', borderRadius: Radius.lg, borderWidth: 1, padding: Spacing.lg, alignItems: 'flex-start' },
    statCard3: { flexBasis: '30%', padding: Spacing.md },
    statIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.sm },
    statNumber: { fontSize: FontSize.xxl, fontWeight: '800' },
    statLabel: { fontSize: FontSize.xs, marginTop: 2, fontWeight: '500' },
    // Recent
    recentCard: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, borderRadius: Radius.lg, borderWidth: 1, marginBottom: Spacing.sm },
    recentThumb: { width: 50, height: 50, borderRadius: Radius.md, marginRight: Spacing.md },
    recentInfo: { flex: 1 },
    recentTitle: { fontSize: FontSize.md, fontWeight: '600' },
    recentDate: { fontSize: FontSize.xs, marginTop: 2 },
    statusDot: { width: 10, height: 10, borderRadius: 5, marginLeft: Spacing.sm },
    // Steps
    stepCard: { flexDirection: 'row', alignItems: 'center', borderRadius: Radius.lg, borderWidth: 1, padding: Spacing.lg, marginBottom: Spacing.sm },
    stepNum: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    stepNumText: { color: '#fff', fontWeight: '700', fontSize: FontSize.sm },
    stepContent: { marginLeft: Spacing.lg, flex: 1 },
    stepTitle: { fontSize: FontSize.md, fontWeight: '600' },
    stepDesc: { fontSize: FontSize.sm, marginTop: 2 },
});
