import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity, Image,
    RefreshControl, ActivityIndicator, Alert, ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Colors, Spacing, FontSize, Radius, cardShadow } from '@/lib/theme';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { LineChart, PieChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';

const screenWidth = Dimensions.get('window').width;

type AdminTab = 'vehicles' | 'users' | 'bookings' | 'reviews' | 'payouts';

export default function AdminScreen() {
    const router = useRouter();
    const { profile } = useAuth();
    const [activeTab, setActiveTab] = useState<AdminTab>('vehicles');
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Stats State
    const [stats, setStats] = useState({
        users: 0,
        vehicles: 0,
        bookings: 0,
        completed: 0,
        reviews: 0,
        pendingPayouts: 0,
        commission: 0,
        chartData: { labels: [], revenue: [] } as any,
        pieData: [] as any
    });
    const [chartsExpanded, setChartsExpanded] = useState(true);

    const loadStats = async () => {
        try {
            const { count: users } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
            const { count: vehicles } = await supabase.from('vehicles').select('*', { count: 'exact', head: true });
            const { count: bookings } = await supabase.from('bookings').select('*', { count: 'exact', head: true });
            const { count: completed } = await supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('ride_status', 'completed');
            const { count: reviews } = await supabase.from('reviews').select('*', { count: 'exact', head: true });

            // Calculate financial stats manually from a limited set or aggregation if possible
            // For now, we'll fetch recent completed bookings to estimate or just show counts
            const { data: payouts } = await supabase.from('bookings').select('owner_payout_amount, platform_commission, payout_status, total_amount, created_at, status').eq('ride_status', 'completed');

            // Process Revenue Chart (Last 6 Months)
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const last6Months: string[] = [];
            const revenueMap = new Map<string, number>();

            for (let i = 5; i >= 0; i--) {
                const d = new Date();
                d.setMonth(d.getMonth() - i);
                const key = months[d.getMonth()];
                last6Months.push(key);
                revenueMap.set(key, 0);
            }

            payouts?.forEach((p: any) => {
                const d = new Date(p.created_at);
                const key = months[d.getMonth()];
                if (revenueMap.has(key)) {
                    revenueMap.set(key, (revenueMap.get(key) || 0) + Number(p.total_amount || 0));
                }
            });

            // Process Pie Data (Status)
            const statusCounts: Record<string, number> = {
                completed: Number(completed || 0),
                active: bookings ? Number(bookings) - Number(completed || 0) : 0
            };
            const pieData = [
                { name: 'Completed', population: statusCounts.completed, color: Colors.success, legendFontColor: Colors.textSecondary, legendFontSize: 12 },
                { name: 'Active', population: statusCounts.active, color: Colors.primary, legendFontColor: Colors.textSecondary, legendFontSize: 12 }
            ];

            const pending = payouts?.filter(p => p.payout_status === 'pending').reduce((sum, p) => sum + Number(p.owner_payout_amount || 0), 0) || 0;
            const comm = payouts?.reduce((sum, p) => sum + Number(p.platform_commission || 0), 0) || 0;

            setStats({
                users: users || 0,
                vehicles: vehicles || 0,
                bookings: bookings || 0,
                completed: completed || 0,
                reviews: reviews || 0,
                pendingPayouts: pending,
                commission: comm,
                chartData: {
                    labels: last6Months,
                    revenue: last6Months.map(m => (revenueMap.get(m) || 0) / 1000) // k
                },
                pieData: pieData
            });
        } catch (e) { console.error('Stats error:', e); }
    };

    const loadData = useCallback(async () => {
        try {
            let query;
            if (activeTab === 'vehicles') {
                query = supabase.from('vehicles').select('*, vehicle_images(id, image_url, is_primary)').order('created_at', { ascending: false });
            } else if (activeTab === 'users') {
                query = supabase.from('profiles').select('*').order('created_at', { ascending: false });
            } else if (activeTab === 'bookings') {
                query = supabase.from('bookings').select('*').order('created_at', { ascending: false }).limit(50);
            } else if (activeTab === 'reviews') {
                query = supabase.from('reviews').select(`
                    *,
                    reviewer:profiles!reviews_reviewer_id_fkey(full_name),
                    booking:bookings!reviews_booking_id_fkey(
                        vehicle:vehicles!bookings_vehicle_id_fkey(title)
                    )
                `).order('created_at', { ascending: false });
            } else if (activeTab === 'payouts') {
                query = supabase.from('bookings').select(`
                    *,
                    owner:profiles!bookings_owner_id_fkey(full_name),
                    vehicle:vehicles!bookings_vehicle_id_fkey(title)
                `).eq('ride_status', 'completed').order('created_at', { ascending: false });
            }

            if (query) {
                const { data: res, error } = await query;
                if (error) throw error;
                setData(res || []);
            }
        } catch (e) {
            console.error('Data load error:', e);
            Alert.alert('Error', 'Failed to load data');
        }
        setLoading(false);
    }, [activeTab]);

    useEffect(() => {
        setLoading(true);
        loadStats();
        loadData();
        // Auto-collapse charts when switching tabs (unless it's the first load or user explicitly wants them)
        if (activeTab !== 'vehicles' || data.length > 0) {
            setChartsExpanded(false);
        }
    }, [loadData]);

    const onRefresh = async () => {
        setRefreshing(true);
        await Promise.all([loadStats(), loadData()]);
        setRefreshing(false);
    };

    // --- Actions ---

    const handleApproveVehicle = async (id: string) => {
        Alert.alert('Approve Vehicle', 'Approve this vehicle for listing?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Approve', onPress: async () => {
                    await supabase.from('vehicles').update({ vehicle_status: 'approved', verified_at: new Date().toISOString(), verified_by_admin_id: profile?.id }).eq('id', id);
                    loadData();
                    loadStats();
                },
            },
        ]);
    };

    const handleRejectVehicle = async (id: string) => {
        Alert.alert('Reject Vehicle', 'Reject this vehicle?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Reject', style: 'destructive', onPress: async () => {
                    await supabase.from('vehicles').update({ vehicle_status: 'rejected' }).eq('id', id);
                    loadData();
                    loadStats();
                },
            },
        ]);
    };

    const handleBlockUser = async (id: string, isBlocked: boolean) => {
        await supabase.from('profiles').update({ is_blocked: !isBlocked }).eq('id', id);
        loadData();
    };

    const handleMarkPaid = async (bookingId: string, amount: number) => {
        Alert.alert('Confirm Payout', `Mark ₹${amount} as paid?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Confirm', onPress: async () => {
                    const { error } = await supabase.from('bookings').update({ payout_status: 'paid' }).eq('id', bookingId);
                    if (error) Alert.alert('Error', 'Failed to update payout');
                    else {
                        loadData();
                        loadStats();
                    }
                }
            }
        ]);
    };

    // --- Render Items ---

    const renderVehicleItem = ({ item }: { item: any }) => {
        const statusColors: Record<string, string> = { draft: Colors.textMuted, pending_verification: Colors.warning, approved: Colors.success, rejected: Colors.error };
        const img = item.vehicle_images?.find((i: any) => i.is_primary) || item.vehicle_images?.[0];
        return (
            <TouchableOpacity style={styles.card} onPress={() => router.push(`/vehicles/${item.id}`)}>
                <View style={styles.cardRow}>
                    {img ? <Image source={{ uri: img.image_url }} style={styles.thumb} /> : <View style={[styles.thumb, styles.noImage]}><Ionicons name="car" size={20} color={Colors.textMuted} /></View>}
                    <View style={styles.cardInfo}>
                        <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                        <Text style={styles.cardSub}>{item.brand} {item.model} • ₹{item.price_per_day}/hr</Text>
                        <View style={[styles.statusBadge, { backgroundColor: `${statusColors[item.vehicle_status] || Colors.textMuted}20` }]}>
                            <Text style={[styles.statusBadgeText, { color: statusColors[item.vehicle_status] || Colors.textMuted }]}>{item.vehicle_status}</Text>
                        </View>
                    </View>
                </View>
                {item.vehicle_status === 'pending_verification' && (
                    <View style={styles.actionRow}>
                        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.success }]} onPress={() => handleApproveVehicle(item.id)}>
                            <Text style={styles.actionBtnText}>✓ Approve</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.error }]} onPress={() => handleRejectVehicle(item.id)}>
                            <Text style={styles.actionBtnText}>✗ Reject</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    const renderUserItem = ({ item }: { item: any }) => (
        <View style={styles.card}>
            <View style={styles.cardRow}>
                <View style={styles.userAvatar}><Text style={styles.userAvatarText}>{item.full_name?.charAt(0) || '?'}</Text></View>
                <View style={styles.cardInfo}>
                    <Text style={styles.cardTitle}>{item.full_name || 'Unnamed'}</Text>
                    <Text style={styles.cardSub}>{item.email || item.id.slice(0, 8)} • {item.role}</Text>
                    {item.is_blocked && <Text style={styles.blockedTag}>🚫 Blocked</Text>}
                </View>
                <TouchableOpacity style={[styles.blockBtn, item.is_blocked && styles.unblockBtn]} onPress={() => handleBlockUser(item.id, item.is_blocked)}>
                    <Text style={[styles.blockBtnText, item.is_blocked && styles.unblockBtnText]}>{item.is_blocked ? 'Unblock' : 'Block'}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderBookingItem = ({ item }: { item: any }) => (
        <View style={styles.card}>
            <View style={styles.cardRow}>
                <View style={styles.cardInfo}>
                    <Text style={styles.cardTitle}>Booking #{item.id.slice(0, 8)}</Text>
                    <Text style={styles.cardSub}>Status: {item.status}</Text>
                    <Text style={styles.cardSub}>Total: ₹{item.total_amount}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: item.payment_status === 'paid' ? Colors.success + '20' : Colors.warning + '20' }]}>
                    <Text style={[styles.statusBadgeText, { color: item.payment_status === 'paid' ? Colors.success : Colors.warning }]}>
                        {item.payment_status}
                    </Text>
                </View>
            </View>
        </View>
    );

    const renderReviewItem = ({ item }: { item: any }) => (
        <View style={styles.card}>
            <View style={styles.cardRow}>
                <View style={[styles.userAvatar, { backgroundColor: Colors.warning }]}>
                    <Text style={styles.userAvatarText}>{item.rating}</Text>
                </View>
                <View style={styles.cardInfo}>
                    <Text style={styles.cardTitle}>{item.reviewer?.full_name || 'Anonymous'}</Text>
                    <Text style={styles.cardSub}>for {item.booking?.vehicle?.title || 'Vehicle'}</Text>
                    {item.comment && <Text style={[styles.cardSub, { marginTop: 4, fontStyle: 'italic' }]}>"{item.comment}"</Text>}
                </View>
            </View>
        </View>
    );

    const renderPayoutItem = ({ item }: { item: any }) => (
        <View style={styles.card}>
            <View style={styles.cardRow}>
                <View style={styles.cardInfo}>
                    <Text style={styles.cardTitle}>{item.owner?.full_name}</Text>
                    <Text style={styles.cardSub}>{item.vehicle?.title}</Text>
                    <Text style={[styles.cardSub, { color: Colors.text }]}>Payout: ₹{item.owner_payout_amount} • Comm: ₹{item.platform_commission}</Text>
                </View>
                {item.payout_status === 'pending' ? (
                    <TouchableOpacity style={styles.payBtn} onPress={() => handleMarkPaid(item.id, item.owner_payout_amount)}>
                        <Text style={styles.payBtnText}>Mark Paid</Text>
                    </TouchableOpacity>
                ) : (
                    <View style={[styles.statusBadge, { backgroundColor: Colors.success + '20' }]}>
                        <Text style={[styles.statusBadgeText, { color: Colors.success }]}>PAID</Text>
                    </View>
                )}
            </View>
        </View>
    );

    const tabs: { key: AdminTab; label: string; icon: string }[] = [
        { key: 'vehicles', label: 'Vehicles', icon: 'car' },
        { key: 'users', label: 'Users', icon: 'people' },
        { key: 'bookings', label: 'Bookings', icon: 'receipt' },
        { key: 'reviews', label: 'Reviews', icon: 'star' },
        { key: 'payouts', label: 'Payouts', icon: 'cash' },
    ];

    if (profile?.role !== 'admin') {
        return <View style={[styles.container, styles.center]}><Text style={styles.emptyText}>Admin access only</Text></View>;
    }

    return (
        <View style={styles.container}>
            {/* Standard Stats Cards */}
            <View style={styles.statsContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsScroll}>
                    <View style={styles.statCard}>
                        <Text style={styles.statVal}>{stats.users}</Text>
                        <Text style={styles.statLabel}>Users</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statVal}>{stats.vehicles}</Text>
                        <Text style={styles.statLabel}>Vehicles</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statVal}>{stats.bookings}</Text>
                        <Text style={styles.statLabel}>Bookings</Text>
                    </View>
                    <View style={[styles.statCard, { borderColor: Colors.warning }]}>
                        <Text style={[styles.statVal, { color: Colors.warning }]}>₹{stats.pendingPayouts}</Text>
                        <Text style={styles.statLabel}>Pending Pay</Text>
                    </View>
                    <View style={[styles.statCard, { borderColor: Colors.success }]}>
                        <Text style={[styles.statVal, { color: Colors.success }]}>₹{stats.commission}</Text>
                        <Text style={styles.statLabel}>Commission</Text>
                    </View>
                </ScrollView>
            </View>

            {/* Charts Section */}
            {profile?.role === 'admin' && !loading && LineChart && PieChart && stats.chartData?.labels?.length > 0 && stats.pieData?.length > 0 && (
                <View style={[styles.chartsContainer, !chartsExpanded && { paddingBottom: 0 }]}>
                    <TouchableOpacity
                        style={styles.sectionHeader}
                        onPress={() => setChartsExpanded(!chartsExpanded)}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.sectionTitle}>Platform Analytics {!chartsExpanded && "(Condensed)"}</Text>
                        <Ionicons
                            name={chartsExpanded ? "chevron-up" : "chevron-down"}
                            size={20}
                            color={Colors.primary}
                        />
                    </TouchableOpacity>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.chartsScroll, !chartsExpanded && { paddingBottom: 4 }]}>
                        {/* Revenue Chart */}
                        {stats.chartData.labels.length > 0 && stats.chartData.revenue.length === stats.chartData.labels.length && (
                            <View style={[styles.chartCard, !chartsExpanded && { padding: 4, borderRadius: Radius.md }]}>
                                {chartsExpanded && <Text style={styles.chartTitle}>Revenue (6 Months) - ₹k</Text>}
                                <LineChart
                                    data={{
                                        labels: chartsExpanded ? stats.chartData.labels : [],
                                        datasets: [{ data: stats.chartData.revenue.map((v: any) => v || 0) }]
                                    }}
                                    width={chartsExpanded ? screenWidth * 0.85 : screenWidth * 0.45}
                                    height={chartsExpanded ? 180 : 50}
                                    withVerticalLines={chartsExpanded}
                                    withHorizontalLines={chartsExpanded}
                                    withDots={chartsExpanded}
                                    chartConfig={{
                                        backgroundColor: Colors.card,
                                        backgroundGradientFrom: Colors.card,
                                        backgroundGradientTo: Colors.card,
                                        decimalPlaces: chartsExpanded ? 1 : 0,
                                        color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
                                        labelColor: (opacity = 1) => chartsExpanded ? Colors.textSecondary : 'transparent',
                                        style: { borderRadius: 16 },
                                        propsForDots: { r: "4", strokeWidth: "2", stroke: Colors.primary }
                                    }}
                                    bezier
                                    style={{ marginVertical: chartsExpanded ? 8 : 2, borderRadius: 16 }}
                                />
                            </View>
                        )}

                        {/* Booking Status Chart */}
                        {stats.pieData.length > 0 && (
                            <View style={[styles.chartCard, !chartsExpanded && { padding: 4, borderRadius: Radius.md }]}>
                                {chartsExpanded && <Text style={styles.chartTitle}>Booking Status</Text>}
                                <PieChart
                                    data={stats.pieData.map((d: any) => ({ ...d, population: d.population || 0 }))}
                                    width={chartsExpanded ? screenWidth * 0.85 : screenWidth * 0.45}
                                    height={chartsExpanded ? 180 : 50}
                                    chartConfig={{
                                        color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
                                    }}
                                    accessor={"population"}
                                    backgroundColor={"transparent"}
                                    paddingLeft={chartsExpanded ? "15" : "0"}
                                    absolute
                                    hasLegend={chartsExpanded}
                                />
                            </View>
                        )}
                    </ScrollView>
                </View>
            )}
            {!LineChart && profile?.role === 'admin' && (
                <View style={{ padding: 20 }}><Text style={{ color: Colors.error }}>Charts library not fully initialized. Please restart the app.</Text></View>
            )}

            {/* Admin Tabs */}
            <View style={styles.tabBar}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {tabs.map(tab => (
                        <TouchableOpacity key={tab.key} style={[styles.tab, activeTab === tab.key && styles.tabActive]} onPress={() => setActiveTab(tab.key)}>
                            <Ionicons name={tab.icon as any} size={18} color={activeTab === tab.key ? Colors.primary : Colors.textMuted} />
                            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>{tab.label}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {loading ? (
                <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>
            ) : (
                <FlatList
                    data={data}
                    renderItem={
                        activeTab === 'vehicles' ? renderVehicleItem :
                            activeTab === 'users' ? renderUserItem :
                                activeTab === 'reviews' ? renderReviewItem :
                                    activeTab === 'payouts' ? renderPayoutItem :
                                        renderBookingItem
                    }
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
                    ListEmptyComponent={<View style={styles.center}><Text style={styles.emptyText}>No {activeTab} found</Text></View>}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 80 },
    statsContainer: { height: 90, backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border },
    statsScroll: { paddingHorizontal: Spacing.md, alignItems: 'center', gap: Spacing.md },
    statCard: { width: 100, padding: Spacing.sm, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
    statVal: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text },
    statLabel: { fontSize: FontSize.xs, color: Colors.textSecondary },
    tabBar: { flexDirection: 'row', backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border, paddingVertical: Spacing.xs },
    tab: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, flexDirection: 'row', alignItems: 'center', gap: 6, borderBottomWidth: 2, borderBottomColor: 'transparent' },
    tabActive: { borderBottomColor: Colors.primary },
    tabText: { fontSize: FontSize.sm, color: Colors.textMuted, fontWeight: '500' },
    tabTextActive: { color: Colors.primary },
    list: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: 30 },
    card: { backgroundColor: Colors.card, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, padding: Spacing.lg, marginBottom: Spacing.md, ...cardShadow },
    cardRow: { flexDirection: 'row', alignItems: 'center' },
    thumb: { width: 60, height: 45, borderRadius: Radius.sm },
    noImage: { backgroundColor: Colors.surface, justifyContent: 'center', alignItems: 'center' },
    cardInfo: { flex: 1, marginLeft: Spacing.md },
    cardTitle: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text },
    cardSub: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
    statusBadge: { alignSelf: 'flex-start', paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: Radius.full, marginTop: Spacing.xs },
    statusBadgeText: { fontSize: FontSize.xs, fontWeight: '600' },
    actionRow: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.md, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border },
    actionBtn: { flex: 1, paddingVertical: Spacing.sm, borderRadius: Radius.md, alignItems: 'center' },
    actionBtnText: { color: Colors.white, fontWeight: '600', fontSize: FontSize.sm },
    userAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
    userAvatarText: { color: Colors.white, fontWeight: '700', fontSize: FontSize.md },
    blockedTag: { fontSize: FontSize.xs, color: Colors.error, marginTop: 2 },
    blockBtn: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.error },
    unblockBtn: { borderColor: Colors.success },
    blockBtnText: { fontSize: FontSize.xs, fontWeight: '600', color: Colors.error },
    unblockBtnText: { color: Colors.success },
    emptyText: { color: Colors.textMuted, fontSize: FontSize.md },
    payBtn: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: Radius.md },
    payBtnText: { color: Colors.white, fontSize: FontSize.xs, fontWeight: '600' },
    chartsContainer: { marginTop: Spacing.md, paddingBottom: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.lg, marginBottom: Spacing.xs },
    sectionTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text },
    chartsScroll: { paddingHorizontal: Spacing.lg, gap: Spacing.md, paddingBottom: Spacing.sm },
    chartCard: { backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.sm, borderWidth: 1, borderColor: Colors.border, ...cardShadow, alignItems: 'center' },
    chartTitle: { fontSize: FontSize.xs, fontWeight: '600', color: Colors.textSecondary, marginBottom: 2, alignSelf: 'flex-start' },
});
