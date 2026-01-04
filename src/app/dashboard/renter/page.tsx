'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
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

const statsData = [
    {
        title: 'Active Rentals',
        value: '0',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
        color: 'emerald',
    },
    {
        title: 'Past Trips',
        value: '0',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
        color: 'blue',
    },
    {
        title: 'Saved',
        value: '0',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
        ),
        color: 'pink',
    },
    {
        title: 'Rating',
        value: '—',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
        ),
        color: 'amber',
    },
];

const quickActions = [
    {
        title: 'Find Vehicles',
        description: 'Browse cars and bikes nearby',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
        ),
        href: '/vehicles',
        gradient: 'from-emerald-500 to-teal-500',
    },
    {
        title: 'My Bookings',
        description: 'View active and past rentals',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
        ),
        href: '/dashboard/renter/bookings',
        gradient: 'from-blue-500 to-indigo-500',
    },
    {
        title: 'Saved Vehicles',
        description: 'Your favorite vehicles',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
        ),
        href: '#',
        gradient: 'from-pink-500 to-rose-500',
    },
];

export default function RenterDashboard() {
    const { profile } = useAuth();

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
                                    Welcome back{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}! 👋
                                </h1>
                            </div>
                            <p className="text-muted-foreground">
                                Find and rent vehicles from trusted owners in your area.
                            </p>
                        </div>
                        <Badge variant="secondary" className="self-start bg-emerald-500/10 text-emerald-400 border-emerald-500/20 px-3 py-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 mr-2 animate-pulse" />
                            Renter Account
                        </Badge>
                    </div>
                </motion.div>

                {/* Stats Grid */}
                <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {statsData.map((stat, index) => (
                        <Card
                            key={index}
                            className="bg-card/50 border-border/50 hover:border-border transition-colors"
                        >
                            <CardContent className="p-5">
                                <div className="flex items-center justify-between mb-3">
                                    <div className={`w-10 h-10 rounded-xl bg-${stat.color}-500/10 flex items-center justify-center text-${stat.color}-400`}>
                                        {stat.icon}
                                    </div>
                                </div>
                                <div className="text-2xl font-bold mb-0.5">{stat.value}</div>
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
                            <Link key={index} href={action.href}>
                                <Card
                                    className="group bg-card/50 border-border/50 hover:border-primary/30 transition-all duration-300 cursor-pointer card-hover overflow-hidden relative h-full"
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
                    {/* Recent Activity */}
                    <motion.div variants={itemVariants} className="lg:col-span-2">
                        <Card className="bg-card/50 border-border/50 h-full">
                            <CardHeader className="pb-4">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg">Recent Activity</CardTitle>
                                    <Button variant="ghost" size="sm" disabled className="text-muted-foreground">
                                        View All
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-center py-12">
                                    <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-muted/50 to-muted/30 flex items-center justify-center mb-4">
                                        <svg className="w-10 h-10 text-muted-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                        </svg>
                                    </div>
                                    <h3 className="font-semibold mb-2">No rentals yet</h3>
                                    <p className="text-sm text-muted-foreground max-w-xs mx-auto mb-6">
                                        Start exploring vehicles in your area and book your first rental today!
                                    </p>
                                    <Link href="/vehicles">
                                        <Button className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
                                            Browse Vehicles
                                        </Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Tips & Information */}
                    <motion.div variants={itemVariants}>
                        <Card className="bg-gradient-to-br from-emerald-500/10 via-card to-card border-emerald-500/20 h-full">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Getting Started
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                                        1
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-sm">Browse Vehicles</h4>
                                        <p className="text-xs text-muted-foreground">Find cars and bikes in your area</p>
                                    </div>
                                </div>
                                <Separator className="bg-border/50" />
                                <div className="flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                                        2
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-sm">Book & Pay</h4>
                                        <p className="text-xs text-muted-foreground">Secure booking with instant confirmation</p>
                                    </div>
                                </div>
                                <Separator className="bg-border/50" />
                                <div className="flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                                        3
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-sm">Pick Up & Go</h4>
                                        <p className="text-xs text-muted-foreground">Meet the owner and hit the road</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            </motion.div>
        </PageWrapper>
    );
}
