'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { createBrowserClient } from '@supabase/ssr';

type OTPType = 'start' | 'end';

interface RideOTPGeneratorProps {
    bookingId: string;
    type: OTPType;
    disabled?: boolean;
    autoGenerate?: boolean; // Auto-generate OTP on mount
    onGenerated?: () => void;
    onVerified?: () => void;
}

export default function RideOTPGenerator({
    bookingId,
    type,
    disabled = false,
    autoGenerate = false,
    onGenerated,
    onVerified,
}: RideOTPGeneratorProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [otp, setOtp] = useState<string | null>(null);
    const [expiresAt, setExpiresAt] = useState<string | null>(null);
    const [timeLeft, setTimeLeft] = useState<number>(0);
    const [emailSent, setEmailSent] = useState<boolean>(false);
    const [emailMessage, setEmailMessage] = useState<string | null>(null);
    const [verified, setVerified] = useState<boolean>(false);
    const [verifiedAt, setVerifiedAt] = useState<string | null>(null);
    
    // Use refs to prevent double API calls (React Strict Mode protection)
    const isGeneratingRef = useRef(false);
    const hasGeneratedRef = useRef(false);

    const title = type === 'start' ? 'Start Ride OTP' : 'End Ride OTP';
    const description = type === 'start'
        ? 'Share this OTP with the renter to start the ride.'
        : 'Share this OTP with the renter to complete the ride.';

    // Auto-generate OTP on mount if autoGenerate is true
    // Using refs to prevent React Strict Mode double-calls
    useEffect(() => {
        if (autoGenerate && !hasGeneratedRef.current && !isGeneratingRef.current && !disabled) {
            hasGeneratedRef.current = true;
            handleGenerate();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoGenerate, disabled]);

    // Real-time subscription for OTP verification
    useEffect(() => {
        if (!otp) return; // Only subscribe when OTP is generated

        const supabase = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        const expectedStatus = type === 'start' ? 'started' : 'completed';

        const channel = supabase
            .channel(`otp-verification-${bookingId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'bookings',
                    filter: `id=eq.${bookingId}`,
                },
                (payload) => {
                    const updatedBooking = payload.new as { ride_status: string; ride_started_at?: string; ride_ended_at?: string };
                    
                    if (updatedBooking.ride_status === expectedStatus) {
                        setVerified(true);
                        setVerifiedAt(type === 'start' ? updatedBooking.ride_started_at || null : updatedBooking.ride_ended_at || null);
                        setOtp(null);
                        setExpiresAt(null);
                        onVerified?.();
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [otp, bookingId, type, onVerified]);

    // Countdown timer
    useEffect(() => {
        if (!expiresAt) return;

        const interval = setInterval(() => {
            const now = new Date().getTime();
            const expiry = new Date(expiresAt).getTime();
            const diff = Math.max(0, Math.floor((expiry - now) / 1000));
            setTimeLeft(diff);

            if (diff === 0) {
                setOtp(null);
                setExpiresAt(null);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [expiresAt]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleGenerate = async () => {
        // Prevent double API calls
        if (isGeneratingRef.current) return;
        
        isGeneratingRef.current = true;
        setLoading(true);
        setError(null);

        try {
            const endpoint = type === 'start' 
                ? '/api/ride/generate-start-otp'
                : '/api/ride/generate-end-otp';

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bookingId }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to generate OTP');
            }

            setOtp(data.otp);
            setExpiresAt(data.expiresAt);
            setEmailSent(data.emailSent || false);
            setEmailMessage(data.message || null);
            onGenerated?.();

        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to generate OTP');
            hasGeneratedRef.current = false;
        } finally {
            setLoading(false);
            isGeneratingRef.current = false;
        }
    };

    return (
        <Card className={`bg-card/50 border-border/50 ${disabled ? 'opacity-60' : ''}`}>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                        <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                        {title}
                    </CardTitle>
                    <Badge variant="secondary" className="bg-amber-500/10 text-amber-400 border-amber-500/20">
                        Owner Action
                    </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                    {description}
                </p>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* OTP Display */}
                <AnimatePresence mode="wait">
                    {verified ? (
                        /* Verified State - Minimal 21st.dev inspired design */
                        <motion.div
                            key="verified"
                            initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
                            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                            className="relative overflow-hidden rounded-2xl"
                        >
                            {/* Glassmorphism background */}
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-emerald-500/10" />
                            <div className="absolute inset-0 backdrop-blur-3xl" />
                            
                            <div className="relative p-8 text-center">
                                {/* Animated success ring */}
                                <div className="relative mx-auto w-16 h-16 mb-5">
                                    <motion.div
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ delay: 0.2, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                                        className="absolute inset-0 rounded-full bg-emerald-500/10"
                                    />
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: 0.3, type: 'spring', stiffness: 200, damping: 15 }}
                                        className="absolute inset-2 rounded-full bg-emerald-500/20 flex items-center justify-center"
                                    >
                                        <motion.svg 
                                            className="w-7 h-7 text-emerald-400" 
                                            fill="none" 
                                            viewBox="0 0 24 24" 
                                            strokeWidth={2.5} 
                                            stroke="currentColor"
                                            initial={{ pathLength: 0, opacity: 0 }}
                                            animate={{ pathLength: 1, opacity: 1 }}
                                            transition={{ delay: 0.5, duration: 0.4 }}
                                        >
                                            <motion.path 
                                                strokeLinecap="round" 
                                                strokeLinejoin="round" 
                                                d="M4.5 12.75l6 6 9-13.5"
                                                initial={{ pathLength: 0 }}
                                                animate={{ pathLength: 1 }}
                                                transition={{ delay: 0.5, duration: 0.4 }}
                                            />
                                        </motion.svg>
                                    </motion.div>
                                </div>
                                
                                {/* Text */}
                                <motion.h3 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                    className="text-lg font-semibold text-white/90 mb-1"
                                >
                                    {type === 'start' ? 'Ride Started' : 'Ride Completed'}
                                </motion.h3>
                                <motion.p 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 }}
                                    className="text-sm text-white/50"
                                >
                                    {type === 'start' 
                                        ? 'OTP verified • Vehicle handed over'
                                        : 'OTP verified • Payment processing'}
                                </motion.p>
                                
                                {verifiedAt && (
                                    <motion.div 
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.6 }}
                                        className="mt-4 pt-4 border-t border-white/[0.06]"
                                    >
                                        <p className="text-xs text-white/30 font-mono">
                                            {new Date(verifiedAt).toLocaleString('en-IN', {
                                                timeZone: 'Asia/Kolkata',
                                                dateStyle: 'medium',
                                                timeStyle: 'short'
                                            })}
                                        </p>
                                    </motion.div>
                                )}
                            </div>
                        </motion.div>
                    ) : otp ? (
                        <motion.div
                            key="otp"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-gradient-to-br from-primary/10 to-emerald-500/10 border border-primary/20 rounded-xl p-6 text-center"
                        >
                            <p className="text-xs text-muted-foreground mb-2">Your OTP</p>
                            <div className="flex justify-center gap-2 mb-3">
                                {otp.split(' ').map((group, i) => (
                                    <span 
                                        key={i} 
                                        className="text-4xl font-mono font-bold tracking-widest text-primary"
                                    >
                                        {group}
                                    </span>
                                ))}
                            </div>
                            <div className="flex items-center justify-center gap-2 text-sm">
                                <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className={`font-medium ${timeLeft < 60 ? 'text-red-400' : 'text-amber-400'}`}>
                                    Expires in {formatTime(timeLeft)}
                                </span>
                            </div>
                            
                            {/* Email Status */}
                            <div className={`mt-3 pt-3 border-t border-border/50 flex items-center justify-center gap-2 text-sm ${emailSent ? 'text-emerald-400' : 'text-amber-400'}`}>
                                {emailSent ? (
                                    <>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span>📧 OTP sent to renter&apos;s email</span>
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                        <span>Email not sent - share OTP verbally</span>
                                    </>
                                )}
                            </div>

                            {/* Waiting for verification indicator - Minimal design */}
                            <div className="mt-4 pt-4 border-t border-white/[0.06]">
                                <div className="flex items-center justify-center gap-3">
                                    <div className="flex gap-1">
                                        <motion.div 
                                            className="w-1.5 h-1.5 rounded-full bg-blue-400/60"
                                            animate={{ opacity: [0.3, 1, 0.3] }}
                                            transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
                                        />
                                        <motion.div 
                                            className="w-1.5 h-1.5 rounded-full bg-blue-400/60"
                                            animate={{ opacity: [0.3, 1, 0.3] }}
                                            transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                                        />
                                        <motion.div 
                                            className="w-1.5 h-1.5 rounded-full bg-blue-400/60"
                                            animate={{ opacity: [0.3, 1, 0.3] }}
                                            transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
                                        />
                                    </div>
                                    <span className="text-xs text-white/40">Waiting for verification</span>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-muted/30 border border-dashed border-muted-foreground/30 rounded-xl p-6 text-center"
                        >
                            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                                <svg className="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                No OTP generated yet
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Error message */}
                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="bg-red-500/10 text-red-400 text-sm px-3 py-2 rounded-lg text-center"
                        >
                            {error}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Generate/Regenerate button - hidden when verified */}
                {!verified && (
                    <Button
                        onClick={handleGenerate}
                        disabled={disabled || loading}
                        variant={otp ? 'outline' : 'default'}
                        className="w-full"
                    >
                        {loading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                                Generating...
                            </>
                        ) : otp ? (
                            <>
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Generate New OTP
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                </svg>
                                Generate OTP
                            </>
                        )}
                    </Button>
                )}

                {/* Instructions - hidden when verified */}
                {!verified && (
                    <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3 space-y-1">
                        <p className="text-xs font-medium text-amber-400 flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            Important
                        </p>
                        <ul className="text-xs text-muted-foreground space-y-0.5">
                            <li>• Share OTP verbally, do not send via text</li>
                            <li>• OTP expires in 10 minutes</li>
                            <li>• A new OTP invalidates the previous one</li>
                        </ul>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
