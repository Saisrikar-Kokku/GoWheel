'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import PageWrapper from '@/components/layout/PageWrapper';

interface Booking {
    id: string;
    start_date: string;
    end_date: string;
    total_price: number;
    status: string;
    payment_status: string;
    created_at: string;
    renter_name: string;
    vehicle_title: string;
    owner_name: string;
}

const statusColors: Record<string, string> = {
    requested: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    approved: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    confirmed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    completed: 'bg-green-500/10 text-green-400 border-green-500/20',
    cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
    rejected: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
};

export default function AdminBookingsPage() {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState('all');

    const fetchBookings = async (status: string) => {
        setLoading(true);
        try {
            const url = status === 'all'
                ? '/api/admin/bookings'
                : `/api/admin/bookings?status=${status}`;
            const res = await fetch(url);
            if (!res.ok) throw new Error('Failed to fetch bookings');
            const data = await res.json();
            setBookings(data.bookings);
        } catch (err) {
            setError('Failed to load bookings');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookings(statusFilter);
    }, [statusFilter]);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatDateShort = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
        });
    };

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
                        <span className="text-foreground">Bookings</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold mb-1">Booking Monitoring</h1>
                            <p className="text-muted-foreground">
                                View all platform bookings (read-only).
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-[160px]">
                                    <SelectValue placeholder="Filter by status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    <SelectItem value="requested">Requested</SelectItem>
                                    <SelectItem value="approved">Approved</SelectItem>
                                    <SelectItem value="confirmed">Confirmed</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                            </Select>
                            <Badge variant="secondary">
                                {bookings.length} bookings
                            </Badge>
                        </div>
                    </div>
                </div>

                {/* Bookings Table */}
                <Card className="bg-card/50 border-border/50">
                    <CardHeader className="pb-3 border-b border-border/50">
                        <CardTitle className="text-lg">All Bookings</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="p-6 space-y-4">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <div key={i} className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <Skeleton className="w-10 h-10 rounded-lg" />
                                            <div>
                                                <Skeleton className="h-4 w-48 mb-1" />
                                                <Skeleton className="h-3 w-32" />
                                            </div>
                                        </div>
                                        <Skeleton className="h-6 w-20" />
                                    </div>
                                ))}
                            </div>
                        ) : error ? (
                            <div className="p-6 text-center text-red-400">{error}</div>
                        ) : bookings.length === 0 ? (
                            <div className="p-6 text-center text-muted-foreground">
                                No bookings found.
                            </div>
                        ) : (
                            <div className="divide-y divide-border/50">
                                {bookings.map((booking) => (
                                    <div
                                        key={booking.id}
                                        className="p-4 hover:bg-muted/30 transition-colors"
                                    >
                                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                            <div className="flex items-start gap-4">
                                                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <div className="font-medium">{booking.vehicle_title}</div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {formatDateShort(booking.start_date)} → {formatDateShort(booking.end_date)}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-4 text-sm">
                                                <div className="text-muted-foreground">
                                                    Renter: <span className="text-foreground">{booking.renter_name}</span>
                                                </div>
                                                <div className="text-muted-foreground">
                                                    Owner: <span className="text-foreground">{booking.owner_name}</span>
                                                </div>
                                                <div className="font-semibold text-primary">
                                                    ₹{booking.total_price}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge className={statusColors[booking.status] || 'bg-gray-500/10 text-gray-400'}>
                                                    {booking.status}
                                                </Badge>
                                                <Badge variant="outline" className="text-xs">
                                                    {booking.payment_status}
                                                </Badge>
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
