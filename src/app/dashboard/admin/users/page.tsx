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

interface User {
    id: string;
    full_name: string | null;
    role: 'renter' | 'owner' | 'admin';
    created_at: string;
    is_blocked: boolean;
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/admin/users');
            if (!res.ok) throw new Error('Failed to fetch users');
            const data = await res.json();
            setUsers(data.users);
        } catch (err) {
            setError('Failed to load users');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const toggleBlock = async (userId: string, block: boolean) => {
        setActionLoading(userId);
        try {
            const res = await fetch('/api/admin/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, isBlocked: block }),
            });

            if (!res.ok) throw new Error('Failed to update user');

            // Update local state
            setUsers(users.map(u =>
                u.id === userId ? { ...u, is_blocked: block } : u
            ));
        } catch (err) {
            console.error(err);
            alert('Failed to update user');
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

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'admin':
                return <Badge className="bg-red-500/10 text-red-400 border-red-500/20">Admin</Badge>;
            case 'owner':
                return <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Owner</Badge>;
            default:
                return <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">Renter</Badge>;
        }
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
                        <span className="text-foreground">Users</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold mb-1">User Management</h1>
                            <p className="text-muted-foreground">
                                View and moderate platform users.
                            </p>
                        </div>
                        <Badge variant="secondary" className="self-start">
                            {users.length} users
                        </Badge>
                    </div>
                </div>

                {/* Users Table */}
                <Card className="bg-card/50 border-border/50">
                    <CardHeader className="pb-3 border-b border-border/50">
                        <CardTitle className="text-lg">All Users</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="p-6 space-y-4">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <div key={i} className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <Skeleton className="w-10 h-10 rounded-full" />
                                            <div>
                                                <Skeleton className="h-4 w-32 mb-1" />
                                                <Skeleton className="h-3 w-24" />
                                            </div>
                                        </div>
                                        <Skeleton className="h-8 w-20" />
                                    </div>
                                ))}
                            </div>
                        ) : error ? (
                            <div className="p-6 text-center text-red-400">{error}</div>
                        ) : users.length === 0 ? (
                            <div className="p-6 text-center text-muted-foreground">
                                No users found.
                            </div>
                        ) : (
                            <div className="divide-y divide-border/50">
                                {users.map((user) => (
                                    <div
                                        key={user.id}
                                        className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:bg-muted/30 transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${user.is_blocked ? 'bg-red-500' : 'bg-gradient-to-br from-primary to-emerald-500'
                                                }`}>
                                                {user.full_name?.charAt(0).toUpperCase() || '?'}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">{user.full_name || 'Unknown'}</span>
                                                    {user.is_blocked && (
                                                        <Badge variant="destructive" className="text-xs">Blocked</Badge>
                                                    )}
                                                </div>
                                                <div className="text-sm text-muted-foreground">
                                                    Joined {formatDate(user.created_at)}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 sm:ml-auto">
                                            {getRoleBadge(user.role)}
                                            {user.role !== 'admin' && (
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button
                                                            variant={user.is_blocked ? 'outline' : 'destructive'}
                                                            size="sm"
                                                            disabled={actionLoading === user.id}
                                                        >
                                                            {actionLoading === user.id ? (
                                                                <span className="flex items-center gap-2">
                                                                    <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                                                    ...
                                                                </span>
                                                            ) : user.is_blocked ? (
                                                                'Unblock'
                                                            ) : (
                                                                'Block'
                                                            )}
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>
                                                                {user.is_blocked ? 'Unblock User' : 'Block User'}
                                                            </AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                {user.is_blocked
                                                                    ? `This will allow ${user.full_name || 'this user'} to use the platform again.`
                                                                    : `This will prevent ${user.full_name || 'this user'} from creating bookings, listing vehicles, and sending messages.`
                                                                }
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction
                                                                onClick={() => toggleBlock(user.id, !user.is_blocked)}
                                                                className={user.is_blocked ? '' : 'bg-red-500 hover:bg-red-600'}
                                                            >
                                                                {user.is_blocked ? 'Unblock' : 'Block'}
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            )}
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
