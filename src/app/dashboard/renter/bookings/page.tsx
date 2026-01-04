'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import RideInspectionUpload from '@/components/ride/RideInspectionUpload';
import RideOTPVerification from '@/components/ride/RideOTPVerification';
import ManualPaymentDialog from '@/components/payments/ManualPaymentDialog';
import { getRenterBookings, cancelBooking } from '@/services/bookingService';
import { BookingWithDetails } from '@/types/booking';
import { isChatEnabled } from '@/types/chat';
import { useAuth } from '@/contexts/AuthContext';

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

export default function RenterBookingsPage() {
    const { profile } = useAuth();
    const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const [cancelLoading, setCancelLoading] = useState<string | null>(null);

    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        try {
            const data = await getRenterBookings();
            setBookings(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async (bookingId: string) => {
        setCancelLoading(bookingId);
        try {
            await cancelBooking(bookingId);
            setBookings((prev) =>
                prev.map((b) => (b.id === bookingId ? { ...b, status: 'cancelled' } : b))
            );
        } catch (err) {
            console.error(err);
        } finally {
            setCancelLoading(null);
        }
    };

    const activeBookings = bookings.filter((b) => ['requested', 'approved', 'confirmed'].includes(b.status));
    const pastBookings = bookings.filter((b) => ['rejected', 'cancelled'].includes(b.status));

    return (
        <PageWrapper className="container mx-auto max-w-5xl px-4 sm:px-6 py-8 sm:py-12">
            <div>
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <Link href="/dashboard/renter">
                            <Button variant="ghost" size="icon" className="h-9 w-9">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold">My Bookings</h1>
                            <p className="text-muted-foreground">Track your rental requests</p>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                {!loading && bookings.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-8">
                        <Card className="bg-amber-500/10 border-amber-500/20">
                            <CardContent className="p-3 sm:p-4 text-center">
                                <div className="text-xl sm:text-2xl font-bold text-amber-400">
                                    {bookings.filter((b) => b.status === 'requested').length}
                                </div>
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
                                <div className="text-xs sm:text-sm text-muted-foreground">Total Bookings</div>
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
                    <div>
                        <Card className="bg-card/50 border-border/50 border-dashed">
                            <CardContent className="py-16 text-center">
                                <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-muted/50 to-muted/30 flex items-center justify-center mb-6">
                                    <svg className="w-10 h-10 text-muted-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-semibold mb-2">No bookings yet</h3>
                                <p className="text-muted-foreground max-w-md mx-auto mb-6">
                                    You haven&apos;t made any booking requests yet. Browse available vehicles to get started!
                                </p>
                                <Link href="/vehicles">
                                    <Button className="bg-gradient-to-r from-primary to-emerald-500">
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                        Browse Vehicles
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Active Bookings */}
                        {activeBookings.length > 0 && (
                            <div>
                                <h2 className="text-lg font-semibold mb-4">Active Bookings</h2>
                                <div className="space-y-4">
                                    {activeBookings.map((booking) => (
                                        <RenterBookingCard
                                            key={booking.id}
                                            booking={booking}
                                            currentUserId={profile?.id || ''}
                                            currentUserName={profile?.full_name || 'You'}
                                            onCancel={() => handleCancel(booking.id)}
                                            cancelLoading={cancelLoading === booking.id}
                                            onPaymentComplete={() => fetchBookings()}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Past Bookings */}
                        {pastBookings.length > 0 && (
                            <div>
                                <h2 className="text-lg font-semibold mb-4 text-muted-foreground">Past Bookings</h2>
                                <div className="space-y-4 opacity-70">
                                    {pastBookings.map((booking) => (
                                        <RenterBookingCard
                                            key={booking.id}
                                            booking={booking}
                                            currentUserId={profile?.id || ''}
                                            currentUserName={profile?.full_name || 'You'}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </PageWrapper>
    );
}

interface RenterBookingCardProps {
    booking: BookingWithDetails;
    currentUserId: string;
    currentUserName: string;
    onCancel?: () => void;
    cancelLoading?: boolean;
    onPaymentComplete?: () => void;
}

function RenterBookingCard({ booking, currentUserId, currentUserName, onCancel, cancelLoading, onPaymentComplete }: RenterBookingCardProps) {
    const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
    const vehicleImage = booking.vehicle?.images?.[0]?.image_url;
    const startDate = new Date(booking.start_date);
    const endDate = new Date(booking.end_date);
    const hours = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60)));
    const canPay = booking.status === 'approved' && booking.payment_status !== 'paid' && booking.payment_status !== 'pending';
    const isPendingPayment = booking.status === 'approved' && booking.payment_status === 'pending';

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <Card className="bg-card/50 border-border/50 overflow-hidden hover:border-border transition-colors">
                <CardContent className="p-5">
                    <div className="flex flex-col sm:flex-row gap-4">
                        {/* Vehicle Image */}
                        <Link href={`/vehicles/${booking.vehicle_id}`} className="block">
                            <div className="relative w-full sm:w-32 h-44 sm:h-32 rounded-xl overflow-hidden bg-muted flex-shrink-0 group">
                                {vehicleImage ? (
                                    <Image
                                        src={vehicleImage}
                                        alt={booking.vehicle?.title || 'Vehicle'}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <svg className="w-8 h-8 text-muted-foreground/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                        </Link>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-2">
                                <div>
                                    <Link href={`/vehicles/${booking.vehicle_id}`} className="hover:text-primary transition-colors">
                                        <h3 className="font-semibold text-lg truncate">{booking.vehicle?.title}</h3>
                                    </Link>
                                    <p className="text-sm text-muted-foreground">
                                        {booking.vehicle?.brand} {booking.vehicle?.model}
                                    </p>
                                </div>
                                <BookingStatusBadge status={booking.status} variant="renter" size="sm" />
                            </div>

                            {/* Dates & Price */}
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm mb-3">
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

                            {/* Status Message & Payment */}
                            <div className="text-sm">
                                {booking.status === 'requested' && (
                                    <p className="text-amber-400/80">⏳ Waiting for owner approval</p>
                                )}
                                {booking.status === 'approved' && booking.payment_status === 'not_started' && (
                                    <p className="text-emerald-400/80">✅ Approved! Complete payment to confirm.</p>
                                )}
                                {isPendingPayment && (
                                    <p className="text-amber-400/80">⏳ Payment submitted. Waiting for owner to confirm.</p>
                                )}
                                {booking.status === 'confirmed' && (
                                    <p className="text-emerald-400/80">🎉 Booking Confirmed! See you soon.</p>
                                )}
                                {booking.payment_status === 'failed' && (
                                    <p className="text-red-400/80">❌ Payment failed. Please try again.</p>
                                )}
                                {booking.status === 'rejected' && (
                                    <p className="text-red-400/80">❌ The owner declined this request.</p>
                                )}
                                {booking.status === 'cancelled' && (
                                    <p className="text-gray-400/80">🚫 You cancelled this booking.</p>
                                )}
                            </div>

                            {/* Manual Payment Button */}
                            {canPay && (
                                <div className="mt-4">
                                    <Button
                                        onClick={() => setPaymentDialogOpen(true)}
                                        className="w-full sm:w-auto bg-gradient-to-r from-primary to-emerald-500 hover:from-primary/90 hover:to-emerald-500/90"
                                    >
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                        </svg>
                                        Pay ₹{booking.total_amount}
                                    </Button>

                                    {/* Manual Payment Dialog */}
                                    <ManualPaymentDialog
                                        open={paymentDialogOpen}
                                        onOpenChange={setPaymentDialogOpen}
                                        bookingId={booking.id}
                                        amount={booking.total_amount}
                                        ownerName={booking.owner?.full_name || 'Owner'}
                                        ownerPhone={booking.owner?.phone}
                                        onPaymentSubmitted={() => {
                                            onPaymentComplete?.();
                                        }}
                                    />
                                </div>
                            )}

                            {/* Payment Pending Status */}
                            {isPendingPayment && (
                                <div className="mt-4">
                                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                                                <svg className="w-5 h-5 text-amber-400 animate-pulse" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-amber-400">Payment Pending Confirmation</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {booking.payment_method && (
                                                        <>Paying via <span className="capitalize font-medium">{booking.payment_method}</span> • </>
                                                    )}
                                                    Waiting for owner to verify
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Ride Verification Section - For Confirmed Bookings */}
                            {booking.status === 'confirmed' && booking.payment_status === 'paid' && (
                                <div className="mt-6 pt-4 border-t border-border/50 space-y-6">
                                    <div className="flex items-center gap-2 text-primary">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                        </svg>
                                        <h4 className="font-semibold">Ride Verification</h4>
                                    </div>

                                    {/* Step 1: Upload Inspection Photos */}
                                    {(!booking.ride_status || booking.ride_status === 'pending') && (
                                        <div className="space-y-3">
                                            <p className="text-sm text-muted-foreground">
                                                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary/20 text-primary text-xs font-medium mr-2">1</span>
                                                Upload photos of the vehicle before starting your ride
                                            </p>
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        className="w-full border-amber-500/50 text-amber-400 hover:bg-amber-500/10"
                                                    >
                                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        </svg>
                                                        📷 Upload Inspection Photos
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                                                    <DialogHeader>
                                                        <DialogTitle>Vehicle Inspection Photos</DialogTitle>
                                                    </DialogHeader>
                                                    <RideInspectionUpload
                                                        bookingId={booking.id}
                                                        inspectionType="pre_ride"
                                                        onUploadComplete={(isComplete) => {
                                                            // Only reload when ALL required images are uploaded
                                                            if (isComplete) {
                                                                window.location.reload();
                                                            }
                                                        }}
                                                    />
                                                </DialogContent>
                                            </Dialog>
                                        </div>
                                    )}

                                    {/* Step 2: Enter OTP to Start Ride */}
                                    {booking.ride_status === 'photos_uploaded' && (
                                        <div className="space-y-3">
                                            <p className="text-sm text-muted-foreground">
                                                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary/20 text-primary text-xs font-medium mr-2">2</span>
                                                ✅ Photos uploaded! Wait for the owner to generate your Start OTP
                                            </p>
                                            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-sm text-amber-400">
                                                <p>📱 The owner will generate an OTP and you&apos;ll receive it via email. Enter it below to start your ride.</p>
                                            </div>
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button className="w-full bg-gradient-to-r from-primary to-emerald-500">
                                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                        </svg>
                                                        🔑 Enter Start OTP
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="sm:max-w-md">
                                                    <DialogHeader>
                                                        <DialogTitle>Enter OTP to Start Ride</DialogTitle>
                                                    </DialogHeader>
                                                    <RideOTPVerification
                                                        bookingId={booking.id}
                                                        type="start"
                                                        onVerified={(success) => {
                                                            if (success) window.location.reload();
                                                        }}
                                                    />
                                                </DialogContent>
                                            </Dialog>
                                        </div>
                                    )}

                                    {/* Ride is Active */}
                                    {booking.ride_status === 'started' && (
                                        <div className="space-y-3">
                                            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                                                <div className="flex items-center gap-2 text-green-400 font-medium">
                                                    <svg className="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                    </svg>
                                                    🏍️ Ride in Progress!
                                                </div>
                                                <p className="text-sm text-muted-foreground mt-2">
                                                    Enjoy your ride! When you&apos;re done, the owner will generate an End OTP to complete the booking.
                                                </p>
                                            </div>
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button variant="outline" className="w-full border-blue-500/50 text-blue-400 hover:bg-blue-500/10">
                                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                        </svg>
                                                        🏁 Enter End OTP to Complete Ride
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="sm:max-w-md">
                                                    <DialogHeader>
                                                        <DialogTitle>Enter OTP to End Ride</DialogTitle>
                                                    </DialogHeader>
                                                    <RideOTPVerification
                                                        bookingId={booking.id}
                                                        type="end"
                                                        onVerified={(success) => {
                                                            if (success) window.location.reload();
                                                        }}
                                                    />
                                                </DialogContent>
                                            </Dialog>
                                        </div>
                                    )}

                                    {/* Ride Completed */}
                                    {booking.ride_status === 'completed' && (
                                        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                                            <div className="flex items-center gap-2 text-green-400 font-medium">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                ✅ Ride Completed Successfully!
                                            </div>
                                            <p className="text-sm text-muted-foreground mt-2">
                                                Thank you for using GoWheel! We hope you had a great ride.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Cancel Button */}
                            {booking.status === 'requested' && onCancel && (
                                <div className="mt-3">
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="outline" size="sm" disabled={cancelLoading}>
                                                {cancelLoading ? (
                                                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                                    </svg>
                                                ) : (
                                                    <>
                                                        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                        Cancel Request
                                                    </>
                                                )}
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Cancel this booking request?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This will cancel your booking request. You can make a new request later if needed.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Keep Request</AlertDialogCancel>
                                                <AlertDialogAction onClick={onCancel} className="bg-red-500 hover:bg-red-600">
                                                    Yes, Cancel
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
                                                className="w-full sm:w-auto border-primary/50 text-primary hover:bg-primary/10"
                                            >
                                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                                </svg>
                                                Chat with Owner
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-lg max-h-[90vh]">
                                            <DialogHeader>
                                                <DialogTitle className="flex items-center gap-2">
                                                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                                    </svg>
                                                    Chat with {booking.owner?.full_name || 'Owner'}
                                                </DialogTitle>
                                            </DialogHeader>
                                            <BookingChat
                                                bookingId={booking.id}
                                                bookingStatus={booking.status}
                                                renterId={booking.renter_id}
                                                ownerId={booking.owner_id}
                                                renterName={currentUserName}
                                                ownerName={booking.owner?.full_name || 'Owner'}
                                            />
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}
