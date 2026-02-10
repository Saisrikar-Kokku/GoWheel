import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity, Image,
    ActivityIndicator, Alert, RefreshControl, TextInput, Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Colors, Spacing, FontSize, Radius, cardShadow } from '@/lib/theme';
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
const statusConfig: Record<BookingStatus, { color: string; icon: string; label: string }> = {
    requested: { color: Colors.warning, icon: 'time', label: 'Requested' },
    approved: { color: '#3b82f6', icon: 'checkmark-circle', label: 'Approved' },
    confirmed: { color: Colors.success, icon: 'checkmark-done-circle', label: 'Confirmed' },
    rejected: { color: Colors.error, icon: 'close-circle', label: 'Rejected' },
    cancelled: { color: Colors.textMuted, icon: 'ban', label: 'Cancelled' },
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

    // ===============================
    // DATA LOADING
    // ===============================
    const loadBooking = useCallback(async () => {
        if (!id) return;
        const { data, error } = await supabase.from('bookings').select('*').eq('id', id).single();
        if (error || !data) { setLoading(false); return; }

        const { data: vehicle } = await supabase
            .from('vehicles')
            .select('id, title, brand, model, vehicle_type, price_per_day, location, registration_number')
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
            // Update booking with payment info
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
    if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;
    if (!booking) return <View style={styles.center}><Text style={styles.emptyText}>Booking not found</Text></View>;

    const sc = statusConfig[booking.status];
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
                headerStyle: { backgroundColor: Colors.background },
                headerTintColor: Colors.text,
            }} />

            <ScrollView
                style={styles.container}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
            >
                {/* Vehicle Card */}
                <View style={styles.vehicleCard}>
                    {primaryImage ? (
                        <Image source={{ uri: primaryImage.image_url }} style={styles.vehicleImage} />
                    ) : (
                        <View style={[styles.vehicleImage, styles.noImage]}>
                            <Ionicons name="car" size={40} color={Colors.textMuted} />
                        </View>
                    )}
                    <View style={styles.vehicleInfo}>
                        <Text style={styles.vehicleTitle}>{booking.vehicle?.title || 'Vehicle'}</Text>
                        <Text style={styles.vehicleSub}>{booking.vehicle?.brand} {booking.vehicle?.model}</Text>
                        <Text style={styles.vehicleSub}>
                            {format(startDate, 'MMM d, h:mm a')} → {format(endDate, 'MMM d, h:mm a')}
                        </Text>
                    </View>
                </View>

                {/* Status Banner */}
                <View style={styles.section}>
                    <View style={[styles.statusBanner, { backgroundColor: `${sc.color}15`, borderColor: sc.color }]}>
                        <Ionicons name={sc.icon as any} size={28} color={sc.color} />
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.statusLabel, { color: sc.color }]}>{sc.label}</Text>
                            <Text style={styles.statusSubText}>
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
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Booking Details</Text>
                    <View style={styles.detailsCard}>
                        {[
                            { icon: 'time', label: 'Duration', value: `${hours} hour${hours !== 1 ? 's' : ''}` },
                            { icon: 'cash', label: 'Total Amount', value: `₹${booking.total_amount.toLocaleString()}` },
                            { icon: 'card', label: 'Payment', value: booking.payment_status.replace('_', ' ').toUpperCase() },
                            ...(booking.ride_status ? [{ icon: 'bicycle', label: 'Ride Status', value: booking.ride_status.replace('_', ' ').toUpperCase() }] : []),
                        ].map((detail, idx) => (
                            <View key={idx} style={[styles.detailRow, idx > 0 && styles.detailBorder]}>
                                <View style={styles.detailLeft}>
                                    <Ionicons name={detail.icon as any} size={18} color={Colors.textMuted} />
                                    <Text style={styles.detailLabel}>{detail.label}</Text>
                                </View>
                                <Text style={styles.detailValue}>{detail.value}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Person Info Card */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{isOwner ? 'Renter' : 'Owner'}</Text>
                    <View style={styles.personCard}>
                        <View style={styles.personAvatar}>
                            <Text style={styles.personAvatarText}>
                                {(isOwner ? booking.renter?.full_name : booking.owner?.full_name)?.charAt(0) || '?'}
                            </Text>
                        </View>
                        <View>
                            <Text style={styles.personName}>
                                {isOwner ? booking.renter?.full_name : booking.owner?.full_name}
                            </Text>
                            {isOwner && booking.renter?.phone && (
                                <Text style={styles.personSub}>📱 {booking.renter.phone}</Text>
                            )}
                        </View>
                    </View>
                </View>

                {/* ============================================ */}
                {/* RENTER: PAYMENT SECTION */}
                {/* ============================================ */}
                {canPay && (
                    <View style={styles.section}>
                        <TouchableOpacity
                            style={styles.payButton}
                            onPress={() => setPaymentModalVisible(true)}
                        >
                            <Ionicons name="card" size={20} color={Colors.white} />
                            <Text style={styles.payButtonText}>Pay ₹{booking.total_amount.toLocaleString()}</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Payment Pending Status (Renter) */}
                {isPendingPayment && !isOwner && (
                    <View style={styles.section}>
                        <View style={styles.infoCard}>
                            <Ionicons name="time" size={20} color={Colors.warning} />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.infoCardTitle}>Payment Pending Confirmation</Text>
                                <Text style={styles.infoCardSub}>
                                    {booking.payment_method && `Paying via ${booking.payment_method.toUpperCase()} • `}
                                    Waiting for owner to verify
                                </Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* ============================================ */}
                {/* OWNER: PAYMENT CONFIRMATION */}
                {/* ============================================ */}
                {isOwner && booking.status === 'approved' && booking.payment_status === 'pending' && booking.payment_method && (
                    <View style={styles.section}>
                        <View style={[styles.infoCard, { borderColor: Colors.success }]}>
                            <Ionicons name="card" size={20} color={Colors.success} />
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.infoCardTitle, { color: Colors.success }]}>Payment Received?</Text>
                                <Text style={styles.infoCardSub}>
                                    Renter is paying via {booking.payment_method.toUpperCase()} — ₹{booking.total_amount}
                                </Text>
                            </View>
                        </View>
                        <TouchableOpacity
                            style={[styles.payButton, { backgroundColor: Colors.success, marginTop: Spacing.sm }]}
                            onPress={handleConfirmPayment}
                            disabled={actionLoading}
                        >
                            <Ionicons name="checkmark-circle" size={20} color={Colors.white} />
                            <Text style={styles.payButtonText}>
                                {actionLoading ? 'Confirming...' : 'Confirm Payment Received'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Owner: Waiting for renter payment */}
                {isOwner && booking.status === 'approved' && (!booking.payment_status || booking.payment_status === 'not_started') && (
                    <View style={styles.section}>
                        <View style={styles.infoCard}>
                            <Ionicons name="time" size={20} color={Colors.warning} />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.infoCardTitle}>Waiting for Renter Payment</Text>
                                <Text style={styles.infoCardSub}>
                                    You've approved this booking. The renter needs to complete payment.
                                </Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* ============================================ */}
                {/* RIDE VERIFICATION SECTION */}
                {/* ============================================ */}
                {isConfirmed && (
                    <View style={styles.section}>
                        <View style={styles.rideHeader}>
                            <Ionicons name="shield-checkmark" size={22} color={Colors.primary} />
                            <Text style={styles.rideHeaderText}>Ride Verification</Text>
                        </View>

                        {/* Step 1: Renter uploads inspection photos */}
                        {(!booking.ride_status || booking.ride_status === 'pending') && (
                            <>
                                {!isOwner ? (
                                    <View style={styles.stepCard}>
                                        <View style={styles.stepBadge}>
                                            <Text style={styles.stepBadgeText}>1</Text>
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.stepTitle}>Upload Inspection Photos</Text>
                                            <Text style={styles.stepSub}>
                                                Upload photos of the vehicle before starting your ride
                                            </Text>
                                        </View>
                                    </View>
                                ) : (
                                    <View style={styles.infoCard}>
                                        <Ionicons name="time" size={20} color={Colors.warning} />
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.infoCardTitle}>Waiting for Renter</Text>
                                            <Text style={styles.infoCardSub}>
                                                The renter needs to upload inspection photos before you can generate the Start OTP.
                                            </Text>
                                        </View>
                                    </View>
                                )}
                                {!isOwner && (
                                    <TouchableOpacity
                                        style={styles.inspectionButton}
                                        onPress={() => router.push({ pathname: '/ride/inspection', params: { bookingId: booking.id } })}
                                    >
                                        <Ionicons name="camera" size={20} color={Colors.warning} />
                                        <Text style={[styles.inspectionBtnText, { color: Colors.warning }]}>📷 Upload Inspection Photos</Text>
                                    </TouchableOpacity>
                                )}
                            </>
                        )}

                        {/* Step 2: Photos uploaded → Owner generates Start OTP / Renter waits then enters OTP */}
                        {booking.ride_status === 'photos_uploaded' && (
                            <>
                                {isOwner ? (
                                    <>
                                        <View style={[styles.infoCard, { borderColor: Colors.success }]}>
                                            <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                                            <View style={{ flex: 1 }}>
                                                <Text style={[styles.infoCardTitle, { color: Colors.success }]}>
                                                    ✅ Inspection Photos Received
                                                </Text>
                                                <Text style={styles.infoCardSub}>
                                                    Renter has uploaded vehicle inspection photos. Generate the Start OTP to begin the ride.
                                                </Text>
                                            </View>
                                        </View>
                                        <TouchableOpacity
                                            style={[styles.gradientButton, { backgroundColor: '#f59e0b' }]}
                                            onPress={() => handleGenerateOTP('start')}
                                            disabled={actionLoading}
                                        >
                                            <Ionicons name="key" size={20} color={Colors.white} />
                                            <Text style={styles.gradientBtnText}>
                                                {actionLoading ? 'Generating...' : '🔑 Generate Start OTP'}
                                            </Text>
                                        </TouchableOpacity>
                                    </>
                                ) : (
                                    <>
                                        <View style={styles.stepCard}>
                                            <View style={styles.stepBadge}>
                                                <Text style={styles.stepBadgeText}>2</Text>
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.stepTitle}>✅ Photos uploaded!</Text>
                                                <Text style={styles.stepSub}>
                                                    Wait for the owner to generate your Start OTP
                                                </Text>
                                            </View>
                                        </View>
                                        <View style={[styles.infoCard, { borderColor: Colors.warning }]}>
                                            <Ionicons name="phone-portrait" size={18} color={Colors.warning} />
                                            <Text style={[styles.infoCardSub, { flex: 1 }]}>
                                                📱 The owner will generate an OTP and you'll receive it via email. Enter it below to start your ride.
                                            </Text>
                                        </View>
                                        <TouchableOpacity
                                            style={styles.gradientButton}
                                            onPress={() => { setOtpType('start'); setOtpInput(''); setOtpModalVisible(true); }}
                                        >
                                            <Ionicons name="lock-open" size={20} color={Colors.white} />
                                            <Text style={styles.gradientBtnText}>🔑 Enter Start OTP</Text>
                                        </TouchableOpacity>
                                    </>
                                )}
                            </>
                        )}

                        {/* Step 3: Ride in Progress */}
                        {booking.ride_status === 'started' && (
                            <>
                                <View style={[styles.infoCard, { borderColor: Colors.success, backgroundColor: `${Colors.success}10` }]}>
                                    <Ionicons name="flash" size={20} color={Colors.success} />
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.infoCardTitle, { color: Colors.success }]}>🏍️ Ride in Progress!</Text>
                                        <Text style={styles.infoCardSub}>
                                            {isOwner
                                                ? 'When the renter returns the vehicle, generate the End OTP to complete the booking.'
                                                : "Enjoy your ride! When you're done, the owner will generate an End OTP to complete the booking."
                                            }
                                        </Text>
                                    </View>
                                </View>

                                {booking.ride_started_at && (
                                    <View style={styles.rideTimeCard}>
                                        <Ionicons name="flag" size={16} color={Colors.success} />
                                        <Text style={styles.rideTimeText}>
                                            Started: {format(new Date(booking.ride_started_at), 'MMM dd, h:mm a')}
                                        </Text>
                                    </View>
                                )}

                                {isOwner ? (
                                    <TouchableOpacity
                                        style={[styles.gradientButton, { backgroundColor: '#3b82f6' }]}
                                        onPress={() => handleGenerateOTP('end')}
                                        disabled={actionLoading}
                                    >
                                        <Ionicons name="key" size={20} color={Colors.white} />
                                        <Text style={styles.gradientBtnText}>
                                            {actionLoading ? 'Generating...' : '🏁 Generate End OTP'}
                                        </Text>
                                    </TouchableOpacity>
                                ) : (
                                    <TouchableOpacity
                                        style={[styles.gradientButton, { backgroundColor: '#3b82f6' }]}
                                        onPress={() => { setOtpType('end'); setOtpInput(''); setOtpModalVisible(true); }}
                                    >
                                        <Ionicons name="lock-open" size={20} color={Colors.white} />
                                        <Text style={styles.gradientBtnText}>🏁 Enter End OTP to Complete Ride</Text>
                                    </TouchableOpacity>
                                )}
                            </>
                        )}

                        {/* Step 4: Ride Completed */}
                        {booking.ride_status === 'completed' && (
                            <>
                                <View style={[styles.infoCard, { borderColor: Colors.success, backgroundColor: `${Colors.success}10` }]}>
                                    <Ionicons name="checkmark-done-circle" size={22} color={Colors.success} />
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.infoCardTitle, { color: Colors.success }]}>
                                            ✅ Ride Completed Successfully!
                                        </Text>
                                        <Text style={styles.infoCardSub}>
                                            {isOwner
                                                ? 'This booking has been completed. Payment will be processed to your account.'
                                                : 'Thank you for using GoWheel! We hope you had a great ride.'}
                                        </Text>
                                    </View>
                                </View>
                                {booking.ride_started_at && (
                                    <View style={styles.rideTimeCard}>
                                        <Ionicons name="flag" size={16} color={Colors.success} />
                                        <Text style={styles.rideTimeText}>
                                            Started: {format(new Date(booking.ride_started_at), 'MMM dd, h:mm a')}
                                        </Text>
                                    </View>
                                )}
                                {booking.ride_ended_at && (
                                    <View style={styles.rideTimeCard}>
                                        <Ionicons name="checkmark-done" size={16} color={Colors.primary} />
                                        <Text style={styles.rideTimeText}>
                                            Ended: {format(new Date(booking.ride_ended_at), 'MMM dd, h:mm a')}
                                        </Text>
                                    </View>
                                )}
                                {!isOwner && (
                                    <TouchableOpacity
                                        style={[styles.gradientButton, { marginTop: Spacing.md, backgroundColor: Colors.warning }]}
                                        onPress={() => router.push({
                                            pathname: '/reviews/add',
                                            params: {
                                                bookingId: booking.id,
                                                vehicleId: booking.vehicle_id,
                                                vehicleTitle: booking.vehicle?.title
                                            }
                                        })}
                                    >
                                        <Ionicons name="star" size={20} color={Colors.white} />
                                        <Text style={styles.gradientBtnText}>Rate Your Ride</Text>
                                    </TouchableOpacity>
                                )}
                            </>
                        )}
                    </View>
                )}

                {/* Generated OTP Display (Owner only) */}
                {generatedOtp && isOwner && (
                    <View style={styles.section}>
                        <View style={styles.otpCard}>
                            <Text style={styles.otpLabel}>Generated OTP</Text>
                            <Text style={styles.otpValue}>{generatedOtp.slice(0, 3)} {generatedOtp.slice(3)}</Text>
                            <Text style={styles.otpHint}>Share this OTP with the renter to start/end the ride</Text>
                        </View>
                    </View>
                )}

                {/* ============================================ */}
                {/* BOTTOM ACTIONS */}
                {/* ============================================ */}
                <View style={styles.actionSection}>
                    {/* Owner: Approve / Reject */}
                    {isOwner && booking.status === 'requested' && (
                        <View style={styles.actionRow}>
                            <TouchableOpacity
                                style={[styles.actionBtn, { backgroundColor: Colors.success }]}
                                onPress={handleApprove}
                                disabled={actionLoading}
                            >
                                {actionLoading ? (
                                    <ActivityIndicator size="small" color={Colors.white} />
                                ) : (
                                    <Text style={styles.actionBtnText}>✓ Approve</Text>
                                )}
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.actionBtn, { backgroundColor: Colors.error }]}
                                onPress={handleReject}
                                disabled={actionLoading}
                            >
                                <Text style={styles.actionBtnText}>✗ Reject</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Chat */}
                    {canChat && (
                        <TouchableOpacity
                            style={styles.chatButton}
                            onPress={() => router.push(`/chat/${booking.id}`)}
                        >
                            <Ionicons name="chatbubble-ellipses" size={20} color={Colors.primary} />
                            <Text style={styles.chatBtnText}>
                                Chat with {isOwner ? 'Renter' : 'Owner'}
                            </Text>
                        </TouchableOpacity>
                    )}

                    {/* Cancel */}
                    {['requested', 'approved'].includes(booking.status) && (
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={handleCancel}
                            disabled={actionLoading}
                        >
                            <Text style={styles.cancelBtnText}>Cancel Booking</Text>
                        </TouchableOpacity>
                    )}
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* ============================================ */}
            {/* OTP ENTRY MODAL (RENTER) */}
            {/* ============================================ */}
            <Modal visible={otpModalVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {otpType === 'start' ? '🔑 Enter OTP to Start Ride' : '🏁 Enter OTP to End Ride'}
                            </Text>
                            <TouchableOpacity onPress={() => setOtpModalVisible(false)}>
                                <Ionicons name="close" size={24} color={Colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.modalSub}>
                            Enter the 6-digit OTP {otpType === 'start' ? 'shared by the owner' : 'to complete your ride'}.
                            Check your email or ask the owner directly.
                        </Text>

                        <TextInput
                            style={styles.otpInput}
                            value={otpInput}
                            onChangeText={setOtpInput}
                            placeholder="000000"
                            placeholderTextColor={Colors.textMuted}
                            keyboardType="number-pad"
                            maxLength={6}
                            autoFocus
                        />

                        <TouchableOpacity
                            style={[styles.gradientButton, { marginTop: Spacing.lg }]}
                            onPress={handleVerifyOTP}
                            disabled={actionLoading || otpInput.length !== 6}
                        >
                            {actionLoading ? (
                                <ActivityIndicator size="small" color={Colors.white} />
                            ) : (
                                <>
                                    <Ionicons name="checkmark-circle" size={20} color={Colors.white} />
                                    <Text style={styles.gradientBtnText}>Verify OTP</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* ============================================ */}
            {/* PAYMENT METHOD MODAL (RENTER) */}
            {/* ============================================ */}
            <Modal visible={paymentModalVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>💳 Select Payment Method</Text>
                            <TouchableOpacity onPress={() => setPaymentModalVisible(false)}>
                                <Ionicons name="close" size={24} color={Colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.modalSub}>
                            Pay ₹{booking.total_amount.toLocaleString()} to {booking.owner?.full_name || 'the owner'}
                        </Text>

                        <View style={{ gap: Spacing.sm, marginTop: Spacing.md }}>
                            {paymentMethods.map((method) => (
                                <TouchableOpacity
                                    key={method.key}
                                    style={[
                                        styles.paymentMethodItem,
                                        selectedPaymentMethod === method.key && styles.paymentMethodSelected,
                                    ]}
                                    onPress={() => setSelectedPaymentMethod(method.key)}
                                >
                                    <Ionicons
                                        name={method.icon as any}
                                        size={22}
                                        color={selectedPaymentMethod === method.key ? Colors.primary : Colors.textSecondary}
                                    />
                                    <Text style={[
                                        styles.paymentMethodText,
                                        selectedPaymentMethod === method.key && { color: Colors.primary, fontWeight: '700' },
                                    ]}>
                                        {method.label}
                                    </Text>
                                    {selectedPaymentMethod === method.key && (
                                        <Ionicons name="checkmark-circle" size={22} color={Colors.primary} style={{ marginLeft: 'auto' }} />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TouchableOpacity
                            style={[styles.gradientButton, { marginTop: Spacing.lg, opacity: selectedPaymentMethod ? 1 : 0.5 }]}
                            onPress={handlePayment}
                            disabled={actionLoading || !selectedPaymentMethod}
                        >
                            {actionLoading ? (
                                <ActivityIndicator size="small" color={Colors.white} />
                            ) : (
                                <>
                                    <Ionicons name="card" size={20} color={Colors.white} />
                                    <Text style={styles.gradientBtnText}>Submit Payment</Text>
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
// STYLES
// ===============================
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
    emptyText: { color: Colors.textMuted, fontSize: FontSize.md },

    // Vehicle Card
    vehicleCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border },
    vehicleImage: { width: 90, height: 65, borderRadius: Radius.md },
    noImage: { backgroundColor: Colors.surface, justifyContent: 'center', alignItems: 'center' },
    vehicleInfo: { flex: 1, marginLeft: Spacing.lg },
    vehicleTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text },
    vehicleSub: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },

    // Section
    section: { paddingHorizontal: Spacing.xl, marginTop: Spacing.lg },
    sectionTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text, marginBottom: Spacing.md },

    // Status
    statusBanner: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.lg, borderRadius: Radius.lg, borderWidth: 1 },
    statusLabel: { fontSize: FontSize.lg, fontWeight: '700' },
    statusSubText: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },

    // Details
    detailsCard: { backgroundColor: Colors.card, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
    detailBorder: { borderTopWidth: 1, borderTopColor: Colors.border },
    detailLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    detailLabel: { fontSize: FontSize.sm, color: Colors.textSecondary },
    detailValue: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.text },

    // Person
    personCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, padding: Spacing.lg },
    personAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md },
    personAvatarText: { color: Colors.white, fontWeight: '700', fontSize: FontSize.md },
    personName: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text },
    personSub: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },

    // Info Card
    infoCard: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, backgroundColor: `${Colors.warning}10`, borderWidth: 1, borderColor: Colors.warning, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.sm },
    infoCardTitle: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.warning },
    infoCardSub: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },

    // Ride Section
    rideHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
    rideHeaderText: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.primary },

    stepCard: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, padding: Spacing.lg, backgroundColor: Colors.card, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.sm },
    stepBadge: { width: 24, height: 24, borderRadius: 12, backgroundColor: `${Colors.primary}30`, justifyContent: 'center', alignItems: 'center' },
    stepBadgeText: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.primary },
    stepTitle: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.text },
    stepSub: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },

    rideTimeCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.md, backgroundColor: Colors.card, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.sm },
    rideTimeText: { fontSize: FontSize.sm, color: Colors.text },

    // OTP
    otpCard: { alignItems: 'center', backgroundColor: Colors.card, borderRadius: Radius.lg, borderWidth: 2, borderColor: Colors.primary, padding: Spacing.xl },
    otpLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.sm },
    otpValue: { fontSize: 36, fontWeight: '800', color: Colors.primary, letterSpacing: 8 },
    otpHint: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: Spacing.sm, textAlign: 'center' },

    // Buttons
    payButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, backgroundColor: Colors.primary, borderRadius: Radius.md, paddingVertical: Spacing.lg },
    payButtonText: { color: Colors.white, fontWeight: '700', fontSize: FontSize.md },

    gradientButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, backgroundColor: Colors.primary, borderRadius: Radius.md, paddingVertical: Spacing.lg, marginTop: Spacing.sm },
    gradientBtnText: { color: Colors.white, fontWeight: '700', fontSize: FontSize.md },

    inspectionButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, borderWidth: 1, borderColor: Colors.warning, borderRadius: Radius.md, paddingVertical: Spacing.md, marginTop: Spacing.sm },
    inspectionBtnText: { fontWeight: '600', fontSize: FontSize.md },

    actionSection: { paddingHorizontal: Spacing.xl, marginTop: Spacing.xl, gap: Spacing.md },
    actionRow: { flexDirection: 'row', gap: Spacing.md },
    actionBtn: { flex: 1, paddingVertical: Spacing.md, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
    actionBtnText: { color: Colors.white, fontWeight: '600', fontSize: FontSize.md },

    chatButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, borderWidth: 1, borderColor: Colors.primary, borderRadius: Radius.md, paddingVertical: Spacing.md },
    chatBtnText: { color: Colors.primary, fontWeight: '600', fontSize: FontSize.md },

    cancelButton: { borderWidth: 1, borderColor: Colors.error, borderRadius: Radius.md, paddingVertical: Spacing.md, alignItems: 'center' },
    cancelBtnText: { color: Colors.error, fontWeight: '600', fontSize: FontSize.md },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: Colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: Spacing.xl, paddingBottom: 40 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
    modalTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text },
    modalSub: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.md },

    otpInput: {
        backgroundColor: Colors.surface,
        borderRadius: Radius.lg,
        borderWidth: 2,
        borderColor: Colors.primary,
        padding: Spacing.lg,
        fontSize: 28,
        fontWeight: '700',
        color: Colors.text,
        textAlign: 'center',
        letterSpacing: 10,
    },

    // Payment method
    paymentMethodItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        padding: Spacing.lg,
        backgroundColor: Colors.surface,
        borderRadius: Radius.lg,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    paymentMethodSelected: {
        borderColor: Colors.primary,
        backgroundColor: `${Colors.primary}10`,
    },
    paymentMethodText: { fontSize: FontSize.md, color: Colors.text },
});
