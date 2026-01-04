'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

type OTPType = 'start' | 'end';

interface RideOTPVerificationProps {
    bookingId: string;
    type: OTPType;
    disabled?: boolean;
    onVerified?: (success: boolean) => void;
}

export default function RideOTPVerification({
    bookingId,
    type,
    disabled = false,
    onVerified,
}: RideOTPVerificationProps) {
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    const title = type === 'start' ? 'Start Ride OTP' : 'End Ride OTP';
    const description = type === 'start'
        ? 'Enter the 6-digit OTP provided by the vehicle owner to start your ride'
        : 'Enter the 6-digit OTP provided by the vehicle owner to complete your ride';

    const handleChange = (index: number, value: string) => {
        // Only allow digits
        if (value && !/^\d$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
        setError(null);

        // Auto-focus next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        // Handle backspace
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (pastedData) {
            const newOtp = [...otp];
            for (let i = 0; i < pastedData.length; i++) {
                newOtp[i] = pastedData[i];
            }
            setOtp(newOtp);
            // Focus last filled input or first empty
            const lastIndex = Math.min(pastedData.length - 1, 5);
            inputRefs.current[lastIndex]?.focus();
        }
    };

    const handleVerify = useCallback(async () => {
        const otpString = otp.join('');
        
        if (otpString.length !== 6) {
            setError('Please enter all 6 digits');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const endpoint = type === 'start' 
                ? '/api/ride/verify-start-otp'
                : '/api/ride/verify-end-otp';

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bookingId, otp: otpString }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Verification failed');
            }

            setSuccess(true);
            onVerified?.(true);

        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Verification failed. Please try again.');
            // Clear OTP on error
            setOtp(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
        } finally {
            setLoading(false);
        }
    }, [otp, bookingId, type, onVerified]);

    // Auto-verify when all digits entered
    useEffect(() => {
        const otpString = otp.join('');
        if (otpString.length === 6 && !loading && !success) {
            handleVerify();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [otp]);

    if (success) {
        return (
            <Card className="bg-emerald-500/5 border-emerald-500/20">
                <CardContent className="py-8 text-center">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    >
                        <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-emerald-400 mb-1">
                            {type === 'start' ? 'Ride Started!' : 'Ride Completed!'}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            {type === 'start' 
                                ? 'Have a safe journey! 🚗' 
                                : 'Thank you for using GoWheel! 🎉'
                            }
                        </p>
                    </motion.div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={`bg-card/50 border-border/50 ${disabled ? 'opacity-60' : ''}`}>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                        <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        {title}
                    </CardTitle>
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                        {type === 'start' ? '🔑 Step 2' : '🏁 Final Step'}
                    </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                    {description}
                </p>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* OTP Input */}
                <div className="flex justify-center gap-2">
                    {otp.map((digit, index) => (
                        <Input
                            key={index}
                            ref={(el) => { inputRefs.current[index] = el; }}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleChange(index, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(index, e)}
                            onPaste={index === 0 ? handlePaste : undefined}
                            disabled={disabled || loading}
                            className={`w-12 h-14 text-center text-2xl font-bold ${
                                error ? 'border-red-500 focus-visible:ring-red-500' : ''
                            }`}
                        />
                    ))}
                </div>

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

                {/* Verify button */}
                <Button
                    onClick={handleVerify}
                    disabled={disabled || loading || otp.join('').length !== 6}
                    className="w-full"
                >
                    {loading ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                            Verifying...
                        </>
                    ) : (
                        <>
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Verify OTP
                        </>
                    )}
                </Button>

                {/* Help text */}
                <p className="text-xs text-muted-foreground text-center">
                    Ask the vehicle owner for the OTP. It expires in 10 minutes.
                </p>
            </CardContent>
        </Card>
    );
}
