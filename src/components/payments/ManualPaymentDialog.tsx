'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PaymentMethod } from '@/types/booking';

interface ManualPaymentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    bookingId: string;
    amount: number;
    ownerName: string;
    ownerPhone?: string;
    onPaymentSubmitted: () => void;
}

const paymentMethods: { id: PaymentMethod; label: string; icon: React.ReactNode; description: string; color: string }[] = [
    {
        id: 'upi',
        label: 'UPI',
        icon: (
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.5 2.1l7.2 4.2c.5.3.8.8.8 1.4v8.6c0 .6-.3 1.1-.8 1.4l-7.2 4.2c-.5.3-1.1.3-1.6 0l-7.2-4.2c-.5-.3-.8-.8-.8-1.4V7.7c0-.6.3-1.1.8-1.4l7.2-4.2c.5-.3 1.1-.3 1.6 0z"/>
                <text x="8" y="15" fontSize="8" fill="white" fontWeight="bold">UPI</text>
            </svg>
        ),
        description: 'Pay via Google Pay, PhonePe, Paytm',
        color: 'from-purple-500 to-violet-600',
    },
    {
        id: 'cash',
        label: 'Cash',
        icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
            </svg>
        ),
        description: 'Pay in cash when meeting the owner',
        color: 'from-emerald-500 to-green-600',
    },
    {
        id: 'card',
        label: 'Card',
        icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
            </svg>
        ),
        description: 'Pay via card machine or bank transfer',
        color: 'from-blue-500 to-indigo-600',
    },
];

export default function ManualPaymentDialog({
    open,
    onOpenChange,
    bookingId,
    amount,
    ownerName,
    ownerPhone,
    onPaymentSubmitted,
}: ManualPaymentDialogProps) {
    const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<'select' | 'confirm' | 'success'>('select');
    const [error, setError] = useState<string | null>(null);

    const handleSubmitPayment = async () => {
        if (!selectedMethod) return;
        
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/payments/manual/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bookingId,
                    paymentMethod: selectedMethod,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to submit payment');
            }

            setStep('success');
            setTimeout(() => {
                onPaymentSubmitted();
                onOpenChange(false);
            }, 2000);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    const resetDialog = () => {
        setSelectedMethod(null);
        setStep('select');
        setError(null);
    };

    return (
        <Dialog open={open} onOpenChange={(isOpen) => {
            if (!isOpen) resetDialog();
            onOpenChange(isOpen);
        }}>
            <DialogContent className="sm:max-w-md overflow-hidden">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                            </svg>
                        </div>
                        {step === 'select' && 'Select Payment Method'}
                        {step === 'confirm' && 'Confirm Payment'}
                        {step === 'success' && 'Payment Submitted'}
                    </DialogTitle>
                </DialogHeader>

                <AnimatePresence mode="wait">
                    {/* Step 1: Select Payment Method */}
                    {step === 'select' && (
                        <motion.div
                            key="select"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="space-y-4"
                        >
                            {/* Amount Display */}
                            <div className="text-center py-4">
                                <p className="text-sm text-muted-foreground mb-1">Amount to Pay</p>
                                <p className="text-4xl font-bold tracking-tight">
                                    <span className="text-muted-foreground text-2xl">₹</span>
                                    {amount.toLocaleString('en-IN')}
                                </p>
                            </div>

                            {/* Payment Methods */}
                            <div className="space-y-2">
                                {paymentMethods.map((method) => (
                                    <motion.button
                                        key={method.id}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => setSelectedMethod(method.id)}
                                        className={`
                                            w-full p-4 rounded-xl border-2 transition-all duration-200
                                            flex items-center gap-4 text-left
                                            ${selectedMethod === method.id 
                                                ? 'border-primary bg-primary/5' 
                                                : 'border-border/50 hover:border-border hover:bg-muted/30'
                                            }
                                        `}
                                    >
                                        <div className={`
                                            w-12 h-12 rounded-xl bg-gradient-to-br ${method.color}
                                            flex items-center justify-center text-white
                                        `}>
                                            {method.icon}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium">{method.label}</p>
                                            <p className="text-sm text-muted-foreground">{method.description}</p>
                                        </div>
                                        <div className={`
                                            w-5 h-5 rounded-full border-2 flex items-center justify-center
                                            ${selectedMethod === method.id 
                                                ? 'border-primary bg-primary' 
                                                : 'border-muted-foreground/30'
                                            }
                                        `}>
                                            {selectedMethod === method.id && (
                                                <motion.svg
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    className="w-3 h-3 text-white"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    strokeWidth={3}
                                                    stroke="currentColor"
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                                </motion.svg>
                                            )}
                                        </div>
                                    </motion.button>
                                ))}
                            </div>

                            <Button
                                onClick={() => setStep('confirm')}
                                disabled={!selectedMethod}
                                className="w-full"
                            >
                                Continue
                            </Button>
                        </motion.div>
                    )}

                    {/* Step 2: Confirm Payment */}
                    {step === 'confirm' && (
                        <motion.div
                            key="confirm"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-4"
                        >
                            {/* Payment Summary */}
                            <div className="bg-muted/30 rounded-xl p-4 space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">Amount</span>
                                    <span className="font-semibold">₹{amount.toLocaleString('en-IN')}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">Method</span>
                                    <span className="font-medium capitalize">{selectedMethod}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">Pay to</span>
                                    <span className="font-medium">{ownerName}</span>
                                </div>
                                {ownerPhone && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground">Contact</span>
                                        <span className="font-medium">{ownerPhone}</span>
                                    </div>
                                )}
                            </div>

                            {/* Instructions based on payment method */}
                            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                                <p className="text-sm text-amber-400 font-medium mb-2">📋 Instructions</p>
                                {selectedMethod === 'upi' && (
                                    <p className="text-sm text-muted-foreground">
                                        Pay ₹{amount} to the owner via UPI. Contact the owner to get their UPI ID or scan their QR code.
                                    </p>
                                )}
                                {selectedMethod === 'cash' && (
                                    <p className="text-sm text-muted-foreground">
                                        Pay ₹{amount} in cash when you meet the owner for vehicle pickup. Ensure you get a receipt.
                                    </p>
                                )}
                                {selectedMethod === 'card' && (
                                    <p className="text-sm text-muted-foreground">
                                        Pay ₹{amount} via card machine or bank transfer. Contact the owner for payment details.
                                    </p>
                                )}
                            </div>

                            {/* Info message */}
                            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                                <p className="text-sm text-blue-400">
                                    ℹ️ After submitting, the owner will confirm when they receive your payment. Your booking will be confirmed once payment is verified.
                                </p>
                            </div>

                            {error && (
                                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-sm text-red-400">
                                    {error}
                                </div>
                            )}

                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => setStep('select')}
                                    className="flex-1"
                                >
                                    Back
                                </Button>
                                <Button
                                    onClick={handleSubmitPayment}
                                    disabled={loading}
                                    className="flex-1 bg-gradient-to-r from-primary to-emerald-500"
                                >
                                    {loading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                                            Submitting...
                                        </>
                                    ) : (
                                        'Submit Payment'
                                    )}
                                </Button>
                            </div>
                        </motion.div>
                    )}

                    {/* Step 3: Success */}
                    {step === 'success' && (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="py-8 text-center"
                        >
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                                className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4"
                            >
                                <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </motion.div>
                            <h3 className="text-lg font-semibold mb-2">Payment Submitted!</h3>
                            <p className="text-sm text-muted-foreground">
                                Waiting for owner to confirm payment. You&apos;ll be notified once verified.
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </DialogContent>
        </Dialog>
    );
}
