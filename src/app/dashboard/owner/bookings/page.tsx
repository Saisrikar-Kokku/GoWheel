'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import PageWrapper from '@/components/layout/PageWrapper';
import BookingStatusBadge from '@/components/bookings/BookingStatusBadge';
import BookingChat from '@/components/chat/BookingChat';
import RideOTPGenerator from '@/components/ride/RideOTPGenerator';
import PaymentConfirmationCard from '@/components/payments/PaymentConfirmationCard';
import { useAuth } from '@/contexts/AuthContext';
import {
    getOwnerBookingRequests,
    approveBooking,
    rejectBooking,
} from '@/services/bookingService';
import { BookingWithDetails, RideStatus, PaymentMethod } from '@/types/booking';
import { isChatEnabled } from '@/types/chat';
import { createBrowserClient } from '@supabase/ssr';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.08 },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.4 },
    },
};

export default function OwnerBookingsPage() {
    const { profile } = useAuth();
    const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [rideStatusUpdate, setRideStatusUpdate] = useState<{ bookingId: string; status: RideStatus; message: string } | null>(null);

    // Memoized function to update booking ride status
    const updateBookingRideStatus = useCallback((bookingId: string, newRideStatus: RideStatus) => {
        setBookings((prev) =>
            prev.map((b) =>
                b.id === bookingId ? { ...b, ride_status: newRideStatus } : b
            )
        );

        // Show notification for status changes
        if (newRideStatus === 'started') {
            setRideStatusUpdate({
                bookingId,
                status: newRideStatus,
                message: '🎉 OTP Verified! Ride has started successfully.'
            });
            // Auto-hide after 5 seconds
            setTimeout(() => setRideStatusUpdate(null), 5000);
        } else if (newRideStatus === 'completed') {
            setRideStatusUpdate({
                bookingId,
                status: newRideStatus,
                message: '✅ Ride Completed! Payment will be processed shortly.'
            });
            setTimeout(() => setRideStatusUpdate(null), 5000);
        }
    }, []);

    useEffect(() => {
        fetchBookings();
    }, []);

    // Real-time subscription for booking updates
    useEffect(() => {
        const supabase = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        // Subscribe to booking changes for confirmed bookings
        const channel = supabase
            .channel('owner-booking-updates')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'bookings',
                },
                (payload) => {
                    const updatedBooking = payload.new as { id: string; ride_status: RideStatus; owner_id: string };
                    
                    // Only update if this booking belongs to current owner
                    if (profile?.id && updatedBooking.owner_id === profile.id) {
                        updateBookingRideStatus(updatedBooking.id, updatedBooking.ride_status);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [profile?.id, updateBookingRideStatus]);

    const fetchBookings = async () => {
        try {
            const data = await getOwnerBookingRequests();
            setBookings(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (bookingId: string) => {
        setActionLoading(bookingId);
        try {
            await approveBooking(bookingId);
            setBookings((prev) =>
                prev.map((b) => (b.id === bookingId ? { ...b, status: 'approved' } : b))
            );
        } catch (err) {
            console.error(err);
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (bookingId: string) => {
        setActionLoading(bookingId);
        try {
            await rejectBooking(bookingId);
            setBookings((prev) =>
                prev.map((b) => (b.id === bookingId ? { ...b, status: 'rejected' } : b))
            );
        } catch (err) {
            console.error(err);
        } finally {
            setActionLoading(null);
        }
    };

    const pendingBookings = bookings.filter((b) => b.status === 'requested');
    const otherBookings = bookings.filter((b) => b.status !== 'requested');

    return (
        <PageWrapper className="container mx-auto max-w-5xl px-4 sm:px-6 py-8 sm:py-12">
            {/* Minimal Toast Notification - 21st.dev inspired */}
            <AnimatePresence>
                {rideStatusUpdate && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
                        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
                        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                        className="fixed top-6 right-6 z-50"
                    >
                        <div className="relative overflow-hidden">
                            {/* Glassmorphism card */}
                            <div className={`
                                relative px-5 py-4 rounded-2xl
                                backdrop-blur-xl bg-white/[0.08] 
                                border border-white/[0.1]
                                shadow-[0_8px_32px_rgba(0,0,0,0.12)]
                                min-w-[320px] max-w-[400px]
                            `}>
                                {/* Subtle gradient overlay */}
                                <div className={`
                                    absolute inset-0 rounded-2xl opacity-50
                                    ${rideStatusUpdate.status === 'started' 
                                        ? 'bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent' 
                                        : 'bg-gradient-to-br from-blue-500/10 via-transparent to-transparent'
                                    }
                                `} />
                                
                                {/* Content */}
                                <div className="relative flex items-start gap-4">
                                    {/* Animated icon */}
                                    <motion.div
                                        initial={{ scale: 0, rotate: -180 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
                                        className={`
                                            flex-shrink-0 w-10 h-10 rounded-xl
                                            flex items-center justify-center
                                            ${rideStatusUpdate.status === 'started'
                                                ? 'bg-emerald-500/20 text-emerald-400'
                                                : 'bg-blue-500/20 text-blue-400'
                                            }
                                        `}
                                    >
                                        {rideStatusUpdate.status === 'started' ? (
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        ) : (
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        )}
                                    </motion.div>

                                    {/* Text content */}
                                    <div className="flex-1 min-w-0">
                                        <motion.p 
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.3 }}
                                            className="text-sm font-medium text-white/90"
                                        >
                                            {rideStatusUpdate.status === 'started' ? 'Ride Started' : 'Ride Completed'}
                                        </motion.p>
                                        <motion.p 
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.4 }}
                                            className="text-xs text-white/50 mt-0.5"
                                        >
                                            {rideStatusUpdate.status === 'started' 
                                                ? 'OTP verified successfully' 
                                                : 'Payment will be processed soon'
                                            }
                                        </motion.p>
                                    </div>

                                    {/* Close button */}
                                    <button
                                        onClick={() => setRideStatusUpdate(null)}
                                        className="flex-shrink-0 p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white/40 hover:text-white/70"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                {/* Progress bar that shows auto-dismiss */}
                                <motion.div 
                                    className={`
                                        absolute bottom-0 left-0 h-[2px] rounded-full
                                        ${rideStatusUpdate.status === 'started' ? 'bg-emerald-400/50' : 'bg-blue-400/50'}
                                    `}
                                    initial={{ width: '100%' }}
                                    animate={{ width: '0%' }}
                                    transition={{ duration: 5, ease: 'linear' }}
                                />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <Link href="/dashboard/owner">
                        <Button variant="ghost" size="icon" className="h-9 w-9">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold">Booking Requests</h1>
                        <p className="text-muted-foreground">Manage rental requests for your vehicles</p>
                    </div>
                </div>
            </div>

            {/* Stats */}
            {!loading && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-8">
                    <Card className="bg-amber-500/10 border-amber-500/20">
                        <CardContent className="p-3 sm:p-4 text-center">
                            <div className="text-xl sm:text-2xl font-bold text-amber-400">{pendingBookings.length}</div>
                            <div className="text-xs sm:text-sm text-amber-400/80">Pending</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-emerald-500/10 border-emerald-500/20">
                        <CardContent className="p-3 sm:p-4 text-center">
                            <div className="text-xl sm:text-2xl font-bold text-emerald-400">
                                {bookings.filter((b) => b.status === 'approved').length}
                            </div>
                            <div className="text-xs sm:text-sm text-emerald-400/80">Approved</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-card/50 border-border/50 col-span-2 sm:col-span-1">
                        <CardContent className="p-3 sm:p-4 text-center">
                            <div className="text-xl sm:text-2xl font-bold">{bookings.length}</div>
                            <div className="text-xs sm:text-sm text-muted-foreground">Total Requests</div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <Card key={i} className="bg-card/50 border-border/50">
                            <CardContent className="p-5">
                                <div className="flex gap-4">
                                    <Skeleton className="w-24 h-24 rounded-xl" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-5 w-3/4" />
                                        <Skeleton className="h-4 w-1/2" />
                                        <Skeleton className="h-4 w-1/3" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : bookings.length === 0 ? (
                <Card className="bg-card/50 border-border/50 border-dashed">
                    <CardContent className="py-16 text-center">
                        <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-muted/50 to-muted/30 flex items-center justify-center mb-6">
                            <svg className="w-10 h-10 text-muted-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold mb-2">No booking requests yet</h3>
                        <p className="text-muted-foreground max-w-md mx-auto">
                            When renters request to book your vehicles, they&apos;ll appear here.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-6">
                    {/* Pending Requests */}
                    {pendingBookings.length > 0 && (
                        <div>
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                                Pending Requests ({pendingBookings.length})
                            </h2>
                            <div className="space-y-4">
                                {pendingBookings.map((booking) => (
                                    <BookingCard
                                        key={booking.id}
                                        booking={booking}
                                        currentUserName={profile?.full_name || 'You'}
                                        onApprove={() => handleApprove(booking.id)}
                                        onReject={() => handleReject(booking.id)}
                                        onRefresh={fetchBookings}
                                        loading={actionLoading === booking.id}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Other Bookings */}
                    {otherBookings.length > 0 && (
                        <div>
                            <h2 className="text-lg font-semibold mb-4">Past Decisions</h2>
                            <div className="space-y-4">
                                {otherBookings.map((booking) => (
                                    <BookingCard
                                        key={booking.id}
                                        booking={booking}
                                        currentUserName={profile?.full_name || 'You'}
                                        onRefresh={fetchBookings}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </PageWrapper >
    );
}

interface BookingCardProps {
    booking: BookingWithDetails;
    currentUserName?: string;
    onApprove?: () => void;
    onReject?: () => void;
    onRefresh?: () => void;
    loading?: boolean;
}

function BookingCard({ booking, currentUserName = 'You', onApprove, onReject, onRefresh, loading }: BookingCardProps) {
    const vehicleImage = booking.vehicle?.images?.[0]?.image_url;
    const startDate = new Date(booking.start_date);
    const endDate = new Date(booking.end_date);
    const hours = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60)));

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="group"
        >
            <Card className={`bg-card/50 border-border/50 overflow-hidden transition-all ${booking.status === 'requested' ? 'hover:border-primary/30' : ''
                }`}>
                <CardContent className="p-5">
                    <div className="flex flex-col sm:flex-row gap-4">
                        {/* Vehicle Image */}
                        <div className="relative w-full sm:w-32 h-44 sm:h-32 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                            {vehicleImage ? (
                                <Image
                                    src={vehicleImage}
                                    alt={booking.vehicle?.title || 'Vehicle'}
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <svg className="w-8 h-8 text-muted-foreground/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                            )}
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-2">
                                <div>
                                    <h3 className="font-semibold text-lg truncate">{booking.vehicle?.title}</h3>
                                    <p className="text-sm text-muted-foreground">
                                        {booking.vehicle?.brand} {booking.vehicle?.model}
                                    </p>
                                </div>
                                <BookingStatusBadge status={booking.status} variant="owner" size="sm" />
                            </div>

                            {/* Renter Info */}
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold">
                                    {booking.renter?.full_name?.charAt(0).toUpperCase() || '?'}
                                </div>
                                <span className="text-sm">{booking.renter?.full_name || 'Unknown Renter'}</span>
                            </div>

                            {/* Dates & Price */}
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    {format(startDate, 'MMM d, h:mm a')} - {format(endDate, 'MMM d, h:mm a')} IST
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-muted-foreground">{hours} hr{hours !== 1 ? 's' : ''}</span>
                                    <span className="text-muted-foreground">•</span>
                                    <span className="font-semibold gradient-text">₹{booking.total_amount}</span>
                                </div>
                            </div>

                            {/* Actions */}
                            {booking.status === 'requested' && onApprove && onReject && (
                                <div className="flex gap-2 mt-4">
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button
                                                size="sm"
                                                className="bg-gradient-to-r from-emerald-500 to-emerald-600"
                                                disabled={loading}
                                            >
                                                {loading ? (
                                                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                                    </svg>
                                                ) : (
                                                    <>
                                                        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                        Approve
                                                    </>
                                                )}
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Approve this booking?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    The renter will be notified and can proceed to payment. The vehicle will be reserved for these dates.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={onApprove} className="bg-emerald-500 hover:bg-emerald-600">
                                                    Yes, Approve
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>

                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="outline" size="sm" disabled={loading}>
                                                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                                Reject
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Reject this booking?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    The renter will be notified that their request was declined. This action cannot be undone.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={onReject} className="bg-red-500 hover:bg-red-600">
                                                    Yes, Reject
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            )}

                            {/* Chat Button */}
                            {isChatEnabled(booking.status) && (
                                <div className="mt-4 pt-4 border-t border-border/50">
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="w-full sm:w-auto border-primary/50 text-primary hover:bg-primary/10"
                                            >
                                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                                </svg>
                                                Chat with Renter
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-lg max-h-[90vh]">
                                            <DialogHeader>
                                                <DialogTitle className="flex items-center gap-2">
                                                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                                    </svg>
                                                    Chat with {booking.renter?.full_name || 'Renter'}
                                                </DialogTitle>
                                            </DialogHeader>
                                            <BookingChat
                                                bookingId={booking.id}
                                                bookingStatus={booking.status}
                                                renterId={booking.renter_id}
                                                ownerId={booking.owner_id}
                                                renterName={booking.renter?.full_name || 'Renter'}
                                                ownerName={currentUserName}
                                            />
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            )}

                            {/* Payment Confirmation Section - For Approved Bookings with Pending Payment */}
                            {booking.status === 'approved' && booking.payment_status === 'pending' && booking.payment_method && (
                                <div className="mt-4 pt-4 border-t border-border/50">
                                    <PaymentConfirmationCard
                                        booking={booking}
                                        onPaymentConfirmed={onRefresh}
                                    />
                                </div>
                            )}

                            {/* Waiting for Renter Payment - Approved but no payment method selected yet */}
                            {booking.status === 'approved' && (!booking.payment_status || booking.payment_status === 'not_started') && (
                                <div className="mt-4 pt-4 border-t border-border/50">
                                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                                        <div className="flex items-center gap-2 text-amber-400 text-sm font-medium">
                                            <svg className="w-4 h-4 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            Waiting for Renter Payment
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            You&apos;ve approved this booking. The renter needs to complete the payment process before you can confirm.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Ride OTP Section - For Confirmed (Paid) Bookings */}
                            {booking.status === 'confirmed' && (
                                <div className="mt-4 pt-4 border-t border-border/50 space-y-3">
                                    <div className="flex items-center gap-2 text-sm text-emerald-400">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Payment confirmed - Ready for ride
                                    </div>

                                    {/* Waiting for renter to upload photos */}
                                    {(!booking.ride_status || booking.ride_status === 'pending') && (
                                        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                                            <div className="flex items-center gap-2 text-amber-400 text-sm font-medium">
                                                <svg className="w-4 h-4 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                Waiting for Renter
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                The renter needs to upload inspection photos before you can generate the Start OTP.
                                            </p>
                                        </div>
                                    )}

                                    {/* Photos uploaded - Ready to generate OTP */}
                                    {booking.ride_status === 'photos_uploaded' && (
                                        <div className="space-y-3">
                                            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
                                                <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                    ✅ Inspection Photos Received
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    Renter has uploaded vehicle inspection photos. Generate the Start OTP to begin the ride.
                                                </p>
                                            </div>
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button 
                                                        size="sm" 
                                                        className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                                                    >
                                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                                        </svg>
                                                        🔑 Generate Start OTP
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="sm:max-w-md">
                                                    <DialogHeader>
                                                        <DialogTitle>🔑 Start Ride OTP</DialogTitle>
                                                    </DialogHeader>
                                                    <RideOTPGenerator
                                                        bookingId={booking.id}
                                                        type="start"
                                                        autoGenerate={true}
                                                    />
                                                </DialogContent>
                                            </Dialog>
                                        </div>
                                    )}

                                    {/* Ride in progress - Generate End OTP */}
                                    {booking.ride_status === 'started' && (
                                        <div className="space-y-3">
                                            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                                                <div className="flex items-center gap-2 text-blue-400 text-sm font-medium">
                                                    <svg className="w-4 h-4 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                    </svg>
                                                    🏍️ Ride in Progress
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    When the renter returns the vehicle, generate the End OTP to complete the booking.
                                                </p>
                                            </div>
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button 
                                                        size="sm" 
                                                        className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
                                                    >
                                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                                        </svg>
                                                        🏁 Generate End OTP
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="sm:max-w-md">
                                                    <DialogHeader>
                                                        <DialogTitle>🏁 End Ride OTP</DialogTitle>
                                                    </DialogHeader>
                                                    <RideOTPGenerator
                                                        bookingId={booking.id}
                                                        type="end"
                                                        autoGenerate={true}
                                                    />
                                                </DialogContent>
                                            </Dialog>
                                        </div>
                                    )}

                                    {/* Ride Completed */}
                                    {booking.ride_status === 'completed' && (
                                        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                                            <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                ✅ Ride Completed Successfully
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                This booking has been completed. Payment will be processed to your account.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}
