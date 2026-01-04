'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { PaymentMethod, BookingWithDetails } from '@/types/booking';

interface PaymentConfirmationCardProps {
    booking: BookingWithDetails;
    onPaymentConfirmed?: () => void;
}

const methodDetails: Record<PaymentMethod, { label: string; icon: React.ReactNode; color: string }> = {
    upi: {
        label: 'UPI',
        icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.5 2.1l7.2 4.2c.5.3.8.8.8 1.4v8.6c0 .6-.3 1.1-.8 1.4l-7.2 4.2c-.5.3-1.1.3-1.6 0l-7.2-4.2c-.5-.3-.8-.8-.8-1.4V7.7c0-.6.3-1.1.8-1.4l7.2-4.2c.5-.3 1.1-.3 1.6 0z"/>
            </svg>
        ),
        color: 'from-purple-500 to-violet-600',
    },
    cash: {
        label: 'Cash',
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
            </svg>
        ),
        color: 'from-emerald-500 to-green-600',
    },
    card: {
        label: 'Card',
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
            </svg>
        ),
        color: 'from-blue-500 to-indigo-600',
    },
    online: {
        label: 'Online',
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
            </svg>
        ),
        color: 'from-cyan-500 to-blue-600',
    },
};

export default function PaymentConfirmationCard({
    booking,
    onPaymentConfirmed,
}: PaymentConfirmationCardProps) {
    const [loading, setLoading] = useState(false);
    const [confirmed, setConfirmed] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const paymentMethod = booking.payment_method || 'cash';
    const amount = booking.total_amount || 0;
    const renterName = booking.renter?.full_name || 'Renter';
    const bookingId = booking.id;

    const method = methodDetails[paymentMethod] || methodDetails.cash;

    const handleConfirm = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/payments/manual/confirm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bookingId }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to confirm payment');
            }

            setConfirmed(true);
            setTimeout(() => {
                onPaymentConfirmed?.();
            }, 1500);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence mode="wait">
            {confirmed ? (
                <motion.div
                    key="confirmed"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-center"
                >
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.1, type: 'spring' }}
                        className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-2"
                    >
                        <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                    </motion.div>
                    <p className="text-sm font-medium text-emerald-400">Payment Confirmed!</p>
                </motion.div>
            ) : (
                <motion.div
                    key="pending"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 space-y-4"
                >
                    {/* Header */}
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${method.color} flex items-center justify-center text-white`}>
                                {method.icon}
                            </div>
                            <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full animate-pulse" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-amber-400">
                                💰 Payment Pending Confirmation
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {renterName} wants to pay via {method.label}
                            </p>
                        </div>
                    </div>

                    {/* Amount */}
                    <div className="flex items-center justify-between bg-black/20 rounded-lg p-3">
                        <span className="text-sm text-muted-foreground">Amount</span>
                        <span className="text-lg font-bold">₹{amount.toLocaleString('en-IN')}</span>
                    </div>

                    {/* Instructions */}
                    <div className="text-xs text-muted-foreground">
                        {paymentMethod === 'upi' && (
                            <p>📱 Check your UPI app for payment from {renterName}.</p>
                        )}
                        {paymentMethod === 'cash' && (
                            <p>💵 Collect ₹{amount} cash from {renterName} during vehicle handover.</p>
                        )}
                        {paymentMethod === 'card' && (
                            <p>💳 Verify card payment or bank transfer from {renterName}.</p>
                        )}
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2 text-xs text-red-400">
                            {error}
                        </div>
                    )}

                    {/* Confirm Button */}
                    <Button
                        onClick={handleConfirm}
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700"
                    >
                        {loading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                                Confirming...
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Confirm Payment Received
                            </>
                        )}
                    </Button>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
