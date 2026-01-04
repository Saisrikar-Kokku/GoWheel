'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import PageWrapper from '@/components/layout/PageWrapper';

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

interface AdminStats {
    totalUsers: number;
    totalVehicles: number;
    totalBookings: number;
    completedRentals: number;
    totalReviews: number;
}

const adminTools = [
    {
        title: 'User Management',
        description: 'View and moderate all users',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
        ),
        href: '/dashboard/admin/users',
        color: 'blue',
    },
    {
        title: 'Vehicle Moderation',
        description: 'Review and control listings',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
        ),
        href: '/dashboard/admin/vehicles',
        color: 'emerald',
    },
    {
        title: 'Booking Monitoring',
        description: 'View all platform bookings',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
        ),
        href: '/dashboard/admin/bookings',
        color: 'purple',
    },
    {
        title: 'Review Oversight',
        description: 'Monitor user reviews',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
        ),
        href: '/dashboard/admin/reviews',
        color: 'amber',
    },
    {
        title: 'Owner Payouts',
        description: 'Manage monthly payouts',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
        href: '/dashboard/admin/payouts',
        color: 'green',
    },
];

export default function AdminDashboard() {
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch('/api/admin/stats');
                if (!res.ok) throw new Error('Failed to fetch stats');
                const data = await res.json();
                setStats(data);
            } catch (err) {
                setError('Failed to load statistics');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const statsData = [
        {
            title: 'Total Users',
            value: stats?.totalUsers ?? 0,
            subtitle: 'Registered accounts',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
            ),
            color: 'blue',
        },
        {
            title: 'Total Vehicles',
            value: stats?.totalVehicles ?? 0,
            subtitle: 'Listed vehicles',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
            ),
            color: 'emerald',
        },
        {
            title: 'Total Bookings',
            value: stats?.totalBookings ?? 0,
            subtitle: 'All time bookings',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            ),
            color: 'purple',
        },
        {
            title: 'Completed',
            value: stats?.completedRentals ?? 0,
            subtitle: 'Finished rentals',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            color: 'green',
        },
        {
            title: 'Reviews',
            value: stats?.totalReviews ?? 0,
            subtitle: 'User reviews',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
            ),
            color: 'amber',
        },
    ];

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
                            <h1 className="text-2xl sm:text-3xl font-bold mb-2">
                                Admin Dashboard ⚙️
                            </h1>
                            <p className="text-muted-foreground">
                                Monitor and control the platform.
                            </p>
                        </div>
                        <Badge variant="secondary" className="self-start bg-red-500/10 text-red-400 border-red-500/20 px-3 py-1">
                            <span className="w-2 h-2 rounded-full bg-red-400 mr-2" />
                            Admin Access
                        </Badge>
                    </div>
                </motion.div>

                {/* Stats Grid */}
                <motion.div variants={itemVariants} className="mb-8">
                    <h2 className="text-lg font-semibold mb-4">Platform Overview</h2>
                    {loading ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <Card key={i} className="bg-card/50 border-border/50">
                                    <CardContent className="p-5">
                                        <Skeleton className="h-10 w-10 rounded-xl mb-3" />
                                        <Skeleton className="h-8 w-16 mb-1" />
                                        <Skeleton className="h-4 w-24" />
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : error ? (
                        <Card className="bg-red-500/10 border-red-500/20">
                            <CardContent className="p-4 text-center text-red-400">
                                {error}
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                            {statsData.map((stat, index) => (
                                <Card
                                    key={index}
                                    className="bg-card/50 border-border/50 hover:border-border transition-colors"
                                >
                                    <CardContent className="p-5">
                                        <div className={`w-10 h-10 rounded-xl bg-${stat.color}-500/10 flex items-center justify-center text-${stat.color}-400 mb-3`}>
                                            {stat.icon}
                                        </div>
                                        <div className="text-2xl font-bold mb-0.5">{stat.value}</div>
                                        <div className="text-sm text-muted-foreground">{stat.title}</div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </motion.div>

                {/* Admin Tools */}
                <motion.div variants={itemVariants} className="mb-8">
                    <h2 className="text-lg font-semibold mb-4">Admin Tools</h2>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {adminTools.map((tool, index) => (
                            <Link key={index} href={tool.href}>
                                <Card className="bg-card/50 border-border/50 hover:border-primary/30 transition-all duration-300 cursor-pointer group h-full">
                                    <CardContent className="p-5">
                                        <div className={`w-10 h-10 rounded-xl bg-${tool.color}-500/10 flex items-center justify-center text-${tool.color}-400 mb-3 group-hover:scale-110 transition-transform`}>
                                            {tool.icon}
                                        </div>
                                        <h3 className="font-medium text-sm mb-1 group-hover:text-primary transition-colors">{tool.title}</h3>
                                        <p className="text-xs text-muted-foreground">{tool.description}</p>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                </motion.div>

                {/* Quick Actions */}
                <motion.div variants={itemVariants}>
                    <Card className="bg-gradient-to-br from-primary/10 via-card to-card border-primary/20">
                        <CardContent className="p-6">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div>
                                    <h3 className="font-semibold mb-1">Platform Control Center</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Manage users, moderate content, and monitor platform health.
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <Link href="/dashboard/admin/users">
                                        <Button variant="outline" size="sm">
                                            Manage Users
                                        </Button>
                                    </Link>
                                    <Link href="/dashboard/admin/vehicles">
                                        <Button size="sm" className="bg-primary">
                                            Moderate Vehicles
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </motion.div>
        </PageWrapper>
    );
}
