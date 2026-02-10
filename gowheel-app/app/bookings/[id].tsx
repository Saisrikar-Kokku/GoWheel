import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity, Image,
    ActivityIndicator, Alert, RefreshControl, TextInput, Modal, Platform, Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Spacing, FontSize, Radius } from '@/lib/theme';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { approveBooking, rejectBooking } from '@/services/bookingService';
import { BookingWithDetails, BookingStatus, RideStatus, PaymentMethod } from '@/types/booking';
import { isChatEnabled } from '@/types/chat';
import { format } from 'date-fns';
import { rideApi } from '@/lib/api';

// ===============================
// STATUS CONFIGURATION
// ===============================
const STATUS_META: Record<BookingStatus, { icon: string; label: string }> = {
    requested: { icon: 'time', label: 'Requested' },
    approved: { icon: 'checkmark-circle', label: 'Approved' },
    confirmed: { icon: 'checkmark-done-circle', label: 'Confirmed' },
    rejected: { icon: 'close-circle', label: 'Rejected' },
    cancelled: { icon: 'ban', label: 'Cancelled' },
};

const paymentMethods: { key: PaymentMethod; label: string; icon: string }[] = [
    { key: 'upi', label: 'UPI', icon: 'phone-portrait' },
    { key: 'cash', label: 'Cash', icon: 'cash' },
    { key: 'card', label: 'Card', icon: 'card' },
    { key: 'online', label: 'Online Transfer', icon: 'globe' },
];

export default function BookingDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { profile, user } = useAuth();
    const { colors, shadow } = useTheme();
    const router = useRouter();
    const isOwner = profile?.role === 'owner';

    const [booking, setBooking] = useState<BookingWithDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    // OTP states
    const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
    const [otpInput, setOtpInput] = useState('');
    const [otpType, setOtpType] = useState<'start' | 'end' | null>(null);
    const [otpModalVisible, setOtpModalVisible] = useState(false);

    // Payment states
    const [paymentModalVisible, setPaymentModalVisible] = useState(false);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);

    const getStatusColor = (status: BookingStatus) => {
        const map: Record<BookingStatus, string> = {
            requested: colors.warning,
            approved: '#3b82f6',
            confirmed: colors.success,
            rejected: colors.error,
            cancelled: colors.textMuted,
        };
        return map[status];
    };

    // ===============================
    // DATA LOADING
    // ===============================
    const loadBooking = useCallback(async () => {
        if (!id) return;
        const { data, error } = await supabase.from('bookings').select('*').eq('id', id).single();
        if (error || !data) { setLoading(false); return; }

        const { data: vehicle } = await supabase
            .from('vehicles')
            .select('id, title, brand, model, vehicle_type, price_per_day, location, latitude, longitude, registration_number')
            .eq('id', data.vehicle_id).single();

        let images: any[] = [];
        if (vehicle) {
            const { data: vehicleImages } = await supabase
                .from('vehicle_images')
                .select('id, image_url, is_primary')
                .eq('vehicle_id', vehicle.id)
                .order('is_primary', { ascending: false });
            images = vehicleImages || [];
        }

        const { data: renter } = await supabase
            .from('profiles')
            .select('id, full_name, phone, email')
            .eq('id', data.renter_id).single();

        const { data: owner } = await supabase
            .from('profiles')
            .select('id, full_name, phone')
            .eq('id', data.owner_id).single();

        setBooking({
            ...data,
            vehicle: vehicle ? { ...vehicle, images } : undefined,
            renter: renter || undefined,
            owner: owner || undefined,
        });
        setLoading(false);
    }, [id]);

    useEffect(() => { loadBooking(); }, [loadBooking]);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadBooking();
        setRefreshing(false);
    };

    // ===============================
    // REAL-TIME SUBSCRIPTION
    // ===============================
    useEffect(() => {
        if (!id) return;
        const channel = supabase
            .channel(`booking-${id}`)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'bookings',
                filter: `id=eq.${id}`,
            }, () => { loadBooking(); })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [id, loadBooking]);

    // ===============================
    // OWNER ACTIONS
    // ===============================
    const handleApprove = async () => {
        Alert.alert('Approve Booking', 'The renter will be notified and can proceed to payment.', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Yes, Approve', onPress: async () => {
                    setActionLoading(true);
                    try {
                        await approveBooking(booking!.id);
                        Alert.alert('✅ Approved', 'Booking has been approved. Waiting for renter payment.');
                        loadBooking();
                    } catch (e: any) { Alert.alert('Error', e.message); }
                    setActionLoading(false);
                },
            },
        ]);
    };

    const handleReject = () => {
        Alert.alert('Reject Booking', 'The renter will be notified. This cannot be undone.', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Reject', style: 'destructive', onPress: async () => {
                    setActionLoading(true);
                    try {
                        await rejectBooking(booking!.id);
                        Alert.alert('Rejected', 'Booking has been rejected.');
                        loadBooking();
                    } catch (e: any) { Alert.alert('Error', e.message); }
                    setActionLoading(false);
                },
            },
        ]);
    };

    const handleCancel = () => {
        Alert.alert('Cancel Booking', 'Are you sure you want to cancel?', [
            { text: 'No', style: 'cancel' },
            {
                text: 'Cancel Booking', style: 'destructive', onPress: async () => {
                    setActionLoading(true);
                    try {
                        await rideApi.cancelBooking(booking!.id, isOwner ? 'owner' : 'renter');
                        Alert.alert('Cancelled', 'Booking has been cancelled.');
                        loadBooking();
                    } catch (e: any) { Alert.alert('Error', e.message); }
                    setActionLoading(false);
                },
            },
        ]);
    };

    // ===============================
    // OTP GENERATION (OWNER)
    // ===============================
    const handleGenerateOTP = async (type: 'start' | 'end') => {
        setActionLoading(true);
        try {
            const fn = type === 'start' ? rideApi.generateStartOTP : rideApi.generateEndOTP;
            const result = await fn(booking!.id);
            if (result.otp) {
                setGeneratedOtp(result.otp);
            }
            Alert.alert(
                `🔑 ${type === 'start' ? 'Start' : 'End'} OTP Generated`,
                result.message || `The OTP has been sent to the renter's email. You can also share it directly.`
            );
            loadBooking();
        } catch (e: any) { Alert.alert('Error', e.message); }
        setActionLoading(false);
    };

    // ===============================
    // OTP VERIFICATION (RENTER)
    // ===============================
    const handleVerifyOTP = async () => {
        if (!otpInput || otpInput.length !== 6) {
            Alert.alert('Invalid OTP', 'Please enter the 6-digit OTP.');
            return;
        }
        setActionLoading(true);
        try {
            const fn = otpType === 'start' ? rideApi.verifyStartOTP : rideApi.verifyEndOTP;
            const result = await fn(booking!.id, otpInput);
            setOtpModalVisible(false);
            setOtpInput('');
            if (otpType === 'start') {
                Alert.alert('🎉 Ride Started!', 'Your ride has started. Enjoy your trip!');
            } else {
                Alert.alert('✅ Ride Completed!', 'Your ride is complete. Thank you for using GoWheel!');
            }
            loadBooking();
        } catch (e: any) {
            Alert.alert('Error', e.message || 'Invalid or expired OTP.');
        }
        setActionLoading(false);
    };

    // ===============================
    // PAYMENT (RENTER)
    // ===============================
    const handlePayment = async () => {
        if (!selectedPaymentMethod) {
            Alert.alert('Select Method', 'Please select a payment method.');
            return;
        }
        setActionLoading(true);
        try {
            const { error } = await supabase.from('bookings').update({
                payment_method: selectedPaymentMethod,
                payment_status: 'pending',
            }).eq('id', booking!.id);

            if (error) throw error;

            setPaymentModalVisible(false);
            Alert.alert('💳 Payment Submitted', 'Your payment has been submitted. The owner will confirm it.');
            loadBooking();
        } catch (e: any) {
            Alert.alert('Error', e.message || 'Failed to submit payment.');
        }
        setActionLoading(false);
    };

    // ===============================
    // PAYMENT CONFIRMATION (OWNER)
    // ===============================
    const handleConfirmPayment = async () => {
        Alert.alert('Confirm Payment', `Confirm that you received ₹${booking!.total_amount} from the renter?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Confirm Payment', onPress: async () => {
                    setActionLoading(true);
                    try {
                        const { error } = await supabase.from('bookings').update({
                            payment_status: 'paid',
                            status: 'confirmed',
                            paid_at: new Date().toISOString(),
                            payment_confirmed_by: user?.id,
                            payment_confirmed_at: new Date().toISOString(),
                        }).eq('id', booking!.id);

                        if (error) throw error;
                        Alert.alert('✅ Payment Confirmed', 'Booking is now confirmed. The renter can proceed with inspection photos.');
                        loadBooking();
                    } catch (e: any) { Alert.alert('Error', e.message); }
                    setActionLoading(false);
                },
            },
        ]);
    };

    // ===============================
    // RENDER
    // ===============================
    if (loading) return <View style={[s.center, { backgroundColor: colors.background }]}><ActivityIndicator size="large" color={colors.primary} /></View>;
    if (!booking) return <View style={[s.center, { backgroundColor: colors.background }]}><Text style={{ color: colors.textMuted, fontSize: FontSize.md }}>Booking not found</Text></View>;

    const sc = getStatusColor(booking.status);
    const meta = STATUS_META[booking.status];
    const primaryImage = booking.vehicle?.images?.[0];
    const canChat = isChatEnabled(booking.status);
    const startDate = new Date(booking.start_date);
    const endDate = new Date(booking.end_date);
    const hours = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60)));

    const canPay = !isOwner && booking.status === 'approved' &&
        booking.payment_status !== 'paid' && booking.payment_status !== 'pending';
    const isPendingPayment = booking.status === 'approved' && booking.payment_status === 'pending';
    const isConfirmed = booking.status === 'confirmed' && booking.payment_status === 'paid';

    return (
        <>
            <Stack.Screen options={{
                title: 'Booking Details',
                headerStyle: { backgroundColor: colors.background },
                headerTintColor: colors.text,
            }} />

            <ScrollView
                style={{ flex: 1, backgroundColor: colors.background }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
            >
                {/* Vehicle Card */}
                <View style={[s.vehicleCard, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                    {primaryImage ? (
                        <Image source={{ uri: primaryImage.image_url }} style={s.vehicleImage} />
                    ) : (
                        <View style={[s.vehicleImage, s.noImage, { backgroundColor: colors.surface }]}>
                            <Ionicons name="car" size={40} color={colors.textMuted} />
                        </View>
                    )}
                    <View style={s.vehicleInfo}>
                        <Text style={[s.vehicleTitle, { color: colors.text }]}>{booking.vehicle?.title || 'Vehicle'}</Text>
                        <Text style={[s.vehicleSub, { color: colors.textSecondary }]}>{booking.vehicle?.brand} {booking.vehicle?.model}</Text>
                        <Text style={[s.vehicleSub, { color: colors.textSecondary }]}>
                            {format(startDate, 'MMM d, h:mm a')} → {format(endDate, 'MMM d, h:mm a')}
                        </Text>
                        {booking.status === 'confirmed' && booking.vehicle?.latitude && booking.vehicle?.longitude && (
                            <TouchableOpacity
                                style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 4 }}
                                onPress={() => {
                                    const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
                                    const latLng = `${booking.vehicle?.latitude},${booking.vehicle?.longitude}`;
                                    const label = booking.vehicle?.title;
                                    const url = Platform.select({
                                        ios: `${scheme}${label}@${latLng}`,
                                        android: `${scheme}${latLng}(${label})`
                                    });
                                    if (url) Linking.openURL(url);
                                }}
                            >
                                <Ionicons name="navigate-circle" size={18} color={colors.primary} />
                                <Text style={{ color: colors.primary, fontWeight: '600', fontSize: FontSize.sm }}>Get Directions</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* Status Banner */}
                <View style={s.section}>
                    <View style={[s.statusBanner, { backgroundColor: `${sc}15`, borderColor: sc }]}>
                        <Ionicons name={meta.icon as any} size={28} color={sc} />
                        <View style={{ flex: 1 }}>
                            <Text style={[s.statusLabel, { color: sc }]}>{meta.label}</Text>
                            <Text style={[s.statusSubText, { color: colors.textSecondary }]}>
                                {booking.status === 'requested' && '⏳ Waiting for owner approval'}
                                {booking.status === 'approved' && booking.payment_status === 'not_started' && '✅ Approved! Complete payment to confirm.'}
                                {isPendingPayment && '⏳ Payment submitted. Waiting for owner to confirm.'}
                                {booking.status === 'confirmed' && '🎉 Booking Confirmed!'}
                                {booking.status === 'rejected' && '❌ The owner declined this request.'}
                                {booking.status === 'cancelled' && '🚫 This booking was cancelled.'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Booking Details */}
                <View style={s.section}>
                    <Text style={[s.sectionTitle, { color: colors.text }]}>Booking Details</Text>
                    <View style={[s.detailsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        {[
                            { icon: 'time', label: 'Duration', value: `${hours} hour${hours !== 1 ? 's' : ''}` },
                            { icon: 'cash', label: 'Total Amount', value: `₹${booking.total_amount.toLocaleString()}` },
                            { icon: 'card', label: 'Payment', value: booking.payment_status.replace('_', ' ').toUpperCase() },
                            ...(booking.ride_status ? [{ icon: 'bicycle', label: 'Ride Status', value: booking.ride_status.replace('_', ' ').toUpperCase() }] : []),
                        ].map((detail, idx) => (
                            <View key={idx} style={[s.detailRow, idx > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}>
                                <View style={s.detailLeft}>
                                    <Ionicons name={detail.icon as any} size={18} color={colors.textMuted} />
                                    <Text style={[s.detailLabel, { color: colors.textSecondary }]}>{detail.label}</Text>
                                </View>
                                <Text style={[s.detailValue, { color: colors.text }]}>{detail.value}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Person Info Card */}
                <View style={s.section}>
                    <Text style={[s.sectionTitle, { color: colors.text }]}>{isOwner ? 'Renter' : 'Owner'}</Text>
                    <View style={[s.personCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <View style={[s.personAvatar, { backgroundColor: colors.primary }]}>
                            <Text style={s.personAvatarText}>
                                {(isOwner ? booking.renter?.full_name : booking.owner?.full_name)?.charAt(0) || '?'}
                            </Text>
                        </View>
                        <View>
                            <Text style={[s.personName, { color: colors.text }]}>
                                {isOwner ? booking.renter?.full_name : booking.owner?.full_name}
                            </Text>
                            {isOwner && booking.renter?.phone && (
                                <Text style={[s.personSub, { color: colors.textSecondary }]}>📱 {booking.renter.phone}</Text>
                            )}
                        </View>
                    </View>
                </View>

                {/* RENTER: PAYMENT SECTION */}
                {canPay && (
                    <View style={s.section}>
                        <TouchableOpacity
                            style={[s.payButton, { backgroundColor: colors.primary }]}
                            onPress={() => setPaymentModalVisible(true)}
                        >
                            <Ionicons name="card" size={20} color="#fff" />
                            <Text style={s.payButtonText}>Pay ₹{booking.total_amount.toLocaleString()}</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Payment Pending Status (Renter) */}
                {isPendingPayment && !isOwner && (
                    <View style={s.section}>
                        <View style={[s.infoCard, { backgroundColor: `${colors.warning}10`, borderColor: colors.warning }]}>
                            <Ionicons name="time" size={20} color={colors.warning} />
                            <View style={{ flex: 1 }}>
                                <Text style={[s.infoCardTitle, { color: colors.warning }]}>Payment Pending Confirmation</Text>
                                <Text style={[s.infoCardSub, { color: colors.textSecondary }]}>
                                    {booking.payment_method && `Paying via ${booking.payment_method.toUpperCase()} • `}
                                    Waiting for owner to verify
                                </Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* OWNER: PAYMENT CONFIRMATION */}
                {isOwner && booking.status === 'approved' && booking.payment_status === 'pending' && booking.payment_method && (
                    <View style={s.section}>
                        <View style={[s.infoCard, { backgroundColor: `${colors.success}10`, borderColor: colors.success }]}>
                            <Ionicons name="card" size={20} color={colors.success} />
                            <View style={{ flex: 1 }}>
                                <Text style={[s.infoCardTitle, { color: colors.success }]}>Payment Received?</Text>
                                <Text style={[s.infoCardSub, { color: colors.textSecondary }]}>
                                    Renter is paying via {booking.payment_method.toUpperCase()} — ₹{booking.total_amount}
                                </Text>
                            </View>
                        </View>
                        <TouchableOpacity
                            style={[s.payButton, { backgroundColor: colors.success, marginTop: Spacing.sm }]}
                            onPress={handleConfirmPayment}
                            disabled={actionLoading}
                        >
                            <Ionicons name="checkmark-circle" size={20} color="#fff" />
                            <Text style={s.payButtonText}>
                                {actionLoading ? 'Confirming...' : 'Confirm Payment Received'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Owner: Waiting for renter payment */}
                {isOwner && booking.status === 'approved' && (!booking.payment_status || booking.payment_status === 'not_started') && (
                    <View style={s.section}>
                        <View style={[s.infoCard, { backgroundColor: `${colors.warning}10`, borderColor: colors.warning }]}>
                            <Ionicons name="time" size={20} color={colors.warning} />
                            <View style={{ flex: 1 }}>
                                <Text style={[s.infoCardTitle, { color: colors.warning }]}>Waiting for Renter Payment</Text>
                                <Text style={[s.infoCardSub, { color: colors.textSecondary }]}>
                                    You've approved this booking. The renter needs to complete payment.
                                </Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* RIDE VERIFICATION SECTION */}
                {isConfirmed && (
                    <View style={s.section}>
                        <View style={s.rideHeader}>
                            <Ionicons name="shield-checkmark" size={22} color={colors.primary} />
                            <Text style={[s.rideHeaderText, { color: colors.primary }]}>Ride Verification</Text>
                        </View>

                        {/* Step 1: Renter uploads inspection photos */}
                        {(!booking.ride_status || booking.ride_status === 'pending') && (
                            <>
                                {!isOwner ? (
                                    <View style={[s.stepCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                        <View style={[s.stepBadge, { backgroundColor: `${colors.primary}30` }]}>
                                            <Text style={[s.stepBadgeText, { color: colors.primary }]}>1</Text>
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={[s.stepTitle, { color: colors.text }]}>Upload Inspection Photos</Text>
                                            <Text style={[s.stepSub, { color: colors.textSecondary }]}>
                                                Upload photos of the vehicle before starting your ride
                                            </Text>
                                        </View>
                                    </View>
                                ) : (
                                    <View style={[s.infoCard, { backgroundColor: `${colors.warning}10`, borderColor: colors.warning }]}>
                                        <Ionicons name="time" size={20} color={colors.warning} />
                                        <View style={{ flex: 1 }}>
                                            <Text style={[s.infoCardTitle, { color: colors.warning }]}>Waiting for Renter</Text>
                                            <Text style={[s.infoCardSub, { color: colors.textSecondary }]}>
                                                The renter needs to upload inspection photos before you can generate the Start OTP.
                                            </Text>
                                        </View>
                                    </View>
                                )}
                                {!isOwner && (
                                    <TouchableOpacity
                                        style={[s.inspectionButton, { borderColor: colors.warning }]}
                                        onPress={() => router.push({ pathname: '/ride/inspection', params: { bookingId: booking.id } })}
                                    >
                                        <Ionicons name="camera" size={20} color={colors.warning} />
                                        <Text style={[s.inspectionBtnText, { color: colors.warning }]}>📷 Upload Inspection Photos</Text>
                                    </TouchableOpacity>
                                )}
                            </>
                        )}

                        {/* Step 2: Photos uploaded → Owner generates Start OTP / Renter waits */}
                        {booking.ride_status === 'photos_uploaded' && (
                            <>
                                {isOwner ? (
                                    <>
                                        <View style={[s.infoCard, { backgroundColor: `${colors.success}10`, borderColor: colors.success }]}>
                                            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                                            <View style={{ flex: 1 }}>
                                                <Text style={[s.infoCardTitle, { color: colors.success }]}>
                                                    ✅ Inspection Photos Received
                                                </Text>
                                                <Text style={[s.infoCardSub, { color: colors.textSecondary }]}>
                                                    Renter has uploaded vehicle inspection photos. Generate the Start OTP to begin the ride.
                                                </Text>
                                            </View>
                                        </View>
                                        <TouchableOpacity
                                            style={[s.gradientButton, { backgroundColor: '#f59e0b' }]}
                                            onPress={() => handleGenerateOTP('start')}
                                            disabled={actionLoading}
                                        >
                                            <Ionicons name="key" size={20} color="#fff" />
                                            <Text style={s.gradientBtnText}>
                                                {actionLoading ? 'Generating...' : '🔑 Generate Start OTP'}
                                            </Text>
                                        </TouchableOpacity>
                                    </>
                                ) : (
                                    <>
                                        <View style={[s.stepCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                            <View style={[s.stepBadge, { backgroundColor: `${colors.primary}30` }]}>
                                                <Text style={[s.stepBadgeText, { color: colors.primary }]}>2</Text>
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={[s.stepTitle, { color: colors.text }]}>✅ Photos uploaded!</Text>
                                                <Text style={[s.stepSub, { color: colors.textSecondary }]}>
                                                    Wait for the owner to generate your Start OTP
                                                </Text>
                                            </View>
                                        </View>
                                        <View style={[s.infoCard, { backgroundColor: `${colors.warning}10`, borderColor: colors.warning }]}>
                                            <Ionicons name="phone-portrait" size={18} color={colors.warning} />
                                            <Text style={[s.infoCardSub, { flex: 1, color: colors.textSecondary }]}>
                                                📱 The owner will generate an OTP and you'll receive it via email. Enter it below to start your ride.
                                            </Text>
                                        </View>
                                        <TouchableOpacity
                                            style={[s.gradientButton, { backgroundColor: colors.primary }]}
                                            onPress={() => { setOtpType('start'); setOtpInput(''); setOtpModalVisible(true); }}
                                        >
                                            <Ionicons name="lock-open" size={20} color="#fff" />
                                            <Text style={s.gradientBtnText}>🔑 Enter Start OTP</Text>
                                        </TouchableOpacity>
                                    </>
                                )}
                            </>
                        )}

                        {/* Step 3: Ride in Progress */}
                        {booking.ride_status === 'started' && (
                            <>
                                <View style={[s.infoCard, { borderColor: colors.success, backgroundColor: `${colors.success}10` }]}>
                                    <Ionicons name="flash" size={20} color={colors.success} />
                                    <View style={{ flex: 1 }}>
                                        <Text style={[s.infoCardTitle, { color: colors.success }]}>🏍️ Ride in Progress!</Text>
                                        <Text style={[s.infoCardSub, { color: colors.textSecondary }]}>
                                            {isOwner
                                                ? 'When the renter returns the vehicle, generate the End OTP to complete the booking.'
                                                : "Enjoy your ride! When you're done, the owner will generate an End OTP to complete the booking."
                                            }
                                        </Text>
                                    </View>
                                </View>

                                {booking.ride_started_at && (
                                    <View style={[s.rideTimeCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                        <Ionicons name="flag" size={16} color={colors.success} />
                                        <Text style={[s.rideTimeText, { color: colors.text }]}>
                                            Started: {format(new Date(booking.ride_started_at), 'MMM dd, h:mm a')}
                                        </Text>
                                    </View>
                                )}

                                {isOwner ? (
                                    <TouchableOpacity
                                        style={[s.gradientButton, { backgroundColor: '#3b82f6' }]}
                                        onPress={() => handleGenerateOTP('end')}
                                        disabled={actionLoading}
                                    >
                                        <Ionicons name="key" size={20} color="#fff" />
                                        <Text style={s.gradientBtnText}>
                                            {actionLoading ? 'Generating...' : '🏁 Generate End OTP'}
                                        </Text>
                                    </TouchableOpacity>
                                ) : (
                                    <TouchableOpacity
                                        style={[s.gradientButton, { backgroundColor: '#3b82f6' }]}
                                        onPress={() => { setOtpType('end'); setOtpInput(''); setOtpModalVisible(true); }}
                                    >
                                        <Ionicons name="lock-open" size={20} color="#fff" />
                                        <Text style={s.gradientBtnText}>🏁 Enter End OTP to Complete Ride</Text>
                                    </TouchableOpacity>
                                )}
                            </>
                        )}

                        {/* Step 4: Ride Completed */}
                        {booking.ride_status === 'completed' && (
                            <>
                                <View style={[s.infoCard, { borderColor: colors.success, backgroundColor: `${colors.success}10` }]}>
                                    <Ionicons name="checkmark-done-circle" size={22} color={colors.success} />
                                    <View style={{ flex: 1 }}>
                                        <Text style={[s.infoCardTitle, { color: colors.success }]}>
                                            ✅ Ride Completed Successfully!
                                        </Text>
                                        <Text style={[s.infoCardSub, { color: colors.textSecondary }]}>
                                            {isOwner
                                                ? 'This booking has been completed. Payment will be processed to your account.'
                                                : 'Thank you for using GoWheel! We hope you had a great ride.'}
                                        </Text>
                                    </View>
                                </View>
                                {booking.ride_started_at && (
                                    <View style={[s.rideTimeCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                        <Ionicons name="flag" size={16} color={colors.success} />
                                        <Text style={[s.rideTimeText, { color: colors.text }]}>
                                            Started: {format(new Date(booking.ride_started_at), 'MMM dd, h:mm a')}
                                        </Text>
                                    </View>
                                )}
                                {booking.ride_ended_at && (
                                    <View style={[s.rideTimeCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                        <Ionicons name="checkmark-done" size={16} color={colors.primary} />
                                        <Text style={[s.rideTimeText, { color: colors.text }]}>
                                            Ended: {format(new Date(booking.ride_ended_at), 'MMM dd, h:mm a')}
                                        </Text>
                                    </View>
                                )}
                                {!isOwner && (
                                    <TouchableOpacity
                                        style={[s.gradientButton, { marginTop: Spacing.md, backgroundColor: colors.warning }]}
                                        onPress={() => router.push({
                                            pathname: '/reviews/add',
                                            params: {
                                                bookingId: booking.id,
                                                vehicleId: booking.vehicle_id,
                                                vehicleTitle: booking.vehicle?.title
                                            }
                                        })}
                                    >
                                        <Ionicons name="star" size={20} color="#fff" />
                                        <Text style={s.gradientBtnText}>Rate Your Ride</Text>
                                    </TouchableOpacity>
                                )}
                            </>
                        )}
                    </View>
                )}

                {/* Generated OTP Display (Owner only) */}
                {generatedOtp && isOwner && (
                    <View style={s.section}>
                        <View style={[s.otpCard, { backgroundColor: colors.card, borderColor: colors.primary }]}>
                            <Text style={[s.otpLabel, { color: colors.textSecondary }]}>Generated OTP</Text>
                            <Text style={[s.otpValue, { color: colors.primary }]}>{generatedOtp.slice(0, 3)} {generatedOtp.slice(3)}</Text>
                            <Text style={[s.otpHint, { color: colors.textMuted }]}>Share this OTP with the renter to start/end the ride</Text>
                        </View>
                    </View>
                )}

                {/* BOTTOM ACTIONS */}
                <View style={s.actionSection}>
                    {/* Owner: Approve / Reject */}
                    {isOwner && booking.status === 'requested' && (
                        <View style={s.actionRow}>
                            <TouchableOpacity
                                style={[s.actionBtn, { backgroundColor: colors.success }]}
                                onPress={handleApprove}
                                disabled={actionLoading}
                            >
                                {actionLoading ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={s.actionBtnText}>✓ Approve</Text>
                                )}
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[s.actionBtn, { backgroundColor: colors.error }]}
                                onPress={handleReject}
                                disabled={actionLoading}
                            >
                                <Text style={s.actionBtnText}>✗ Reject</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Chat */}
                    {canChat && (
                        <TouchableOpacity
                            style={[s.chatButton, { borderColor: colors.primary }]}
                            onPress={() => router.push(`/chat/${booking.id}`)}
                        >
                            <Ionicons name="chatbubble-ellipses" size={20} color={colors.primary} />
                            <Text style={[s.chatBtnText, { color: colors.primary }]}>
                                Chat with {isOwner ? 'Renter' : 'Owner'}
                            </Text>
                        </TouchableOpacity>
                    )}

                    {/* Cancel */}
                    {['requested', 'approved'].includes(booking.status) && (
                        <TouchableOpacity
                            style={[s.cancelButton, { borderColor: colors.error }]}
                            onPress={handleCancel}
                            disabled={actionLoading}
                        >
                            <Text style={[s.cancelBtnText, { color: colors.error }]}>Cancel Booking</Text>
                        </TouchableOpacity>
                    )}
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* OTP ENTRY MODAL (RENTER) */}
            <Modal visible={otpModalVisible} transparent animationType="slide">
                <View style={s.modalOverlay}>
                    <View style={[s.modalContent, { backgroundColor: colors.card }]}>
                        <View style={s.modalHeader}>
                            <Text style={[s.modalTitle, { color: colors.text }]}>
                                {otpType === 'start' ? '🔑 Enter OTP to Start Ride' : '🏁 Enter OTP to End Ride'}
                            </Text>
                            <TouchableOpacity onPress={() => setOtpModalVisible(false)}>
                                <Ionicons name="close" size={24} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <Text style={[s.modalSub, { color: colors.textSecondary }]}>
                            Enter the 6-digit OTP {otpType === 'start' ? 'shared by the owner' : 'to complete your ride'}.
                            Check your email or ask the owner directly.
                        </Text>

                        <TextInput
                            style={[s.otpInput, { backgroundColor: colors.surface, borderColor: colors.primary, color: colors.text }]}
                            value={otpInput}
                            onChangeText={setOtpInput}
                            placeholder="000000"
                            placeholderTextColor={colors.textMuted}
                            keyboardType="number-pad"
                            maxLength={6}
                            autoFocus
                        />

                        <TouchableOpacity
                            style={[s.gradientButton, { marginTop: Spacing.lg, backgroundColor: colors.primary }]}
                            onPress={handleVerifyOTP}
                            disabled={actionLoading || otpInput.length !== 6}
                        >
                            {actionLoading ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <>
                                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                                    <Text style={s.gradientBtnText}>Verify OTP</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* PAYMENT METHOD MODAL (RENTER) */}
            <Modal visible={paymentModalVisible} transparent animationType="slide">
                <View style={s.modalOverlay}>
                    <View style={[s.modalContent, { backgroundColor: colors.card }]}>
                        <View style={s.modalHeader}>
                            <Text style={[s.modalTitle, { color: colors.text }]}>💳 Select Payment Method</Text>
                            <TouchableOpacity onPress={() => setPaymentModalVisible(false)}>
                                <Ionicons name="close" size={24} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <Text style={[s.modalSub, { color: colors.textSecondary }]}>
                            Pay ₹{booking.total_amount.toLocaleString()} to {booking.owner?.full_name || 'the owner'}
                        </Text>

                        <View style={{ gap: Spacing.sm, marginTop: Spacing.md }}>
                            {paymentMethods.map((method) => (
                                <TouchableOpacity
                                    key={method.key}
                                    style={[
                                        s.paymentMethodItem,
                                        { backgroundColor: colors.surface, borderColor: colors.border },
                                        selectedPaymentMethod === method.key && { borderColor: colors.primary, backgroundColor: `${colors.primary}10` },
                                    ]}
                                    onPress={() => setSelectedPaymentMethod(method.key)}
                                >
                                    <Ionicons
                                        name={method.icon as any}
                                        size={22}
                                        color={selectedPaymentMethod === method.key ? colors.primary : colors.textSecondary}
                                    />
                                    <Text style={[
                                        s.paymentMethodText,
                                        { color: colors.text },
                                        selectedPaymentMethod === method.key && { color: colors.primary, fontWeight: '700' },
                                    ]}>
                                        {method.label}
                                    </Text>
                                    {selectedPaymentMethod === method.key && (
                                        <Ionicons name="checkmark-circle" size={22} color={colors.primary} style={{ marginLeft: 'auto' }} />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TouchableOpacity
                            style={[s.gradientButton, { marginTop: Spacing.lg, backgroundColor: colors.primary, opacity: selectedPaymentMethod ? 1 : 0.5 }]}
                            onPress={handlePayment}
                            disabled={actionLoading || !selectedPaymentMethod}
                        >
                            {actionLoading ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <>
                                    <Ionicons name="card" size={20} color="#fff" />
                                    <Text style={s.gradientBtnText}>Submit Payment</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </>
    );
}

// ===============================
// STYLES (color-free — all colors applied inline)
// ===============================
const s = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    // Vehicle Card
    vehicleCard: { flexDirection: 'row', alignItems: 'center', padding: Spacing.lg, borderBottomWidth: 1 },
    vehicleImage: { width: 90, height: 65, borderRadius: Radius.md },
    noImage: { justifyContent: 'center', alignItems: 'center' },
    vehicleInfo: { flex: 1, marginLeft: Spacing.lg },
    vehicleTitle: { fontSize: FontSize.lg, fontWeight: '700' },
    vehicleSub: { fontSize: FontSize.sm, marginTop: 2 },

    // Section
    section: { paddingHorizontal: Spacing.xl, marginTop: Spacing.lg },
    sectionTitle: { fontSize: FontSize.lg, fontWeight: '700', marginBottom: Spacing.md },

    // Status
    statusBanner: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.lg, borderRadius: Radius.lg, borderWidth: 1 },
    statusLabel: { fontSize: FontSize.lg, fontWeight: '700' },
    statusSubText: { fontSize: FontSize.sm, marginTop: 2 },

    // Details
    detailsCard: { borderRadius: Radius.lg, borderWidth: 1, overflow: 'hidden' },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
    detailLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    detailLabel: { fontSize: FontSize.sm },
    detailValue: { fontSize: FontSize.sm, fontWeight: '600' },

    // Person
    personCard: { flexDirection: 'row', alignItems: 'center', borderRadius: Radius.lg, borderWidth: 1, padding: Spacing.lg },
    personAvatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md },
    personAvatarText: { color: '#fff', fontWeight: '700', fontSize: FontSize.md },
    personName: { fontSize: FontSize.md, fontWeight: '600' },
    personSub: { fontSize: FontSize.sm, marginTop: 2 },

    // Info Card
    infoCard: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, borderWidth: 1, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.sm },
    infoCardTitle: { fontSize: FontSize.sm, fontWeight: '600' },
    infoCardSub: { fontSize: FontSize.xs, marginTop: 2 },

    // Ride Section
    rideHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
    rideHeaderText: { fontSize: FontSize.lg, fontWeight: '700' },

    stepCard: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, padding: Spacing.lg, borderRadius: Radius.lg, borderWidth: 1, marginBottom: Spacing.sm },
    stepBadge: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    stepBadgeText: { fontSize: FontSize.xs, fontWeight: '700' },
    stepTitle: { fontSize: FontSize.sm, fontWeight: '600' },
    stepSub: { fontSize: FontSize.xs, marginTop: 2 },

    rideTimeCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.md, borderRadius: Radius.md, borderWidth: 1, marginBottom: Spacing.sm },
    rideTimeText: { fontSize: FontSize.sm },

    // OTP
    otpCard: { alignItems: 'center', borderRadius: Radius.lg, borderWidth: 2, padding: Spacing.xl },
    otpLabel: { fontSize: FontSize.sm, marginBottom: Spacing.sm },
    otpValue: { fontSize: 36, fontWeight: '800', letterSpacing: 8 },
    otpHint: { fontSize: FontSize.xs, marginTop: Spacing.sm, textAlign: 'center' },

    // Buttons
    payButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, borderRadius: Radius.md, paddingVertical: Spacing.lg },
    payButtonText: { color: '#fff', fontWeight: '700', fontSize: FontSize.md },

    gradientButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, borderRadius: Radius.md, paddingVertical: Spacing.lg, marginTop: Spacing.sm },
    gradientBtnText: { color: '#fff', fontWeight: '700', fontSize: FontSize.md },

    inspectionButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, borderWidth: 1, borderRadius: Radius.md, paddingVertical: Spacing.md, marginTop: Spacing.sm },
    inspectionBtnText: { fontWeight: '600', fontSize: FontSize.md },

    actionSection: { paddingHorizontal: Spacing.xl, marginTop: Spacing.xl, gap: Spacing.md },
    actionRow: { flexDirection: 'row', gap: Spacing.md },
    actionBtn: { flex: 1, paddingVertical: Spacing.md, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
    actionBtnText: { color: '#fff', fontWeight: '600', fontSize: FontSize.md },

    chatButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, borderWidth: 1, borderRadius: Radius.md, paddingVertical: Spacing.md },
    chatBtnText: { fontWeight: '600', fontSize: FontSize.md },

    cancelButton: { borderWidth: 1, borderRadius: Radius.md, paddingVertical: Spacing.md, alignItems: 'center' },
    cancelBtnText: { fontWeight: '600', fontSize: FontSize.md },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: Spacing.xl, paddingBottom: 40 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
    modalTitle: { fontSize: FontSize.lg, fontWeight: '700' },
    modalSub: { fontSize: FontSize.sm, marginBottom: Spacing.md },

    otpInput: {
        borderRadius: Radius.lg,
        borderWidth: 2,
        padding: Spacing.lg,
        fontSize: 28,
        fontWeight: '700',
        textAlign: 'center',
        letterSpacing: 10,
    },

    // Payment method
    paymentMethodItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        padding: Spacing.lg,
        borderRadius: Radius.lg,
        borderWidth: 1,
    },
    paymentMethodText: { fontSize: FontSize.md },
});
