import React, { useEffect, useState, useMemo } from 'react';
import {
    View, Text, StyleSheet, ScrollView, Image, TouchableOpacity,
    ActivityIndicator, Alert, Dimensions, Modal, FlatList, Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Colors, Spacing, FontSize, Radius } from '@/lib/theme';
import { Ionicons } from '@expo/vector-icons';
import { getVehicleDetailsById } from '@/services/vehicleService';
import { createBookingRequest } from '@/services/bookingService';
import { VehicleWithOwner } from '@/types/vehicle';
import { addDays, format, differenceInHours, setHours, setMinutes, setSeconds, setMilliseconds } from 'date-fns';
import { updateVehicle } from '@/services/vehicleService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Generate time slots (6 AM to 10 PM)
const TIME_SLOTS = Array.from({ length: 17 }, (_, i) => {
    const hour24 = i + 6;
    const hour12 = hour24 > 12 ? hour24 - 12 : hour24 === 0 ? 12 : hour24;
    const ampm = hour24 >= 12 ? 'PM' : 'AM';
    return { value: hour24, label: `${hour12}:00 ${ampm}` };
});

// Generate next 60 days
const generateDates = () => {
    const dates: Date[] = [];
    const today = new Date();
    for (let i = 1; i <= 60; i++) {
        dates.push(addDays(today, i));
    }
    return dates;
};

export default function VehicleDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { profile, user } = useAuth();
    const router = useRouter();

    const [vehicle, setVehicle] = useState<VehicleWithOwner | null>(null);
    const [loading, setLoading] = useState(true);
    const [imageIndex, setImageIndex] = useState(0);
    const [bookingLoading, setBookingLoading] = useState(false);

    // Date & time selection state
    const [startDate, setStartDate] = useState<Date>(addDays(new Date(), 1));
    const [endDate, setEndDate] = useState<Date>(addDays(new Date(), 1));
    const [startHour, setStartHour] = useState(9);
    const [endHour, setEndHour] = useState(18);

    // Modal visibility states
    const [showStartDatePicker, setShowStartDatePicker] = useState(false);
    const [showEndDatePicker, setShowEndDatePicker] = useState(false);
    const [showStartTimePicker, setShowStartTimePicker] = useState(false);
    const [showEndTimePicker, setShowEndTimePicker] = useState(false);

    const availableDates = useMemo(() => generateDates(), []);

    useEffect(() => {
        const load = async () => {
            if (!id) return;
            try {
                const data = await getVehicleDetailsById(id);
                setVehicle(data);
            } catch (e) {
                console.error(e);
            }
            setLoading(false);
        };
        load();
    }, [id]);

    // Calculate total hours and amount
    const { rentalHours, totalAmount } = useMemo(() => {
        const start = setMinutes(setHours(new Date(startDate), startHour), 0);
        const end = setMinutes(setHours(new Date(endDate), endHour), 0);
        const hours = Math.max(1, differenceInHours(end, start));
        const amount = hours * (vehicle?.price_per_day || 0);
        return { rentalHours: hours, totalAmount: amount };
    }, [startDate, endDate, startHour, endHour, vehicle?.price_per_day]);

    const isOwner = profile?.role === 'owner';
    const isMyVehicle = vehicle?.owner_id === user?.id;

    const handleStartDateSelect = (date: Date) => {
        setStartDate(date);
        if (date > endDate) setEndDate(date);
        setShowStartDatePicker(false);
    };

    const handleEndDateSelect = (date: Date) => {
        setEndDate(date);
        setShowEndDatePicker(false);
    };

    const handleBooking = async () => {
        if (!vehicle || !user) return;

        if (profile?.is_blocked) {
            Alert.alert('Account Restricted', 'Your account has been restricted. You cannot make bookings.');
            return;
        }

        const startDateTime = setSeconds(setMilliseconds(setMinutes(setHours(new Date(startDate), startHour), 0), 0), 0);
        const endDateTime = setSeconds(setMilliseconds(setMinutes(setHours(new Date(endDate), endHour), 0), 0), 0);

        if (rentalHours < 1) {
            Alert.alert('Invalid', 'Return must be after pickup time.');
            return;
        }

        setBookingLoading(true);
        try {
            await createBookingRequest({
                vehicle_id: vehicle.id,
                owner_id: vehicle.owner_id,
                start_date: startDateTime.toISOString(),
                end_date: endDateTime.toISOString(),
                total_amount: totalAmount,
            });
            Alert.alert('Booking Requested!', 'Your booking request has been sent to the owner. They will respond within 24 hours.', [
                { text: 'View Bookings', onPress: () => router.push('/(tabs)/bookings') },
            ]);
        } catch (e: any) {
            Alert.alert('Error', e.message || 'Failed to create booking');
        }
        setBookingLoading(false);
    };

    const handleAdminAction = async (action: 'approve' | 'reject') => {
        if (!vehicle) return;
        Alert.alert(
            action === 'approve' ? 'Approve Vehicle' : 'Reject Vehicle',
            `Are you sure you want to ${action} this vehicle?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Confirm',
                    style: action === 'reject' ? 'destructive' : 'default',
                    onPress: async () => {
                        setLoading(true);
                        try {
                            const updates = action === 'approve'
                                ? { vehicle_status: 'approved', verified_at: new Date().toISOString(), verified_by_admin_id: user?.id }
                                : { vehicle_status: 'rejected' };

                            await updateVehicle(vehicle.id, updates as any);
                            Alert.alert('Success', `Vehicle ${action}d successfully`, [{ text: 'OK', onPress: () => router.back() }]);
                        } catch (e: any) {
                            Alert.alert('Error', e.message);
                        }
                        setLoading(false);
                    }
                }
            ]
        );
    };

    // Date picker modal component
    const DatePickerModal = ({ visible, onClose, onSelect, minDate, title }: {
        visible: boolean; onClose: () => void; onSelect: (d: Date) => void; minDate?: Date; title: string;
    }) => (
        <Modal visible={visible} transparent animationType="slide">
            <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>{title}</Text>
                        <TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color={Colors.text} /></TouchableOpacity>
                    </View>
                    <FlatList
                        data={availableDates.filter(d => !minDate || d >= minDate)}
                        keyExtractor={(item) => item.toISOString()}
                        showsVerticalScrollIndicator={false}
                        style={{ maxHeight: 400 }}
                        renderItem={({ item }) => {
                            const isSelected = format(item, 'yyyy-MM-dd') === format(
                                title.includes('Pickup') ? startDate : endDate, 'yyyy-MM-dd'
                            );
                            return (
                                <TouchableOpacity
                                    style={[styles.dateItem, isSelected && styles.dateItemSelected]}
                                    onPress={() => onSelect(item)}
                                >
                                    <View>
                                        <Text style={[styles.dateItemDay, isSelected && styles.dateItemTextSelected]}>
                                            {format(item, 'EEEE')}
                                        </Text>
                                        <Text style={[styles.dateItemFull, isSelected && styles.dateItemTextSelected]}>
                                            {format(item, 'dd MMM yyyy')}
                                        </Text>
                                    </View>
                                    {isSelected && <Ionicons name="checkmark-circle" size={24} color={Colors.white} />}
                                </TouchableOpacity>
                            );
                        }}
                    />
                </View>
            </TouchableOpacity>
        </Modal>
    );

    // Time picker modal
    const TimePickerModal = ({ visible, onClose, onSelect, selectedHour, title }: {
        visible: boolean; onClose: () => void; onSelect: (h: number) => void; selectedHour: number; title: string;
    }) => (
        <Modal visible={visible} transparent animationType="slide">
            <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>{title}</Text>
                        <TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color={Colors.text} /></TouchableOpacity>
                    </View>
                    <FlatList
                        data={TIME_SLOTS}
                        keyExtractor={(item) => item.value.toString()}
                        showsVerticalScrollIndicator={false}
                        style={{ maxHeight: 400 }}
                        renderItem={({ item }) => {
                            const isSelected = item.value === selectedHour;
                            return (
                                <TouchableOpacity
                                    style={[styles.timeItem, isSelected && styles.timeItemSelected]}
                                    onPress={() => { onSelect(item.value); onClose(); }}
                                >
                                    <View style={styles.timeItemLeft}>
                                        <Ionicons name="time-outline" size={20} color={isSelected ? Colors.white : Colors.textSecondary} />
                                        <Text style={[styles.timeItemText, isSelected && styles.timeItemTextSelected]}>
                                            {item.label}
                                        </Text>
                                    </View>
                                    {isSelected && <Ionicons name="checkmark-circle" size={22} color={Colors.white} />}
                                </TouchableOpacity>
                            );
                        }}
                    />
                </View>
            </TouchableOpacity>
        </Modal>
    );

    // Get time label from hour
    const getTimeLabel = (hour: number) => {
        const slot = TIME_SLOTS.find(s => s.value === hour);
        return slot?.label || `${hour}:00`;
    };

    if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;
    if (!vehicle) return <View style={styles.center}><Ionicons name="alert-circle" size={60} color={Colors.textMuted} /><Text style={styles.errorText}>Vehicle not found</Text></View>;

    return (
        <>
            <Stack.Screen options={{ title: vehicle.title, headerStyle: { backgroundColor: Colors.background }, headerTintColor: Colors.text }} />
            <ScrollView style={styles.container}>
                {/* Image Carousel */}
                <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} onMomentumScrollEnd={(e) => setImageIndex(Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH))}>
                    {vehicle.images && vehicle.images.length > 0 ? (
                        vehicle.images.map((img, i) => (
                            <Image key={i} source={{ uri: img.image_url }} style={styles.heroImage} resizeMode="cover" />
                        ))
                    ) : (
                        <View style={[styles.heroImage, styles.noImage]}><Ionicons name="image-outline" size={60} color={Colors.textMuted} /></View>
                    )}
                </ScrollView>
                {vehicle.images && vehicle.images.length > 1 && (
                    <View style={styles.dots}>
                        {vehicle.images.map((_, i) => <View key={i} style={[styles.dot, i === imageIndex && styles.dotActive]} />)}
                    </View>
                )}

                {/* Info */}
                <View style={styles.infoSection}>
                    <View style={styles.row}>
                        <Text style={styles.title}>{vehicle.title}</Text>
                        <View style={[styles.typeBadge, { backgroundColor: vehicle.vehicle_type === 'car' ? 'rgba(59,130,246,0.15)' : 'rgba(16,185,129,0.15)' }]}>
                            <Text style={[styles.typeBadgeText, { color: vehicle.vehicle_type === 'car' ? Colors.info : Colors.primary }]}>
                                {vehicle.vehicle_type === 'car' ? '🚗 Car' : '🏍️ Bike'}
                            </Text>
                        </View>
                    </View>
                    <Text style={styles.brandModel}>{vehicle.brand} {vehicle.model} • {vehicle.year}</Text>

                    <View style={styles.priceRow}>
                        <Text style={styles.price}>₹{vehicle.price_per_day}</Text>
                        <Text style={styles.perHour}> /hr</Text>
                    </View>
                    <Text style={styles.freeCancel}>✓ Free cancellation up to 24 hours before</Text>

                    <View style={styles.detailsGrid}>
                        <View style={styles.detailItem}>
                            <Ionicons name="location" size={18} color={Colors.primary} />
                            <Text style={styles.detailText}>{vehicle.location}</Text>
                        </View>
                        {vehicle.registration_number && (
                            <View style={styles.detailItem}>
                                <Ionicons name="document-text" size={18} color={Colors.info} />
                                <Text style={styles.detailText}>{vehicle.registration_number}</Text>
                            </View>
                        )}
                    </View>

                    {vehicle.description && (
                        <View style={styles.descSection}>
                            <Text style={styles.sectionTitle}>Description</Text>
                            <Text style={styles.description}>{vehicle.description}</Text>
                        </View>
                    )}

                    {/* Owner info */}
                    {vehicle.owner && (
                        <View style={styles.ownerCard}>
                            <View style={styles.ownerAvatar}>
                                <Text style={styles.ownerAvatarText}>{vehicle.owner.full_name?.charAt(0) || '?'}</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.ownerName}>{vehicle.owner.full_name}</Text>
                                <Text style={styles.ownerSince}>Member since {new Date(vehicle.owner.created_at).getFullYear()}</Text>
                            </View>
                            <View style={styles.verifiedBadge}>
                                <Ionicons name="checkmark-circle" size={14} color="#10b981" />
                                <Text style={styles.verifiedText}>Verified</Text>
                            </View>
                        </View>
                    )}

                    {/* Security Deposit */}
                    {vehicle.security_deposit_text && (
                        <View style={styles.depositCard}>
                            <Ionicons name="shield-checkmark" size={20} color={Colors.warning} />
                            <Text style={styles.depositText}>{vehicle.security_deposit_text}</Text>
                        </View>
                    )}

                    {/* Owner Actions */}
                    {(isOwner || isMyVehicle) && vehicle.vehicle_status !== 'approved' && (
                        <View style={styles.section}>
                            <View style={[
                                styles.statusBanner,
                                vehicle.vehicle_status === 'rejected' ? { backgroundColor: Colors.error + '20' } : { backgroundColor: Colors.warning + '20' }
                            ]}>
                                <Ionicons
                                    name={vehicle.vehicle_status === 'rejected' ? "alert-circle" : "time"}
                                    size={24}
                                    color={vehicle.vehicle_status === 'rejected' ? Colors.error : Colors.warning}
                                />
                                <View style={{ flex: 1 }}>
                                    <Text style={[
                                        styles.statusTitle,
                                        { color: vehicle.vehicle_status === 'rejected' ? Colors.error : Colors.warning }
                                    ]}>
                                        {vehicle.vehicle_status === 'rejected' ? 'Verification Rejected' : vehicle.vehicle_status === 'pending_verification' ? 'Pending Verification' : 'Draft Vehicle'}
                                    </Text>
                                    <Text style={styles.statusDesc}>
                                        {vehicle.vehicle_status === 'rejected'
                                            ? vehicle.rejection_reason || 'Please update documents.'
                                            : vehicle.vehicle_status === 'pending_verification'
                                                ? 'Admin is reviewing your details.'
                                                : 'Complete KYC to go live.'}
                                    </Text>
                                </View>
                            </View>

                            {(vehicle.vehicle_status === 'draft' || vehicle.vehicle_status === 'rejected') && (
                                <TouchableOpacity
                                    style={styles.verifyButton}
                                    onPress={() => router.push(`/vehicles/${vehicle.id}/kyc`)}
                                >
                                    <Text style={styles.verifyButtonText}>
                                        {vehicle.vehicle_status === 'rejected' ? 'Re-upload Documents' : 'Complete Verification'}
                                    </Text>
                                    <Ionicons name="arrow-forward" size={20} color={Colors.white} />
                                </TouchableOpacity>
                            )}

                            <TouchableOpacity
                                style={[styles.verifyButton, { marginTop: Spacing.md, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border }]}
                                onPress={() => router.push(`/vehicles/${vehicle.id}/edit`)}
                            >
                                <Ionicons name="create-outline" size={20} color={Colors.text} />
                                <Text style={[styles.verifyButtonText, { color: Colors.text }]}>Edit Vehicle Details</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* ADMIN: KYC Verification Section */}
                    {profile?.role === 'admin' && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>KYC Documents (Admin Only)</Text>
                            <View style={styles.kycGrid}>
                                {[
                                    { label: 'RC Front', url: vehicle.rc_front_url },
                                    { label: 'RC Back', url: vehicle.rc_back_url },
                                    { label: 'Insurance', url: vehicle.insurance_url },
                                    { label: 'PAN Card', url: vehicle.pan_card_url },
                                    { label: 'Aadhaar Front', url: vehicle.aadhaar_front_url },
                                    { label: 'Aadhaar Back', url: vehicle.aadhaar_back_url },
                                ].map((doc, idx) => (
                                    <View key={idx} style={styles.kycItem}>
                                        <Text style={styles.kycLabel}>{doc.label}</Text>
                                        {doc.url ? (
                                            <TouchableOpacity onPress={() => {/* View full screen TODO */ }}>
                                                <Image source={{ uri: doc.url }} style={styles.kycImage} resizeMode="contain" />
                                            </TouchableOpacity>
                                        ) : (
                                            <View style={[styles.kycImage, styles.noImage]}>
                                                <Text style={styles.errorText}>Missing</Text>
                                            </View>
                                        )}
                                    </View>
                                ))}
                            </View>

                            <View style={styles.adminActions}>
                                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.success }]} onPress={() => handleAdminAction('approve')}>
                                    <Text style={styles.actionBtnText}>✓ Approve Vehicle</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.error }]} onPress={() => handleAdminAction('reject')}>
                                    <Text style={styles.actionBtnText}>✗ Reject Vehicle</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </View>

                {/* Booking Section – Date & Time Picker */}
                {vehicle.vehicle_status === 'approved' && profile?.role !== 'admin' && !isOwner && !isMyVehicle && (
                    <View style={styles.bookingSection}>
                        <View style={styles.bookingHeader}>
                            <Ionicons name="calendar" size={20} color={Colors.primary} />
                            <Text style={styles.bookingSectionTitle}>Request to Book</Text>
                        </View>
                        <Text style={styles.bookingSubtitle}>Select rental date & time for {vehicle.title}</Text>

                        {/* Pickup Date & Time */}
                        <Text style={styles.fieldLabel}>Pickup Date & Time</Text>
                        <View style={styles.dateTimeRow}>
                            <TouchableOpacity style={styles.datePickerBtn} onPress={() => setShowStartDatePicker(true)}>
                                <Ionicons name="calendar-outline" size={18} color={Colors.textSecondary} />
                                <Text style={styles.datePickerText}>{format(startDate, 'dd MMM yyyy')}</Text>
                                <Ionicons name="chevron-down" size={16} color={Colors.textMuted} />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.timePickerBtn} onPress={() => setShowStartTimePicker(true)}>
                                <Ionicons name="time-outline" size={18} color={Colors.textSecondary} />
                                <Text style={styles.timePickerText}>{getTimeLabel(startHour)}</Text>
                                <Ionicons name="chevron-down" size={16} color={Colors.textMuted} />
                            </TouchableOpacity>
                        </View>

                        {/* Return Date & Time */}
                        <Text style={styles.fieldLabel}>Return Date & Time</Text>
                        <View style={styles.dateTimeRow}>
                            <TouchableOpacity style={styles.datePickerBtn} onPress={() => setShowEndDatePicker(true)}>
                                <Ionicons name="calendar-outline" size={18} color={Colors.textSecondary} />
                                <Text style={styles.datePickerText}>{format(endDate, 'dd MMM yyyy')}</Text>
                                <Ionicons name="chevron-down" size={16} color={Colors.textMuted} />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.timePickerBtn} onPress={() => setShowEndTimePicker(true)}>
                                <Ionicons name="time-outline" size={18} color={Colors.textSecondary} />
                                <Text style={styles.timePickerText}>{getTimeLabel(endHour)}</Text>
                                <Ionicons name="chevron-down" size={16} color={Colors.textMuted} />
                            </TouchableOpacity>
                        </View>

                        {/* Duration */}
                        <View style={styles.durationBadge}>
                            <Ionicons name="time" size={20} color={Colors.primary} />
                            <Text style={styles.durationText}>{rentalHours} hour{rentalHours !== 1 ? 's' : ''}</Text>
                        </View>

                        {/* Price Breakdown */}
                        <View style={styles.priceBreakdown}>
                            <View style={styles.priceBreakdownRow}>
                                <Text style={styles.priceBreakdownLabel}>₹{vehicle.price_per_day}/hr × {rentalHours} hour{rentalHours !== 1 ? 's' : ''}</Text>
                                <Text style={styles.priceBreakdownValue}>₹{totalAmount.toLocaleString()}</Text>
                            </View>
                            <View style={styles.priceDivider} />
                            <View style={styles.priceBreakdownRow}>
                                <Text style={styles.priceTotalLabel}>Total</Text>
                                <Text style={styles.priceTotalValue}>₹{totalAmount.toLocaleString()}</Text>
                            </View>
                        </View>

                        {/* Info Notes */}
                        <View style={styles.infoNote}>
                            <Ionicons name="information-circle" size={18} color="#60a5fa" />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.infoNoteTitle}>How it works</Text>
                                <Text style={styles.infoNoteText}>The owner will review your request and respond within 24 hours. Payment will be collected after approval.</Text>
                            </View>
                        </View>

                        <View style={styles.depositNote}>
                            <Ionicons name="lock-closed" size={18} color="#fbbf24" />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.depositNoteTitle}>Security Deposit</Text>
                                <Text style={styles.depositNoteText}>A refundable security deposit (₹500-₹2000) will be collected in cash at pickup.</Text>
                            </View>
                        </View>

                        {/* Book Button */}
                        <TouchableOpacity
                            style={[styles.bookButton, (bookingLoading || rentalHours < 1) && { opacity: 0.5 }]}
                            onPress={handleBooking}
                            disabled={bookingLoading || rentalHours < 1}
                        >
                            {bookingLoading ? (
                                <ActivityIndicator color={Colors.white} />
                            ) : (
                                <Text style={styles.bookButtonText}>Send Booking Request</Text>
                            )}
                        </TouchableOpacity>
                        <Text style={styles.noChargeText}>🔒 You won't be charged yet</Text>
                    </View>
                )}

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Modals */}
            <DatePickerModal visible={showStartDatePicker} onClose={() => setShowStartDatePicker(false)} onSelect={handleStartDateSelect} title="Select Pickup Date" />
            <DatePickerModal visible={showEndDatePicker} onClose={() => setShowEndDatePicker(false)} onSelect={handleEndDateSelect} minDate={startDate} title="Select Return Date" />
            <TimePickerModal visible={showStartTimePicker} onClose={() => setShowStartTimePicker(false)} onSelect={setStartHour} selectedHour={startHour} title="Select Pickup Time" />
            <TimePickerModal visible={showEndTimePicker} onClose={() => setShowEndTimePicker(false)} onSelect={setEndHour} selectedHour={endHour} title="Select Return Time" />
        </>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
    heroImage: { width: SCREEN_WIDTH, height: 280 },
    noImage: { backgroundColor: Colors.surface, justifyContent: 'center', alignItems: 'center' },
    dots: { flexDirection: 'row', justifyContent: 'center', paddingVertical: Spacing.md },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.border, marginHorizontal: 3 },
    dotActive: { backgroundColor: Colors.primary, width: 20 },
    errorText: { color: Colors.textMuted, fontSize: FontSize.md, marginTop: Spacing.md },

    // Info
    infoSection: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    title: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.text, flex: 1, marginRight: Spacing.sm },
    typeBadge: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: Radius.full },
    typeBadgeText: { fontSize: FontSize.sm, fontWeight: '600' },
    brandModel: { fontSize: FontSize.md, color: Colors.textSecondary, marginTop: Spacing.xs },
    priceRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: Spacing.lg },
    price: { fontSize: FontSize.xxxl, fontWeight: '800', color: Colors.primary },
    perHour: { fontSize: FontSize.md, color: Colors.textSecondary },
    freeCancel: { fontSize: FontSize.sm, color: '#34d399', marginTop: Spacing.sm },
    detailsGrid: { marginTop: Spacing.xl, gap: Spacing.md },
    detailItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    detailText: { fontSize: FontSize.md, color: Colors.text },
    descSection: { marginTop: Spacing.xl },
    sectionTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text, marginBottom: Spacing.md },
    description: { fontSize: FontSize.md, color: Colors.textSecondary, lineHeight: 22 },

    // Owner
    ownerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, padding: Spacing.lg, marginTop: Spacing.xl },
    ownerAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md },
    ownerAvatarText: { color: Colors.white, fontWeight: '700', fontSize: FontSize.lg },
    ownerName: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text },
    ownerSince: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
    verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(16,185,129,0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full, borderWidth: 1, borderColor: 'rgba(16,185,129,0.3)' },
    verifiedText: { fontSize: FontSize.xs, color: '#10b981', fontWeight: '600' },

    // Deposit
    depositCard: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, backgroundColor: 'rgba(245,158,11,0.1)', borderRadius: Radius.md, padding: Spacing.lg, marginTop: Spacing.xl, borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)' },
    depositText: { flex: 1, fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },

    // Booking Section
    bookingSection: { marginTop: Spacing.xxl, marginHorizontal: Spacing.xl, backgroundColor: Colors.card, borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.border, padding: Spacing.xl },
    bookingHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.xs },
    bookingSectionTitle: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.text },
    bookingSubtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.xl },
    fieldLabel: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.text, marginBottom: Spacing.sm, marginTop: Spacing.md },

    dateTimeRow: { flexDirection: 'row', gap: Spacing.sm },
    datePickerBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: 14 },
    datePickerText: { flex: 1, fontSize: FontSize.sm, color: Colors.text, fontWeight: '500' },
    timePickerBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: 14 },
    timePickerText: { flex: 1, fontSize: FontSize.sm, color: Colors.text, fontWeight: '500' },

    durationBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, paddingVertical: Spacing.md, marginTop: Spacing.lg },
    durationText: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text },

    priceBreakdown: { backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.lg, marginTop: Spacing.sm },
    priceBreakdownRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    priceBreakdownLabel: { fontSize: FontSize.sm, color: Colors.textSecondary },
    priceBreakdownValue: { fontSize: FontSize.sm, color: Colors.text },
    priceDivider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.md },
    priceTotalLabel: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text },
    priceTotalValue: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.primary },

    infoNote: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, backgroundColor: 'rgba(59,130,246,0.1)', borderWidth: 1, borderColor: 'rgba(59,130,246,0.2)', borderRadius: Radius.md, padding: Spacing.md, marginTop: Spacing.lg },
    infoNoteTitle: { fontSize: FontSize.sm, fontWeight: '600', color: '#60a5fa' },
    infoNoteText: { fontSize: FontSize.xs, color: 'rgba(96,165,250,0.8)', marginTop: 2, lineHeight: 18 },

    depositNote: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, backgroundColor: 'rgba(251,191,36,0.1)', borderWidth: 1, borderColor: 'rgba(251,191,36,0.2)', borderRadius: Radius.md, padding: Spacing.md, marginTop: Spacing.sm },
    depositNoteTitle: { fontSize: FontSize.sm, fontWeight: '600', color: '#fbbf24' },
    depositNoteText: { fontSize: FontSize.xs, color: 'rgba(251,191,36,0.8)', marginTop: 2, lineHeight: 18 },

    bookButton: { backgroundColor: Colors.primary, borderRadius: Radius.md, paddingVertical: 16, alignItems: 'center', marginTop: Spacing.xl },
    bookButtonText: { color: Colors.white, fontSize: FontSize.lg, fontWeight: '700' },
    noChargeText: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.sm },

    // Modals
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: Colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: Spacing.xl, maxHeight: '70%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
    modalTitle: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.text },

    dateItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg, borderRadius: Radius.md, marginBottom: Spacing.xs },
    dateItemSelected: { backgroundColor: Colors.primary },
    dateItemDay: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: 2 },
    dateItemFull: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text },
    dateItemTextSelected: { color: Colors.white },

    timeItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg, borderRadius: Radius.md, marginBottom: Spacing.xs },
    timeItemSelected: { backgroundColor: Colors.primary },
    timeItemLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
    timeItemText: { fontSize: FontSize.md, fontWeight: '500', color: Colors.text },
    timeItemTextSelected: { color: Colors.white },

    // Admin Styles
    section: { marginTop: Spacing.xl, paddingTop: Spacing.lg, borderTopWidth: 1, borderTopColor: Colors.border },
    kycGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, marginTop: Spacing.md },
    kycItem: { width: '47%', marginBottom: Spacing.md },
    kycLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, marginBottom: 4 },
    kycImage: { width: '100%', height: 100, backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, justifyContent: 'center', alignItems: 'center' },
    adminActions: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.lg },
    statusBanner: { flexDirection: 'row', gap: Spacing.md, padding: Spacing.md, borderRadius: Radius.md, alignItems: 'center', marginBottom: Spacing.md },
    statusTitle: { fontSize: FontSize.md, fontWeight: '600', marginBottom: 2 },
    statusDesc: { fontSize: FontSize.sm, color: Colors.textSecondary },
    verifyButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, backgroundColor: Colors.primary, padding: Spacing.md, borderRadius: Radius.md },
    verifyButtonText: { color: Colors.white, fontSize: FontSize.md, fontWeight: '600' },
    actionBtn: { flex: 1, paddingVertical: 14, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
    actionBtnText: { color: Colors.white, fontWeight: '700', fontSize: FontSize.md },
});
