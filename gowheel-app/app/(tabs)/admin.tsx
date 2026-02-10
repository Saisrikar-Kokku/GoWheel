import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity, Image,
    RefreshControl, ActivityIndicator, Alert, ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Spacing, FontSize, Radius, cardShadow } from '@/lib/theme';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { LineChart, PieChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';

const screenWidth = Dimensions.get('window').width;

type AdminTab = 'vehicles' | 'users' | 'bookings' | 'reviews' | 'payouts';

export default function AdminScreen() {
    const router = useRouter();
    const { profile } = useAuth();
    const { colors } = useTheme();
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
                { name: 'Completed', population: statusCounts.completed, color: colors.success, legendFontColor: colors.textSecondary, legendFontSize: 12 },
                { name: 'Active', population: statusCounts.active, color: colors.primary, legendFontColor: colors.textSecondary, legendFontSize: 12 }
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
        const statusColors: Record<string, string> = { draft: colors.textMuted, pending_verification: colors.warning, approved: colors.success, rejected: colors.error };
        const img = item.vehicle_images?.find((i: any) => i.is_primary) || item.vehicle_images?.[0];
        return (
            <TouchableOpacity style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => router.push(`/vehicles/${item.id}`)}>
                <View style={s.cardRow}>
                    {img ? <Image source={{ uri: img.image_url }} style={s.thumb} /> : <View style={[s.thumb, s.noImage, { backgroundColor: colors.surface }]}><Ionicons name="car" size={20} color={colors.textMuted} /></View>}
                    <View style={s.cardInfo}>
                        <Text style={[s.cardTitle, { color: colors.text }]} numberOfLines={1}>{item.title}</Text>
                        <Text style={[s.cardSub, { color: colors.textSecondary }]}>{item.brand} {item.model} • ₹{item.price_per_day}/hr</Text>
                        <View style={[s.statusBadge, { backgroundColor: `${statusColors[item.vehicle_status] || colors.textMuted}20` }]}>
                            <Text style={[s.statusBadgeText, { color: statusColors[item.vehicle_status] || colors.textMuted }]}>{item.vehicle_status}</Text>
                        </View>
                    </View>
                </View>
                {item.vehicle_status === 'pending_verification' && (
                    <View style={[s.actionRow, { borderTopColor: colors.border }]}>
                        <TouchableOpacity style={[s.actionBtn, { backgroundColor: colors.success }]} onPress={() => handleApproveVehicle(item.id)}>
                            <Text style={s.actionBtnText}>✓ Approve</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[s.actionBtn, { backgroundColor: colors.error }]} onPress={() => handleRejectVehicle(item.id)}>
                            <Text style={s.actionBtnText}>✗ Reject</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    const renderUserItem = ({ item }: { item: any }) => (
        <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={s.cardRow}>
                <View style={[s.userAvatar, { backgroundColor: colors.primary }]}><Text style={s.userAvatarText}>{item.full_name?.charAt(0) || '?'}</Text></View>
                <View style={s.cardInfo}>
                    <Text style={[s.cardTitle, { color: colors.text }]}>{item.full_name || 'Unnamed'}</Text>
                    <Text style={[s.cardSub, { color: colors.textSecondary }]}>{item.email || item.id.slice(0, 8)} • {item.role}</Text>
                    {item.is_blocked && <Text style={[s.blockedTag, { color: colors.error }]}>🚫 Blocked</Text>}
                </View>
                <TouchableOpacity style={[s.blockBtn, { borderColor: colors.error }, item.is_blocked ? { borderColor: colors.success } : null]} onPress={() => handleBlockUser(item.id, item.is_blocked)}>
                    <Text style={[s.blockBtnText, { color: colors.error }, item.is_blocked ? { color: colors.success } : null]}>{item.is_blocked ? 'Unblock' : 'Block'}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderBookingItem = ({ item }: { item: any }) => (
        <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={s.cardRow}>
                <View style={s.cardInfo}>
                    <Text style={[s.cardTitle, { color: colors.text }]}>Booking #{item.id.slice(0, 8)}</Text>
                    <Text style={[s.cardSub, { color: colors.textSecondary }]}>Status: {item.status}</Text>
                    <Text style={[s.cardSub, { color: colors.textSecondary }]}>Total: ₹{item.total_amount}</Text>
                </View>
                <View style={[s.statusBadge, { backgroundColor: item.payment_status === 'paid' ? colors.success + '20' : colors.warning + '20' }]}>
                    <Text style={[s.statusBadgeText, { color: item.payment_status === 'paid' ? colors.success : colors.warning }]}>
                        {item.payment_status}
                    </Text>
                </View>
            </View>
        </View>
    );

    const renderReviewItem = ({ item }: { item: any }) => (
        <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={s.cardRow}>
                <View style={[s.userAvatar, { backgroundColor: colors.warning }]}>
                    <Text style={s.userAvatarText}>{item.rating}</Text>
                </View>
                <View style={s.cardInfo}>
                    <Text style={[s.cardTitle, { color: colors.text }]}>{item.reviewer?.full_name || 'Anonymous'}</Text>
                    <Text style={[s.cardSub, { color: colors.textSecondary }]}>for {item.booking?.vehicle?.title || 'Vehicle'}</Text>
                    {item.comment && <Text style={[s.cardSub, { marginTop: 4, fontStyle: 'italic', color: colors.textSecondary }]}>"{item.comment}"</Text>}
                </View>
            </View>
        </View>
    );

    const renderPayoutItem = ({ item }: { item: any }) => (
        <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={s.cardRow}>
                <View style={s.cardInfo}>
                    <Text style={[s.cardTitle, { color: colors.text }]}>{item.owner?.full_name}</Text>
                    <Text style={[s.cardSub, { color: colors.textSecondary }]}>{item.vehicle?.title}</Text>
                    <Text style={[s.cardSub, { color: colors.text }]}>Payout: ₹{item.owner_payout_amount} • Comm: ₹{item.platform_commission}</Text>
                </View>
                {item.payout_status === 'pending' ? (
                    <TouchableOpacity style={[s.payBtn, { backgroundColor: colors.primary }]} onPress={() => handleMarkPaid(item.id, item.owner_payout_amount)}>
                        <Text style={s.payBtnText}>Mark Paid</Text>
                    </TouchableOpacity>
                ) : (
                    <View style={[s.statusBadge, { backgroundColor: colors.success + '20' }]}>
                        <Text style={[s.statusBadgeText, { color: colors.success }]}>PAID</Text>
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
        return <View style={[s.container, s.center, { backgroundColor: colors.background }]}><Text style={[s.emptyText, { color: colors.textMuted }]}>Admin access only</Text></View>;
    }

    return (
        <View style={[s.container, { backgroundColor: colors.background }]}>
            {/* Standard Stats Cards */}
            <View style={[s.statsContainer, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.statsScroll}>
                    <View style={[s.statCard, { borderColor: colors.border }]}>
                        <Text style={[s.statVal, { color: colors.text }]}>{stats.users}</Text>
                        <Text style={[s.statLabel, { color: colors.textSecondary }]}>Users</Text>
                    </View>
                    <View style={[s.statCard, { borderColor: colors.border }]}>
                        <Text style={[s.statVal, { color: colors.text }]}>{stats.vehicles}</Text>
                        <Text style={[s.statLabel, { color: colors.textSecondary }]}>Vehicles</Text>
                    </View>
                    <View style={[s.statCard, { borderColor: colors.border }]}>
                        <Text style={[s.statVal, { color: colors.text }]}>{stats.bookings}</Text>
                        <Text style={[s.statLabel, { color: colors.textSecondary }]}>Bookings</Text>
                    </View>
                    <View style={[s.statCard, { borderColor: colors.warning }]}>
                        <Text style={[s.statVal, { color: colors.warning }]}>₹{stats.pendingPayouts}</Text>
                        <Text style={[s.statLabel, { color: colors.textSecondary }]}>Pending Pay</Text>
                    </View>
                    <View style={[s.statCard, { borderColor: colors.success }]}>
                        <Text style={[s.statVal, { color: colors.success }]}>₹{stats.commission}</Text>
                        <Text style={[s.statLabel, { color: colors.textSecondary }]}>Commission</Text>
                    </View>
                </ScrollView>
            </View>

            {/* Charts Section */}
            {profile?.role === 'admin' && !loading && LineChart && PieChart && stats.chartData?.labels?.length > 0 && stats.pieData?.length > 0 && (
                <View style={[s.chartsContainer, { borderBottomColor: colors.border }, !chartsExpanded && { paddingBottom: 0 }]}>
                    <TouchableOpacity
                        style={s.sectionHeader}
                        onPress={() => setChartsExpanded(!chartsExpanded)}
                        activeOpacity={0.7}
                    >
                        <Text style={[s.sectionTitle, { color: colors.text }]}>Platform Analytics {!chartsExpanded && "(Condensed)"}</Text>
                        <Ionicons
                            name={chartsExpanded ? "chevron-up" : "chevron-down"}
                            size={20}
                            color={colors.primary}
                        />
                    </TouchableOpacity>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[s.chartsScroll, !chartsExpanded && { paddingBottom: 4 }]}>
                        {/* Revenue Chart */}
                        {stats.chartData.labels.length > 0 && stats.chartData.revenue.length === stats.chartData.labels.length && (
                            <View style={[s.chartCard, { backgroundColor: colors.card, borderColor: colors.border }, !chartsExpanded && { padding: 4, borderRadius: Radius.md }]}>
                                {chartsExpanded && <Text style={[s.chartTitle, { color: colors.textSecondary }]}>Revenue (6 Months) - ₹k</Text>}
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
                                        backgroundColor: colors.card,
                                        backgroundGradientFrom: colors.card,
                                        backgroundGradientTo: colors.card,
                                        decimalPlaces: chartsExpanded ? 1 : 0,
                                        color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
                                        labelColor: (opacity = 1) => chartsExpanded ? colors.textSecondary : 'transparent',
                                        style: { borderRadius: 16 },
                                        propsForDots: { r: "4", strokeWidth: "2", stroke: colors.primary }
                                    }}
                                    bezier
                                    style={{ marginVertical: chartsExpanded ? 8 : 2, borderRadius: 16 }}
                                />
                            </View>
                        )}

                        {/* Booking Status Chart */}
                        {stats.pieData.length > 0 && (
                            <View style={[s.chartCard, { backgroundColor: colors.card, borderColor: colors.border }, !chartsExpanded && { padding: 4, borderRadius: Radius.md }]}>
                                {chartsExpanded && <Text style={[s.chartTitle, { color: colors.textSecondary }]}>Booking Status</Text>}
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
                <View style={{ padding: 20 }}><Text style={{ color: colors.error }}>Charts library not fully initialized. Please restart the app.</Text></View>
            )}

            {/* Admin Tabs */}
            <View style={[s.tabBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {tabs.map(tab => (
                        <TouchableOpacity key={tab.key} style={[s.tab, activeTab === tab.key && { borderBottomColor: colors.primary }]} onPress={() => setActiveTab(tab.key)}>
                            <Ionicons name={tab.icon as any} size={18} color={activeTab === tab.key ? colors.primary : colors.textMuted} />
                            <Text style={[s.tabText, { color: activeTab === tab.key ? colors.primary : colors.textMuted }]}>{tab.label}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {loading ? (
                <View style={s.center}><ActivityIndicator size="large" color={colors.primary} /></View>
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
                    contentContainerStyle={s.list}
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
                    ListEmptyComponent={<View style={s.center}><Text style={[s.emptyText, { color: colors.textMuted }]}>No {activeTab} found</Text></View>}
                />
            )}
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 80 },
    statsContainer: { height: 90, borderBottomWidth: 1 },
    statsScroll: { paddingHorizontal: Spacing.md, alignItems: 'center', gap: Spacing.md },
    statCard: { width: 100, padding: Spacing.sm, borderRadius: Radius.md, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    statVal: { fontSize: FontSize.lg, fontWeight: '700' },
    statLabel: { fontSize: FontSize.xs },
    tabBar: { flexDirection: 'row', borderBottomWidth: 1, paddingVertical: Spacing.xs },
    tab: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, flexDirection: 'row', alignItems: 'center', gap: 6, borderBottomWidth: 2, borderBottomColor: 'transparent' },
    tabText: { fontSize: FontSize.sm, fontWeight: '500' },
    list: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: 30 },
    card: { borderRadius: Radius.lg, borderWidth: 1, padding: Spacing.lg, marginBottom: Spacing.md, ...cardShadow },
    cardRow: { flexDirection: 'row', alignItems: 'center' },
    thumb: { width: 60, height: 45, borderRadius: Radius.sm },
    noImage: { justifyContent: 'center', alignItems: 'center' },
    cardInfo: { flex: 1, marginLeft: Spacing.md },
    cardTitle: { fontSize: FontSize.md, fontWeight: '600' },
    cardSub: { fontSize: FontSize.xs, marginTop: 2 },
    statusBadge: { alignSelf: 'flex-start', paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: Radius.full, marginTop: Spacing.xs },
    statusBadgeText: { fontSize: FontSize.xs, fontWeight: '600' },
    actionRow: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.md, paddingTop: Spacing.md, borderTopWidth: 1 },
    actionBtn: { flex: 1, paddingVertical: Spacing.sm, borderRadius: Radius.md, alignItems: 'center' },
    actionBtnText: { color: '#fff', fontWeight: '600', fontSize: FontSize.sm },
    userAvatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    userAvatarText: { color: '#fff', fontWeight: '700', fontSize: FontSize.md },
    blockedTag: { fontSize: FontSize.xs, marginTop: 2 },
    blockBtn: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: Radius.md, borderWidth: 1 },
    blockBtnText: { fontSize: FontSize.xs, fontWeight: '600' },
    emptyText: { fontSize: FontSize.md },
    payBtn: { paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: Radius.md },
    payBtnText: { color: '#fff', fontSize: FontSize.xs, fontWeight: '600' },
    chartsContainer: { marginTop: Spacing.md, paddingBottom: Spacing.sm, borderBottomWidth: 1 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.lg, marginBottom: Spacing.xs },
    sectionTitle: { fontSize: FontSize.md, fontWeight: '700' },
    chartsScroll: { paddingHorizontal: Spacing.lg, gap: Spacing.md, paddingBottom: Spacing.sm },
    chartCard: { borderRadius: Radius.lg, padding: Spacing.sm, borderWidth: 1, ...cardShadow, alignItems: 'center' },
    chartTitle: { fontSize: FontSize.xs, fontWeight: '600', marginBottom: 2, alignSelf: 'flex-start' },
});
