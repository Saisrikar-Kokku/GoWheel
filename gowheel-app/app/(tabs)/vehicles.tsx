import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity, Image,
    RefreshControl, ActivityIndicator, TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Colors, Spacing, FontSize, Radius, cardShadow } from '@/lib/theme';
import { Ionicons } from '@expo/vector-icons';
import { getActiveVehicles, getOwnerVehicles } from '@/services/vehicleService';
import { VehicleWithImages, VehicleFilters } from '@/types/vehicle';

export default function VehiclesScreen() {
    const { profile } = useAuth();
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
                style={styles.vehicleCard}
                onPress={() => router.push(`/vehicles/${item.id}`)}
                activeOpacity={0.85}
            >
                {primaryImage ? (
                    <Image source={{ uri: primaryImage.image_url }} style={styles.vehicleImage} resizeMode="cover" />
                ) : (
                    <View style={[styles.vehicleImage, styles.noImage]}>
                        <Ionicons name="image-outline" size={40} color={Colors.textMuted} />
                    </View>
                )}
                <View style={styles.cardBody}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.vehicleTitle} numberOfLines={1}>{item.title}</Text>
                        <View style={[styles.typeBadge, { backgroundColor: item.vehicle_type === 'car' ? 'rgba(59,130,246,0.15)' : 'rgba(16,185,129,0.15)' }]}>
                            <Text style={[styles.typeBadgeText, { color: item.vehicle_type === 'car' ? Colors.info : Colors.primary }]}>
                                {item.vehicle_type === 'car' ? '🚗' : '🏍️'} {item.vehicle_type.toUpperCase()}
                            </Text>
                        </View>
                    </View>
                    <Text style={styles.brandModel}>{item.brand} {item.model} • {item.year}</Text>
                    <View style={styles.cardFooter}>
                        <View style={styles.locationRow}>
                            <Ionicons name="location-outline" size={14} color={Colors.textMuted} />
                            <Text style={styles.location} numberOfLines={1}>{item.location}</Text>
                        </View>
                        <Text style={styles.price}>₹{item.price_per_day}<Text style={styles.perDay}>/day</Text></Text>
                    </View>
                    {isOwner && (
                        <View style={styles.statusRow}>
                            <View style={[styles.statusDot, { backgroundColor: item.is_active ? Colors.success : Colors.error }]} />
                            <Text style={styles.statusText}>{item.is_active ? 'Active' : 'Inactive'}</Text>
                            <Text style={styles.statusText}> • {item.vehicle_status}</Text>
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            {/* Search & Filter */}
            <View style={styles.filterBar}>
                <View style={styles.searchBox}>
                    <Ionicons name="search" size={18} color={Colors.textMuted} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search by location..."
                        placeholderTextColor={Colors.textMuted}
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
                                style={[styles.typeButton, typeFilter === type && styles.typeButtonActive]}
                                onPress={() => setTypeFilter(type)}
                            >
                                <Text style={[styles.typeButtonText, typeFilter === type && styles.typeButtonTextActive]}>
                                    {type === 'all' ? 'All' : type === 'car' ? '🚗 Cars' : '🏍️ Bikes'}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </View>

            {/* Owner Add Button */}
            {isOwner && (
                <TouchableOpacity style={styles.addButton} onPress={() => router.push('/vehicles/add')}>
                    <Ionicons name="add-circle" size={20} color={Colors.white} />
                    <Text style={styles.addButtonText}>Add New Vehicle</Text>
                </TouchableOpacity>
            )}

            {loading ? (
                <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>
            ) : vehicles.length === 0 ? (
                <View style={styles.center}>
                    <Ionicons name="car-outline" size={60} color={Colors.textMuted} />
                    <Text style={styles.emptyText}>{isOwner ? 'No vehicles listed yet' : 'No vehicles found'}</Text>
                </View>
            ) : (
                <FlatList
                    data={vehicles}
                    renderItem={renderVehicleCard}
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
    filterBar: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.sm, backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border },
    searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: Radius.md, paddingHorizontal: Spacing.md, borderWidth: 1, borderColor: Colors.border },
    searchInput: { flex: 1, paddingVertical: 10, paddingHorizontal: Spacing.sm, color: Colors.text, fontSize: FontSize.md },
    typeFilters: { flexDirection: 'row', gap: Spacing.sm, paddingTop: Spacing.md },
    typeButton: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border },
    typeButtonActive: { borderColor: Colors.primary, backgroundColor: 'rgba(16, 185, 129, 0.12)' },
    typeButtonText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '500' },
    typeButtonTextActive: { color: Colors.primary },
    addButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primary, marginHorizontal: Spacing.lg, marginTop: Spacing.md, paddingVertical: Spacing.md, borderRadius: Radius.md, gap: Spacing.sm },
    addButtonText: { color: Colors.white, fontSize: FontSize.md, fontWeight: '600' },
    list: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: 30 },
    vehicleCard: { backgroundColor: Colors.card, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.lg, overflow: 'hidden', ...cardShadow },
    vehicleImage: { width: '100%', height: 180 },
    noImage: { backgroundColor: Colors.surface, justifyContent: 'center', alignItems: 'center' },
    cardBody: { padding: Spacing.lg },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xs },
    vehicleTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text, flex: 1, marginRight: Spacing.sm },
    typeBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: Radius.full },
    typeBadgeText: { fontSize: FontSize.xs, fontWeight: '600' },
    brandModel: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.md },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 },
    location: { fontSize: FontSize.sm, color: Colors.textMuted, flex: 1 },
    price: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.primary },
    perDay: { fontSize: FontSize.xs, fontWeight: '400', color: Colors.textSecondary },
    statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.sm, gap: 6 },
    statusDot: { width: 8, height: 8, borderRadius: 4 },
    statusText: { fontSize: FontSize.xs, color: Colors.textSecondary },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 80 },
    emptyText: { color: Colors.textMuted, fontSize: FontSize.md, marginTop: Spacing.md },
});
