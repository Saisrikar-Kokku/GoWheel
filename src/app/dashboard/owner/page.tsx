'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import PageWrapper from '@/components/layout/PageWrapper';
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

export default function OwnerDashboard() {
    const { profile } = useAuth();
    const [vehicles, setVehicles] = useState<VehicleWithImages[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchVehicles = async () => {
            try {
                const data = await getOwnerVehicles();
                setVehicles(data);
            } catch (err) {
                console.error('Failed to load vehicles:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchVehicles();
    }, []);

    const activeVehicles = vehicles.filter((v) => v.is_active);

    const statsData = [
        {
            title: 'Listed Vehicles',
            value: loading ? '—' : vehicles.length.toString(),
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
            ),
            color: 'teal',
        },
        {
            title: 'Active Listings',
            value: loading ? '—' : activeVehicles.length.toString(),
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            color: 'emerald',
        },
        {
            title: 'Total Earnings',
            value: '₹0',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            color: 'amber',
            highlight: true,
        },
        {
            title: 'Pending Requests',
            value: '0',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            color: 'blue',
        },
    ];

    const quickActions = [
        {
            title: 'Add Vehicle',
            description: 'List a new car or bike',
            href: '/dashboard/owner/vehicles/add',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
            ),
            primary: true,
            gradient: 'from-emerald-500 to-teal-500',
        },
        {
            title: 'My Vehicles',
            description: 'Manage your listings',
            href: '/dashboard/owner/vehicles',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
            ),
            gradient: 'from-blue-500 to-indigo-500',
        },
        {
            title: 'Booking Requests',
            description: 'Review pending rentals',
            href: '/dashboard/owner/bookings',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
            ),
            gradient: 'from-purple-500 to-pink-500',
        },
    ];

    return (
        <PageWrapper className="container mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-12">
            <motion.div
                initial="hidden"
                animate="visible"
                variants={containerVariants}
            >
                {/* Welcome Section */}
                <motion.div variants={itemVariants} className="mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-2xl sm:text-3xl font-bold">
                                    Welcome back{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}! 🚗
                                </h1>
                            </div>
                            <p className="text-muted-foreground">
                                Manage your vehicles and start earning from rentals.
                            </p>
                        </div>
                        <Badge variant="secondary" className="self-start bg-teal-500/10 text-teal-400 border-teal-500/20 px-3 py-1">
                            <span className="w-2 h-2 rounded-full bg-teal-400 mr-2 animate-pulse" />
                            Owner Account
                        </Badge>
                    </div>
                </motion.div>

                {/* Stats Grid */}
                <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {statsData.map((stat, index) => (
                        <Card
                            key={index}
                            className={`border-border/50 hover:border-border transition-colors ${stat.highlight
                                ? 'bg-gradient-to-br from-amber-500/10 via-card to-card border-amber-500/20'
                                : 'bg-card/50'
                                }`}
                        >
                            <CardContent className="p-5">
                                <div className="flex items-center justify-between mb-3">
                                    <div className={`w-10 h-10 rounded-xl bg-${stat.color}-500/10 flex items-center justify-center text-${stat.color}-400`}>
                                        {stat.icon}
                                    </div>
                                </div>
                                {loading ? (
                                    <Skeleton className="h-7 w-12 mb-1" />
                                ) : (
                                    <div className={`text-2xl font-bold mb-0.5 ${stat.highlight ? 'gradient-text' : ''}`}>
                                        {stat.value}
                                    </div>
                                )}
                                <div className="text-sm text-muted-foreground">{stat.title}</div>
                            </CardContent>
                        </Card>
                    ))}
                </motion.div>

                {/* Quick Actions */}
                <motion.div variants={itemVariants} className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold">Quick Actions</h2>
                    </div>
                    <div className="grid sm:grid-cols-3 gap-4">
                        {quickActions.map((action, index) => (
                            <Link
                                key={index}
                                href={action.href}
                            >
                                <Card
                                    className={`group border-border/50 hover:border-primary/30 transition-all duration-300 cursor-pointer card-hover overflow-hidden relative h-full ${action.primary
                                        ? 'bg-gradient-to-br from-emerald-500/10 via-card to-card border-emerald-500/20'
                                        : 'bg-card/50'
                                        }`}
                                >
                                    <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-5 transition-opacity`} />
                                    <CardContent className="p-6 relative">
                                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center text-white mb-4 shadow-lg`}>
                                            {action.icon}
                                        </div>
                                        <h3 className="font-semibold mb-1">{action.title}</h3>
                                        <p className="text-sm text-muted-foreground">{action.description}</p>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                </motion.div>

                {/* Main Content Grid */}
                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Recent Vehicles */}
                    <motion.div variants={itemVariants} className="lg:col-span-2">
                        <Card className="bg-card/50 border-border/50 h-full">
                            <CardHeader className="pb-4">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg">Your Vehicles</CardTitle>
                                    <Link href="/dashboard/owner/vehicles">
                                        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                                            View All
                                        </Button>
                                    </Link>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {loading ? (
                                    <div className="space-y-4">
                                        {[1, 2].map((i) => (
                                            <div key={i} className="flex items-center gap-4">
                                                <Skeleton className="w-16 h-16 rounded-lg" />
                                                <div className="flex-1 space-y-2">
                                                    <Skeleton className="h-4 w-3/4" />
                                                    <Skeleton className="h-3 w-1/2" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : vehicles.length === 0 ? (
                                    <div className="text-center py-12">
                                        <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-muted/50 to-muted/30 flex items-center justify-center mb-4">
                                            <svg className="w-10 h-10 text-muted-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                            </svg>
                                        </div>
                                        <h3 className="font-semibold mb-2">No vehicles listed yet</h3>
                                        <p className="text-sm text-muted-foreground max-w-xs mx-auto mb-6">
                                            Start earning by listing your first vehicle for rent!
                                        </p>
                                        <Link href="/dashboard/owner/vehicles/add">
                                            <Button className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
                                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                </svg>
                                                Add Your First Vehicle
                                            </Button>
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {vehicles.slice(0, 3).map((vehicle) => (
                                            <Link
                                                key={vehicle.id}
                                                href={`/dashboard/owner/vehicles/${vehicle.id}/edit`}
                                                className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                                            >
                                                <div className="w-16 h-16 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                                                    {vehicle.images[0] ? (
                                                        <img
                                                            src={vehicle.images[0].image_url}
                                                            alt={vehicle.title}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                            </svg>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-medium truncate">{vehicle.title}</h4>
                                                    <p className="text-sm text-muted-foreground">
                                                        {vehicle.brand} {vehicle.model} • ₹{vehicle.price_per_day}/day
                                                    </p>
                                                </div>
                                                <Badge
                                                    variant={vehicle.is_active ? 'default' : 'secondary'}
                                                    className={vehicle.is_active ? 'bg-emerald-500/20 text-emerald-400' : ''}
                                                >
                                                    {vehicle.is_active ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </Link>
                                        ))}
                                        {vehicles.length > 3 && (
                                            <Link href="/dashboard/owner/vehicles">
                                                <Button variant="ghost" className="w-full text-muted-foreground">
                                                    View all {vehicles.length} vehicles
                                                </Button>
                                            </Link>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Earnings Tips */}
                    <motion.div variants={itemVariants}>
                        <Card className="bg-gradient-to-br from-teal-500/10 via-card to-card border-teal-500/20 h-full">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <svg className="w-5 h-5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                    </svg>
                                    Tips to Earn More
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center flex-shrink-0">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-sm">Great Photos</h4>
                                        <p className="text-xs text-muted-foreground">High-quality images get 50% more bookings</p>
                                    </div>
                                </div>
                                <Separator className="bg-border/50" />
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center flex-shrink-0">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-sm">Competitive Pricing</h4>
                                        <p className="text-xs text-muted-foreground">Price fairly to attract more renters</p>
                                    </div>
                                </div>
                                <Separator className="bg-border/50" />
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center flex-shrink-0">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-sm">Quick Responses</h4>
                                        <p className="text-xs text-muted-foreground">Fast replies lead to higher ratings</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            </motion.div>
        </PageWrapper >
    );
}
