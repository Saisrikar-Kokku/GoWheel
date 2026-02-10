import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity, Image,
    RefreshControl, ActivityIndicator, TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Spacing, FontSize, Radius } from '@/lib/theme';
import { Ionicons } from '@expo/vector-icons';
import { getActiveVehicles, getOwnerVehicles } from '@/services/vehicleService';
import { VehicleWithImages, VehicleFilters } from '@/types/vehicle';

export default function VehiclesScreen() {
    const { profile } = useAuth();
    const { colors, shadow } = useTheme();
    const router = useRouter();
    const isOwner = profile?.role === 'owner';

    const [vehicles, setVehicles] = useState<VehicleWithImages[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState<'all' | 'car' | 'bike'>('all');

    const loadVehicles = useCallback(async () => {
        try {
            if (isOwner) {
                const data = await getOwnerVehicles();
                setVehicles(data);
            } else {
                const filters: VehicleFilters = {};
                if (typeFilter !== 'all') filters.type = typeFilter;
                if (search.trim()) filters.location = search.trim();
                const result = await getActiveVehicles(filters);
                setVehicles(result.vehicles);
            }
        } catch (e) { console.error(e); }
        setLoading(false);
    }, [isOwner, typeFilter, search]);

    useEffect(() => { setLoading(true); loadVehicles(); }, [loadVehicles]);
    const onRefresh = async () => { setRefreshing(true); await loadVehicles(); setRefreshing(false); };

    const renderVehicleCard = ({ item }: { item: VehicleWithImages }) => {
        const primaryImage = item.images?.find(img => img.is_primary) || item.images?.[0];

        return (
            <TouchableOpacity
                style={[styles.vehicleCard, { backgroundColor: colors.card, borderColor: colors.border, ...shadow }]}
                onPress={() => router.push(`/vehicles/${item.id}`)}
                activeOpacity={0.85}
            >
                {primaryImage ? (
                    <Image source={{ uri: primaryImage.image_url }} style={styles.vehicleImage} resizeMode="cover" />
                ) : (
                    <View style={[styles.vehicleImage, styles.noImage, { backgroundColor: colors.surface }]}>
                        <Ionicons name="image-outline" size={40} color={colors.textMuted} />
                    </View>
                )}
                <View style={styles.cardBody}>
                    <View style={styles.cardHeader}>
                        <Text style={[styles.vehicleTitle, { color: colors.text }]} numberOfLines={1}>{item.title}</Text>
                        <View style={[styles.typeBadge, { backgroundColor: item.vehicle_type === 'car' ? `${colors.info}20` : `${colors.primary}20` }]}>
                            <Text style={[styles.typeBadgeText, { color: item.vehicle_type === 'car' ? colors.info : colors.primary }]}>
                                {item.vehicle_type === 'car' ? '🚗' : '🏍️'} {item.vehicle_type.toUpperCase()}
                            </Text>
                        </View>
                    </View>
                    <Text style={[styles.brandModel, { color: colors.textSecondary }]}>{item.brand} {item.model} • {item.year}</Text>
                    <View style={styles.cardFooter}>
                        <View style={styles.locationRow}>
                            <Ionicons name="location-outline" size={14} color={colors.textMuted} />
                            <Text style={[styles.location, { color: colors.textMuted }]} numberOfLines={1}>{item.location}</Text>
                        </View>
                        <Text style={[styles.price, { color: colors.primary }]}>
                            ₹{item.price_per_day}<Text style={[styles.perDay, { color: colors.textSecondary }]}>/day</Text>
                        </Text>
                    </View>
                    {isOwner && (
                        <View style={styles.statusRow}>
                            <View style={[styles.statusDot, { backgroundColor: item.is_active ? colors.success : colors.error }]} />
                            <Text style={[styles.statusText, { color: colors.textSecondary }]}>{item.is_active ? 'Active' : 'Inactive'}</Text>
                            <Text style={[styles.statusText, { color: colors.textSecondary }]}> • {item.vehicle_status}</Text>
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Search & Filter */}
            <View style={[styles.filterBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Ionicons name="search" size={18} color={colors.textMuted} />
                    <TextInput
                        style={[styles.searchInput, { color: colors.text }]}
                        placeholder="Search by location..."
                        placeholderTextColor={colors.textMuted}
                        value={search}
                        onChangeText={setSearch}
                        returnKeyType="search"
                    />
                </View>
                {!isOwner && (
                    <View style={styles.typeFilters}>
                        {(['all', 'car', 'bike'] as const).map(type => (
                            <TouchableOpacity
                                key={type}
                                style={[
                                    styles.typeButton,
                                    { borderColor: colors.border },
                                    typeFilter === type && { borderColor: colors.primary, backgroundColor: `${colors.primary}15` },
                                ]}
                                onPress={() => setTypeFilter(type)}
                            >
                                <Text style={[
                                    styles.typeButtonText,
                                    { color: colors.textSecondary },
                                    typeFilter === type && { color: colors.primary },
                                ]}>
                                    {type === 'all' ? 'All' : type === 'car' ? '🚗 Cars' : '🏍️ Bikes'}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </View>

            {/* Owner Add Button */}
            {isOwner && (
                <TouchableOpacity
                    style={[styles.addButton, { backgroundColor: colors.primary }]}
                    onPress={() => router.push('/vehicles/add')}
                >
                    <Ionicons name="add-circle" size={20} color="#fff" />
                    <Text style={styles.addButtonText}>Add New Vehicle</Text>
                </TouchableOpacity>
            )}

            {loading ? (
                <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>
            ) : vehicles.length === 0 ? (
                <View style={styles.center}>
                    <Ionicons name="car-outline" size={60} color={colors.textMuted} />
                    <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                        {isOwner ? 'No vehicles listed yet' : 'No vehicles found'}
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={vehicles}
                    renderItem={renderVehicleCard}
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
    filterBar: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.sm, borderBottomWidth: 1 },
    searchBox: { flexDirection: 'row', alignItems: 'center', borderRadius: Radius.md, paddingHorizontal: Spacing.md, borderWidth: 1 },
    searchInput: { flex: 1, paddingVertical: 10, paddingHorizontal: Spacing.sm, fontSize: FontSize.md },
    typeFilters: { flexDirection: 'row', gap: Spacing.sm, paddingTop: Spacing.md },
    typeButton: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: Radius.full, borderWidth: 1 },
    typeButtonText: { fontSize: FontSize.sm, fontWeight: '500' },
    addButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginHorizontal: Spacing.lg, marginTop: Spacing.md, paddingVertical: Spacing.md, borderRadius: Radius.md, gap: Spacing.sm },
    addButtonText: { color: '#fff', fontSize: FontSize.md, fontWeight: '600' },
    list: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: 100 },
    vehicleCard: { borderRadius: Radius.lg, borderWidth: 1, marginBottom: Spacing.lg, overflow: 'hidden' },
    vehicleImage: { width: '100%', height: 180 },
    noImage: { justifyContent: 'center', alignItems: 'center' },
    cardBody: { padding: Spacing.lg },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xs },
    vehicleTitle: { fontSize: FontSize.lg, fontWeight: '700', flex: 1, marginRight: Spacing.sm },
    typeBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: Radius.full },
    typeBadgeText: { fontSize: FontSize.xs, fontWeight: '600' },
    brandModel: { fontSize: FontSize.sm, marginBottom: Spacing.md },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 },
    location: { fontSize: FontSize.sm, flex: 1 },
    price: { fontSize: FontSize.lg, fontWeight: '800' },
    perDay: { fontSize: FontSize.xs, fontWeight: '400' },
    statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.sm, gap: 6 },
    statusDot: { width: 8, height: 8, borderRadius: 4 },
    statusText: { fontSize: FontSize.xs },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 80 },
    emptyText: { fontSize: FontSize.md, marginTop: Spacing.md },
});
