'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import PageWrapper from '@/components/layout/PageWrapper';
import VehicleCard from '@/components/vehicles/VehicleCard';
import { getOwnerVehicles } from '@/services/vehicleService';
import { VehicleWithImages } from '@/types/vehicle';

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
        transition: { duration: 0.4, ease: 'easeOut' as const },
    },
};

export default function OwnerVehiclesPage() {
    const [vehicles, setVehicles] = useState<VehicleWithImages[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchVehicles = async () => {
        try {
            setLoading(true);
            const data = await getOwnerVehicles();
            setVehicles(data);
        } catch (err) {
            setError('Failed to load vehicles');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVehicles();
    }, []);

    const handleDelete = (deletedId: string) => {
        setVehicles((prev) => prev.filter((v) => v.id !== deletedId));
    };

    const activeCount = vehicles.filter((v) => v.is_active).length;
    const inactiveCount = vehicles.filter((v) => !v.is_active).length;

    return (
        <PageWrapper className="container mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-12">
            <motion.div
                initial="hidden"
                animate="visible"
                variants={containerVariants}
            >
                {/* Header */}
                <motion.div variants={itemVariants} className="mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <Link
                                    href="/dashboard/owner"
                                    className="text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </Link>
                                <h1 className="text-2xl sm:text-3xl font-bold">My Vehicles</h1>
                            </div>
                            <p className="text-muted-foreground">
                                Manage your vehicle listings and track their performance
                            </p>
                        </div>
                        <Link href="/dashboard/owner/vehicles/add">
                            <Button className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/20 group">
                                <svg className="w-4 h-4 mr-2 transition-transform group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                Add Vehicle
                            </Button>
                        </Link>
                    </div>
                </motion.div>

                {/* Stats Bar */}
                <motion.div variants={itemVariants} className="mb-8">
                    <Card className="bg-gradient-to-r from-card via-card to-emerald-500/5 border-border/50">
                        <CardContent className="p-0">
                            <div className="grid grid-cols-3 divide-x divide-border/50">
                                <div className="p-5 text-center">
                                    <div className="text-3xl font-bold mb-1">
                                        {loading ? <Skeleton className="h-9 w-12 mx-auto" /> : vehicles.length}
                                    </div>
                                    <div className="text-sm text-muted-foreground">Total Vehicles</div>
                                </div>
                                <div className="p-5 text-center">
                                    <div className="text-3xl font-bold text-emerald-400 mb-1">
                                        {loading ? <Skeleton className="h-9 w-12 mx-auto" /> : activeCount}
                                    </div>
                                    <div className="text-sm text-muted-foreground flex items-center justify-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                        Active
                                    </div>
                                </div>
                                <div className="p-5 text-center">
                                    <div className="text-3xl font-bold text-muted-foreground/70 mb-1">
                                        {loading ? <Skeleton className="h-9 w-12 mx-auto" /> : inactiveCount}
                                    </div>
                                    <div className="text-sm text-muted-foreground">Inactive</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Vehicle List */}
                {loading ? (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map((i) => (
                            <Card key={i} className="bg-card/50 border-border/50 overflow-hidden">
                                <Skeleton className="h-48 w-full" />
                                <CardContent className="p-5 space-y-3">
                                    <div className="flex justify-between">
                                        <Skeleton className="h-6 w-32" />
                                        <Skeleton className="h-6 w-16" />
                                    </div>
                                    <Skeleton className="h-4 w-40" />
                                    <Skeleton className="h-4 w-24" />
                                    <Separator className="my-3" />
                                    <div className="flex gap-2">
                                        <Skeleton className="h-10 flex-1" />
                                        <Skeleton className="h-10 w-10" />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : error ? (
                    <motion.div variants={itemVariants}>
                        <Card className="bg-red-500/10 border-red-500/20">
                            <CardContent className="p-8 text-center">
                                <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-semibold text-red-400 mb-2">Failed to Load Vehicles</h3>
                                <p className="text-sm text-red-400/80 mb-4">{error}</p>
                                <Button variant="outline" onClick={fetchVehicles} className="border-red-500/30 hover:bg-red-500/10">
                                    Try Again
                                </Button>
                            </CardContent>
                        </Card>
                    </motion.div>
                ) : vehicles.length === 0 ? (
                    <motion.div variants={itemVariants}>
                        <Card className="bg-card/50 border-border/50 border-dashed">
                            <CardContent className="py-20 text-center">
                                <div className="mx-auto w-24 h-24 rounded-3xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center mb-6">
                                    <svg className="w-12 h-12 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-semibold mb-2">No vehicles listed yet</h3>
                                <p className="text-muted-foreground max-w-md mx-auto mb-8">
                                    Start earning by listing your first vehicle. Upload photos, set your price, and get bookings from renters in your area.
                                </p>
                                <Link href="/dashboard/owner/vehicles/add">
                                    <Button size="lg" className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/25">
                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                        Add Your First Vehicle
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    </motion.div>
                ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {vehicles.map((vehicle) => (
                            <VehicleCard
                                key={vehicle.id}
                                vehicle={vehicle}
                                onDelete={handleDelete}
                            />
                        ))}
                    </div>
                )}

                {/* Tip Card */}
                {!loading && vehicles.length > 0 && (
                    <motion.div variants={itemVariants} className="mt-8">
                        <Card className="bg-gradient-to-r from-blue-500/10 via-card to-card border-blue-500/20">
                            <CardContent className="p-4 flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <h4 className="font-medium text-blue-400">Pro Tip</h4>
                                    <p className="text-sm text-muted-foreground">
                                        Vehicles with multiple high-quality photos get up to 50% more bookings. Make sure to add clear images from different angles!
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </motion.div>
        </PageWrapper>
    );
}
