'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import PageWrapper from '@/components/layout/PageWrapper';
import { createClient } from '@/lib/supabase/client';

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const validParam = searchParams.get('valid');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [validSession, setValidSession] = useState(false);
    const [checkingSession, setCheckingSession] = useState(true);

    const supabase = createClient();

    useEffect(() => {
        const checkSession = async () => {
            // If we came from the callback route with valid=true, check for session
            if (validParam === 'true') {
                const { data: { session } } = await supabase.auth.getSession();
                if (session) {
                    setValidSession(true);
                }
            }

            // Also listen for PASSWORD_RECOVERY event
            supabase.auth.onAuthStateChange((event, session) => {
                if (event === 'PASSWORD_RECOVERY' && session) {
                    setValidSession(true);
                }
            });

            setCheckingSession(false);
        };

        checkSession();
    }, [validParam]);

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            setLoading(false);
            return;
        }

        try {
            // Get current session
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                setError('Session expired. Please request a new reset link.');
                setLoading(false);
                return;
            }

            // Use fetch directly since SDK has issues
            const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/user`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`,
                    'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                },
                body: JSON.stringify({ password }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                setError(errorData.message || 'Failed to update password');
                setLoading(false);
                return;
            }

            setSuccess(true);
            setLoading(false);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
            setError(errorMessage + '. Please try again.');
            setLoading(false);
        }
    };

    if (checkingSession) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="text-center">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                    <p className="text-muted-foreground">Verifying your link...</p>
                </div>
            </div>
        );
    }

    if (!validSession) {
        return (
            <Card className="bg-card/80 backdrop-blur-xl border-border/50">
                <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
                        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold mb-2">Invalid or Expired Link</h2>
                    <p className="text-muted-foreground mb-4">
                        This password reset link is invalid or has expired. Please request a new one.
                    </p>
                    <Button onClick={() => router.push('/auth')} variant="outline">
                        Back to Sign In
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="bg-card/80 backdrop-blur-xl border-border/50 shadow-2xl shadow-black/20">
            <CardHeader className="text-center pb-2">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20">
                    <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                </div>
                <CardTitle className="text-2xl font-bold">Set New Password</CardTitle>
                <CardDescription className="text-muted-foreground">
                    Enter your new password below
                </CardDescription>
            </CardHeader>

            <CardContent className="pt-4">
                {success ? (
                    <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center">
                        <svg className="w-12 h-12 mx-auto mb-3 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <p className="text-emerald-400 font-medium text-lg mb-1">Password Changed Successfully!</p>
                        <p className="text-sm text-muted-foreground mb-4">Your password has been updated.</p>
                        <Button
                            onClick={() => router.push('/dashboard')}
                            className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
                        >
                            OK
                        </Button>
                    </div>
                ) : (
                    <form onSubmit={handleResetPassword} className="space-y-4">
                        {error && (
                            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                                <p className="text-sm text-red-500">{error}</p>
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="new-password">New Password</Label>
                            <Input
                                id="new-password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={loading}
                                minLength={6}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirm-password">Confirm New Password</Label>
                            <Input
                                id="confirm-password"
                                type="password"
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                disabled={loading}
                                minLength={6}
                            />
                        </div>
                        <Button
                            type="submit"
                            className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
                            size="lg"
                            disabled={loading}
                        >
                            {loading ? 'Updating...' : 'Update Password'}
                        </Button>
                    </form>
                )}
            </CardContent>
        </Card>
    );
}

export default function ResetPasswordPage() {
    return (
        <PageWrapper className="flex items-center justify-center min-h-screen">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md px-4"
            >
                <Suspense fallback={
                    <div className="flex items-center justify-center min-h-[50vh]">
                        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
                    </div>
                }>
                    <ResetPasswordForm />
                </Suspense>
            </motion.div>
        </PageWrapper>
    );
}
