'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
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

interface CancelBookingButtonProps {
    bookingId: string;
    userRole: 'renter' | 'owner';
    bookingStatus: string;
    startDate: string;
    totalAmount: number;
    isPaid: boolean;
    onSuccess?: () => void;
}

// Calculate refund preview
function getRefundPreview(
    userRole: 'renter' | 'owner',
    startDate: string,
    totalAmount: number,
    isPaid: boolean
): { percentage: number; amount: number; message: string } {
    if (!isPaid) {
        return {
            percentage: 0,
            amount: 0,
            message: 'No refund needed (booking not paid)',
        };
    }

    if (userRole === 'owner') {
        return {
            percentage: 100,
            amount: totalAmount,
            message: 'Renter will receive full refund',
        };
    }

    const now = new Date();
    const start = new Date(startDate);
    const hoursUntilStart = (start.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilStart < 0) {
        return {
            percentage: 0,
            amount: 0,
            message: 'No refund (rental has started)',
        };
    } else if (hoursUntilStart < 24) {
        return {
            percentage: 50,
            amount: Math.round(totalAmount * 0.5),
            message: '50% refund (within 24 hours of start)',
        };
    } else {
        return {
            percentage: 100,
            amount: totalAmount,
            message: 'Full refund (more than 24 hours before start)',
        };
    }
}

export default function CancelBookingButton({
    bookingId,
    userRole,
    bookingStatus,
    startDate,
    totalAmount,
    isPaid,
    onSuccess,
}: CancelBookingButtonProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);

    // Check if cancellation is allowed
    const canCancel = ['requested', 'approved', 'confirmed'].includes(bookingStatus);

    // For renters, don't show cancel after rental starts
    if (userRole === 'renter') {
        const now = new Date();
        const start = new Date(startDate);
        if (now > start) {
            return null; // Already started, can't cancel
        }
    }

    if (!canCancel) {
        return null;
    }

    const refundPreview = getRefundPreview(userRole, startDate, totalAmount, isPaid);

    const handleCancel = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/bookings/cancel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bookingId,
                    cancelledBy: userRole,
                    reason: `Cancelled by ${userRole}`,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to cancel booking');
            }

            setOpen(false);
            if (onSuccess) {
                onSuccess();
            } else {
                router.refresh();
            }
        } catch (error: any) {
            console.error('Cancel error:', error);
            alert(error.message || 'Failed to cancel booking');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                    Cancel Booking
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Cancel this booking?</AlertDialogTitle>
                    <AlertDialogDescription className="space-y-3">
                        <p>
                            {userRole === 'owner'
                                ? 'Cancelling will fully refund the renter and you will receive no payout.'
                                : 'Are you sure you want to cancel this booking?'}
                        </p>
                        {isPaid && (
                            <div className="bg-muted/50 p-3 rounded-lg">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Refund:</span>
                                    <span className="font-medium text-primary">
                                        ₹{refundPreview.amount} ({refundPreview.percentage}%)
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {refundPreview.message}
                                </p>
                            </div>
                        )}
                        <p className="text-xs text-muted-foreground">
                            This action cannot be undone.
                        </p>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={loading}>Keep Booking</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleCancel}
                        disabled={loading}
                        className="bg-red-500 hover:bg-red-600"
                    >
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                Cancelling...
                            </span>
                        ) : (
                            'Cancel Booking'
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
