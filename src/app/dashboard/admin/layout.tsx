'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import PageWrapper from '@/components/layout/PageWrapper';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { profile, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && profile?.role !== 'admin') {
            router.replace('/dashboard');
        }
    }, [loading, profile, router]);

    // Show loading while checking auth
    if (loading) {
        return (
            <PageWrapper className="container mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-12">
                <div className="space-y-6">
                    <Skeleton className="h-10 w-64" />
                    <Skeleton className="h-6 w-96" />
                    <div className="grid grid-cols-4 gap-4">
                        <Skeleton className="h-32" />
                        <Skeleton className="h-32" />
                        <Skeleton className="h-32" />
                        <Skeleton className="h-32" />
                    </div>
                </div>
            </PageWrapper>
        );
    }

    // Redirect non-admins (handled by useEffect, but prevent flash)
    if (profile?.role !== 'admin') {
        return (
            <PageWrapper className="container mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-12">
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                        <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-red-400 mb-2">Access Denied</h2>
                        <p className="text-muted-foreground">You don&apos;t have permission to access this area.</p>
                    </div>
                </div>
            </PageWrapper>
        );
    }

    return <>{children}</>;
}
