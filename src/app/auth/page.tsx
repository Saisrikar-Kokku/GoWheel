'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import PageWrapper from '@/components/layout/PageWrapper';

function AuthForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectTo = searchParams.get('redirectTo') || '/dashboard';
    const { signIn, signUp } = useAuth();

    const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [resetEmailSent, setResetEmailSent] = useState(false);

    // Form states
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [selectedRole, setSelectedRole] = useState<UserRole>('renter');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { error } = await signIn(email, password);

        if (error) {
            setError(error.message);
            setLoading(false);
            return;
        }

        router.push(redirectTo);
        router.refresh();
    };

    const handleSignup = async (e: React.FormEvent) => {
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

        const { error } = await signUp(email, password, fullName, selectedRole);

        if (error) {
            setError(error.message);
            setLoading(false);
            return;
        }

        // Redirect to dashboard after successful signup
        router.push(redirectTo);
        router.refresh();
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (!email) {
            setError('Please enter your email address');
            setLoading(false);
            return;
        }

        const supabase = (await import('@/lib/supabase/client')).createClient();

        // Store flag in cookie to detect recovery flow (cookie works with server-side callback)
        document.cookie = 'password_reset_pending=true; path=/; max-age=3600; SameSite=Lax';

        // Redirect to callback route for server-side PKCE code exchange
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
        });

        if (error) {
            document.cookie = 'password_reset_pending=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
            setError(error.message);
            setLoading(false);
            return;
        }

        setResetEmailSent(true);
        setLoading(false);
    };

    return (
        <Card className="bg-card/80 backdrop-blur-xl border-border/50 shadow-2xl shadow-black/20">
            <CardHeader className="text-center pb-2">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20">
                    <svg
                        className="h-7 w-7 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                        />
                    </svg>
                </div>
                <CardTitle className="text-2xl font-bold">Welcome to GoWheel</CardTitle>
                <CardDescription className="text-muted-foreground">
                    {activeTab === 'login' ? 'Sign in to your account' : 'Create a new account'}
                </CardDescription>
            </CardHeader>

            <CardContent className="pt-4">
                {/* Forgot Password Modal */}
                {showForgotPassword && (
                    <div className="mb-6">
                        <div className="flex items-center gap-2 mb-4">
                            <button
                                onClick={() => {
                                    setShowForgotPassword(false);
                                    setResetEmailSent(false);
                                    setError(null);
                                }}
                                className="text-muted-foreground hover:text-foreground"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <h3 className="font-semibold">Reset Password</h3>
                        </div>

                        {resetEmailSent ? (
                            <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center">
                                <svg className="w-12 h-12 mx-auto mb-3 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                <p className="text-emerald-400 font-medium mb-1">Check your email!</p>
                                <p className="text-sm text-muted-foreground">
                                    We've sent a password reset link to <strong>{email}</strong>
                                </p>
                                <Button
                                    variant="outline"
                                    className="mt-4"
                                    onClick={() => {
                                        setShowForgotPassword(false);
                                        setResetEmailSent(false);
                                    }}
                                >
                                    Back to Sign In
                                </Button>
                            </div>
                        ) : (
                            <form onSubmit={handleForgotPassword} className="space-y-4">
                                <p className="text-sm text-muted-foreground">
                                    Enter your email address and we'll send you a link to reset your password.
                                </p>
                                {error && (
                                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                                        <p className="text-sm text-red-500">{error}</p>
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <Label htmlFor="reset-email">Email</Label>
                                    <Input
                                        id="reset-email"
                                        type="email"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        disabled={loading}
                                    />
                                </div>
                                <Button
                                    type="submit"
                                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
                                    disabled={loading}
                                >
                                    {loading ? 'Sending...' : 'Send Reset Link'}
                                </Button>
                            </form>
                        )}
                    </div>
                )}

                {!showForgotPassword && (
                    <>
                        <Tabs
                            value={activeTab}
                            onValueChange={(v) => {
                                setActiveTab(v as 'login' | 'signup');
                                setError(null);
                                setSuccess(null);
                            }}
                        >
                            <TabsList className="grid w-full grid-cols-2 mb-6">
                                <TabsTrigger value="login">Sign In</TabsTrigger>
                                <TabsTrigger value="signup">Sign Up</TabsTrigger>
                            </TabsList>

                            {error && (
                                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                                    <p className="text-sm text-red-500">{error}</p>
                                </div>
                            )}
                            {success && (
                                <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                    <p className="text-sm text-emerald-500">{success}</p>
                                </div>
                            )}

                            <TabsContent value="login">
                                <form onSubmit={handleLogin} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="login-email">Email</Label>
                                        <Input
                                            id="login-email"
                                            type="email"
                                            placeholder="you@example.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            disabled={loading}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="login-password">Password</Label>
                                        <Input
                                            id="login-password"
                                            type="password"
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            disabled={loading}
                                        />
                                    </div>
                                    <Button
                                        type="submit"
                                        className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
                                        size="lg"
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <span className="flex items-center gap-2">
                                                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                </svg>
                                                Signing in...
                                            </span>
                                        ) : (
                                            'Sign In'
                                        )}
                                    </Button>
                                    <button
                                        type="button"
                                        onClick={() => setShowForgotPassword(true)}
                                        className="w-full text-sm text-muted-foreground hover:text-primary transition-colors mt-2"
                                    >
                                        Forgot your password?
                                    </button>
                                </form>
                            </TabsContent>

                            <TabsContent value="signup">
                                <form onSubmit={handleSignup} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="signup-name">Full Name</Label>
                                        <Input
                                            id="signup-name"
                                            type="text"
                                            placeholder="John Doe"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            required
                                            disabled={loading}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="signup-email">Email</Label>
                                        <Input
                                            id="signup-email"
                                            type="email"
                                            placeholder="you@example.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            disabled={loading}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="signup-password">Password</Label>
                                        <Input
                                            id="signup-password"
                                            type="password"
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            disabled={loading}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="signup-confirm">Confirm Password</Label>
                                        <Input
                                            id="signup-confirm"
                                            type="password"
                                            placeholder="••••••••"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                            disabled={loading}
                                        />
                                    </div>

                                    {/* Role Selection */}
                                    <div className="space-y-3">
                                        <Label>I want to</Label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setSelectedRole('renter')}
                                                className={`p-4 rounded-xl border-2 transition-all text-left ${selectedRole === 'renter'
                                                    ? 'border-emerald-500 bg-emerald-500/10'
                                                    : 'border-border hover:border-muted-foreground/50'
                                                    }`}
                                                disabled={loading}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${selectedRole === 'renter'
                                                            ? 'bg-emerald-500/20 text-emerald-400'
                                                            : 'bg-muted text-muted-foreground'
                                                            }`}
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-sm">Rent</div>
                                                        <div className="text-xs text-muted-foreground">Find vehicles</div>
                                                    </div>
                                                </div>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => setSelectedRole('owner')}
                                                className={`p-4 rounded-xl border-2 transition-all text-left ${selectedRole === 'owner'
                                                    ? 'border-emerald-500 bg-emerald-500/10'
                                                    : 'border-border hover:border-muted-foreground/50'
                                                    }`}
                                                disabled={loading}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${selectedRole === 'owner'
                                                            ? 'bg-emerald-500/20 text-emerald-400'
                                                            : 'bg-muted text-muted-foreground'
                                                            }`}
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-sm">List</div>
                                                        <div className="text-xs text-muted-foreground">Share vehicles</div>
                                                    </div>
                                                </div>
                                            </button>
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
                                        size="lg"
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <span className="flex items-center gap-2">
                                                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                </svg>
                                                Creating account...
                                            </span>
                                        ) : (
                                            'Create Account'
                                        )}
                                    </Button>
                                </form>
                            </TabsContent>
                        </Tabs>

                        <p className="mt-6 text-center text-xs text-muted-foreground">
                            By continuing, you agree to our{' '}
                            <a href="/terms-and-conditions" className="text-primary hover:underline">Terms of Service</a>{' '}
                            and{' '}
                            <a href="/privacy-policy" className="text-primary hover:underline">Privacy Policy</a>
                        </p>
                    </>
                )}
            </CardContent>
        </Card>
    );
}

function AuthFormSkeleton() {
    return (
        <Card className="bg-card/80 backdrop-blur-xl border-border/50 shadow-2xl shadow-black/20">
            <CardHeader className="text-center pb-2">
                <Skeleton className="mx-auto mb-4 h-14 w-14 rounded-2xl" />
                <Skeleton className="mx-auto h-7 w-48 mb-2" />
                <Skeleton className="mx-auto h-4 w-36" />
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </CardContent>
        </Card>
    );
}

export default function AuthPage() {
    return (
        <PageWrapper className="flex items-center justify-center py-12 px-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="w-full max-w-md"
            >
                <Suspense fallback={<AuthFormSkeleton />}>
                    <AuthForm />
                </Suspense>
            </motion.div>
        </PageWrapper>
    );
}
