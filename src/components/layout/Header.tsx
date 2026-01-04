'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import NotificationBell from '@/components/notifications/NotificationBell';

const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/vehicles', label: 'Browse Vehicles' },
    { href: '/dashboard', label: 'Dashboard', requiresAuth: true },
];

export default function Header() {
    const pathname = usePathname();
    const router = useRouter();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { user, profile, loading, signOut } = useAuth();

    const handleSignOut = async () => {
        await signOut();
        router.push('/');
        router.refresh();
    };

    const visibleLinks = navLinks.filter(
        (link) => !link.requiresAuth || (link.requiresAuth && user)
    );

    return (
        <motion.header
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60"
        >
            <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2.5 group">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20 transition-transform duration-300 group-hover:scale-105">
                        <svg
                            className="h-5 w-5 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2.5}
                                d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                            />
                        </svg>
                    </div>
                    <span className="text-xl font-bold gradient-text ms-1 sm:inline">
                        GoWheel
                    </span>
                </Link>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center gap-1">
                    {visibleLinks.map((link) => {
                        const isActive = pathname === link.href ||
                            (link.href !== '/' && pathname.startsWith(link.href));
                        return (
                            <Link key={link.href} href={link.href}>
                                <Button
                                    variant={isActive ? 'secondary' : 'ghost'}
                                    size="sm"
                                    className={`font-medium transition-all duration-200 ${isActive
                                        ? 'bg-primary/10 text-primary hover:bg-primary/15'
                                        : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                >
                                    {link.label}
                                </Button>
                            </Link>
                        );
                    })}
                </nav>

                {/* Auth Section */}
                <div className="flex items-center gap-3">
                    {loading ? (
                        <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
                    ) : user ? (
                        <>
                            {/* Notification Bell */}
                            <NotificationBell />

                            {/* User Menu */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="flex items-center gap-3 px-2 py-1.5 rounded-xl hover:bg-accent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white text-sm font-semibold shadow-lg shadow-emerald-500/20">
                                            {profile?.full_name?.charAt(0)?.toUpperCase() ||
                                                user.email?.charAt(0)?.toUpperCase() || 'U'}
                                        </div>
                                        <div className="hidden sm:block text-left">
                                            <div className="text-sm font-medium leading-none">
                                                {profile?.full_name?.split(' ')[0] || 'User'}
                                            </div>
                                            <div className="text-xs text-muted-foreground capitalize mt-0.5">
                                                {profile?.role || 'user'}
                                            </div>
                                        </div>
                                        <svg
                                            className="w-4 h-4 text-muted-foreground hidden sm:block"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                    <DropdownMenuLabel className="font-normal">
                                        <div className="flex flex-col space-y-1">
                                            <p className="text-sm font-medium leading-none">
                                                {profile?.full_name || 'User'}
                                            </p>
                                            <p className="text-xs leading-none text-muted-foreground">
                                                {user.email}
                                            </p>
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem asChild>
                                        <Link href="/dashboard" className="cursor-pointer">
                                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                            </svg>
                                            Dashboard
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem disabled>
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        Profile Settings
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onClick={handleSignOut}
                                        className="text-red-500 focus:text-red-500 cursor-pointer"
                                    >
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                        </svg>
                                        Sign Out
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </>
                    ) : (
                        <>
                            <Link href="/auth" className="hidden sm:block">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-muted-foreground hover:text-foreground"
                                >
                                    Sign In
                                </Button>
                            </Link>
                            <Link href="/auth">
                                <Button
                                    size="sm"
                                    className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/20 transition-all duration-300 hover:shadow-emerald-500/30 px-3 sm:px-4"
                                >
                                    <span className="hidden xs:inline">Get Started</span>
                                    <span className="xs:hidden">Join</span>
                                </Button>
                            </Link>
                        </>
                    )}

                    {/* Mobile Menu Button */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden h-9 w-9"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        <svg
                            className="h-5 w-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            {mobileMenuOpen ? (
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            ) : (
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 6h16M4 12h16M4 18h16"
                                />
                            )}
                        </svg>
                    </Button>
                </div>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="md:hidden border-t border-border/40 bg-background/95 backdrop-blur-xl overflow-hidden"
                    >
                        <nav className="container mx-auto px-4 py-4 flex flex-col gap-2">
                            {visibleLinks.map((link) => {
                                const isActive = pathname === link.href ||
                                    (link.href !== '/' && pathname.startsWith(link.href));
                                return (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        <Button
                                            variant={isActive ? 'secondary' : 'ghost'}
                                            className={`w-full justify-start ${isActive ? 'bg-primary/10 text-primary' : ''
                                                }`}
                                        >
                                            {link.label}
                                        </Button>
                                    </Link>
                                );
                            })}

                            {user && (
                                <>
                                    <Separator className="my-2" />
                                    <div className="flex items-center gap-3 px-3 py-2">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-semibold">
                                            {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                                        </div>
                                        <div>
                                            <div className="font-medium">{profile?.full_name || 'User'}</div>
                                            <div className="text-sm text-muted-foreground">{user.email}</div>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        className="w-full justify-start text-red-500 hover:text-red-500 hover:bg-red-500/10"
                                        onClick={() => {
                                            setMobileMenuOpen(false);
                                            handleSignOut();
                                        }}
                                    >
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                        </svg>
                                        Sign Out
                                    </Button>
                                </>
                            )}
                        </nav>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.header>
    );
}
