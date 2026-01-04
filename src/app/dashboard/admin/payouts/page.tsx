'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
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
import PageWrapper from '@/components/layout/PageWrapper';

interface PayoutBooking {
    id: string;
    total_amount: number;
    status: string;
    payment_status: string;
    payout_status: string;
    platform_commission: number;
    owner_payout_amount: number;
    created_at: string;
    owner_name: string;
    vehicle_title: string;
}

const payoutStatusColors: Record<string, string> = {
    pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    paid: 'bg-green-500/10 text-green-400 border-green-500/20',
    failed: 'bg-red-500/10 text-red-400 border-red-500/20',
};

export default function AdminPayoutsPage() {
    const [bookings, setBookings] = useState<PayoutBooking[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const fetchPayouts = async () => {
        try {
            const res = await fetch('/api/admin/payouts');
            if (!res.ok) throw new Error('Failed to fetch payouts');
            const data = await res.json();
            setBookings(data.bookings);
        } catch (err) {
            setError('Failed to load payouts');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayouts();
    }, []);

    const markAsPaid = async (bookingId: string) => {
        setActionLoading(bookingId);
        try {
            const res = await fetch('/api/admin/payouts', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bookingId, payoutStatus: 'paid' }),
            });

            if (!res.ok) throw new Error('Failed to update payout');

            // Update local state
            setBookings(bookings.map(b =>
                b.id === bookingId ? { ...b, payout_status: 'paid' } : b
            ));
        } catch (err) {
            console.error(err);
            alert('Failed to update payout status');
        } finally {
            setActionLoading(null);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    // Calculate totals
    const pendingPayouts = bookings.filter(b => b.payout_status === 'pending');
    const totalPendingAmount = pendingPayouts.reduce((sum, b) => sum + (b.owner_payout_amount || 0), 0);
    const totalCommission = bookings.reduce((sum, b) => sum + (b.platform_commission || 0), 0);

    return (
        <PageWrapper className="container mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-12">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                        <Link href="/dashboard/admin" className="hover:text-primary transition-colors">
                            Admin
                        </Link>
                        <span>/</span>
                        <span className="text-foreground">Payouts</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold mb-1">Owner Payouts</h1>
                            <p className="text-muted-foreground">
                                Manage monthly owner payouts for completed bookings.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                    <Card className="bg-yellow-500/10 border-yellow-500/20">
                        <CardContent className="p-5">
                            <div className="text-sm text-yellow-400 mb-1">Pending Payouts</div>
                            <div className="text-2xl font-bold text-yellow-400">
                                ₹{totalPendingAmount.toLocaleString('en-IN')}
                            </div>
                            <div className="text-xs text-muted-foreground">
                                {pendingPayouts.length} bookings
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-emerald-500/10 border-emerald-500/20">
                        <CardContent className="p-5">
                            <div className="text-sm text-emerald-400 mb-1">Platform Commission</div>
                            <div className="text-2xl font-bold text-emerald-400">
                                ₹{totalCommission.toLocaleString('en-IN')}
                            </div>
                            <div className="text-xs text-muted-foreground">
                                10% of all bookings
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-blue-500/10 border-blue-500/20">
                        <CardContent className="p-5">
                            <div className="text-sm text-blue-400 mb-1">Completed Bookings</div>
                            <div className="text-2xl font-bold text-blue-400">
                                {bookings.length}
                            </div>
                            <div className="text-xs text-muted-foreground">
                                Total this period
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Payouts Table */}
                <Card className="bg-card/50 border-border/50">
                    <CardHeader className="pb-3 border-b border-border/50">
                        <CardTitle className="text-lg">Completed Bookings</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="p-6 space-y-4">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="flex items-center justify-between">
                                        <Skeleton className="h-12 w-full" />
                                    </div>
                                ))}
                            </div>
                        ) : error ? (
                            <div className="p-6 text-center text-red-400">{error}</div>
                        ) : bookings.length === 0 ? (
                            <div className="p-6 text-center text-muted-foreground">
                                No completed bookings yet.
                            </div>
                        ) : (
                            <div className="divide-y divide-border/50">
                                {bookings.map((booking) => (
                                    <div
                                        key={booking.id}
                                        className="p-4 hover:bg-muted/30 transition-colors"
                                    >
                                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="font-medium">{booking.vehicle_title}</div>
                                                <div className="text-sm text-muted-foreground">
                                                    Owner: {booking.owner_name} • {formatDate(booking.created_at)}
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-4">
                                                <div className="text-sm">
                                                    <span className="text-muted-foreground">Total: </span>
                                                    <span className="font-medium">₹{booking.total_amount}</span>
                                                </div>
                                                <div className="text-sm">
                                                    <span className="text-muted-foreground">Commission: </span>
                                                    <span className="text-emerald-400">₹{booking.platform_commission}</span>
                                                </div>
                                                <div className="text-sm">
                                                    <span className="text-muted-foreground">Payout: </span>
                                                    <span className="font-semibold text-primary">₹{booking.owner_payout_amount}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge className={payoutStatusColors[booking.payout_status] || ''}>
                                                    {booking.payout_status}
                                                </Badge>
                                                {booking.payout_status === 'pending' && (
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button
                                                                size="sm"
                                                                disabled={actionLoading === booking.id}
                                                            >
                                                                {actionLoading === booking.id ? (
                                                                    <span className="flex items-center gap-2">
                                                                        <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                                                        ...
                                                                    </span>
                                                                ) : (
                                                                    'Mark as Paid'
                                                                )}
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Confirm Payout</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    Have you transferred ₹{booking.owner_payout_amount} to {booking.owner_name}?
                                                                    This action cannot be undone.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                <AlertDialogAction onClick={() => markAsPaid(booking.id)}>
                                                                    Yes, Mark as Paid
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>
        </PageWrapper>
    );
}
