'use client';

import { useState } from 'react';
import { format, addDays, addHours, differenceInHours, setHours, setMinutes, setSeconds, setMilliseconds } from 'date-fns';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { createBookingRequest } from '@/services/bookingService';
import { useRouter } from 'next/navigation';

interface BookingRequestDialogProps {
    vehicleId: string;
    ownerId: string;
    vehicleTitle: string;
    pricePerDay: number; // We'll treat this as price per hour
    children: React.ReactNode;
}

// Generate time slots (6 AM to 10 PM in 12-hour format)
const timeSlots = Array.from({ length: 17 }, (_, i) => {
    const hour24 = i + 6; // Start from 6 AM (6) to 10 PM (22)
    const hour12 = hour24 > 12 ? hour24 - 12 : hour24 === 0 ? 12 : hour24;
    const ampm = hour24 >= 12 ? 'PM' : 'AM';
    return {
        value: hour24.toString().padStart(2, '0'),
        label: `${hour12}:00 ${ampm}`
    };
});

export default function BookingRequestDialog({
    vehicleId,
    ownerId,
    vehicleTitle,
    pricePerDay,
    children,
}: BookingRequestDialogProps) {
    const { user, profile } = useAuth();
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [startDate, setStartDate] = useState<Date | undefined>(addDays(new Date(), 1));
    const [endDate, setEndDate] = useState<Date | undefined>(addDays(new Date(), 1));
    const [startHour, setStartHour] = useState('09');
    const [endHour, setEndHour] = useState('18');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Calculate total hours and price
    const calculateTotal = () => {
        if (!startDate || !endDate) return { hours: 0, amount: 0 };

        const start = setMinutes(setHours(new Date(startDate), parseInt(startHour)), 0);
        const end = setMinutes(setHours(new Date(endDate), parseInt(endHour)), 0);

        const hours = Math.max(1, differenceInHours(end, start));
        const amount = hours * pricePerDay; // pricePerDay is actually price per hour

        return { hours, amount };
    };

    const { hours: rentalHours, amount: totalAmount } = calculateTotal();

    const handleSubmit = async () => {
        if (!startDate || !endDate || !user) return;

        setLoading(true);
        setError(null);

        try {
            const startDateTime = setSeconds(setMilliseconds(setMinutes(setHours(new Date(startDate), parseInt(startHour)), 0), 0), 0);
            const endDateTime = setSeconds(setMilliseconds(setMinutes(setHours(new Date(endDate), parseInt(endHour)), 0), 0), 0);

            await createBookingRequest({
                vehicle_id: vehicleId,
                owner_id: ownerId,
                start_date: startDateTime.toISOString(),
                end_date: endDateTime.toISOString(),
                total_amount: totalAmount,
            });

            setSuccess(true);
            setTimeout(() => {
                setOpen(false);
                router.push('/dashboard/renter/bookings');
            }, 2000);
        } catch (err: any) {
            setError(err.message || 'Failed to submit booking request');
        } finally {
            setLoading(false);
        }
    };

    const handleStartDateSelect = (date: Date | undefined) => {
        setStartDate(date);
        if (date && endDate && date > endDate) {
            setEndDate(date);
        }
    };

    // Check if user is blocked
    if (profile?.is_blocked) {
        return (
            <Dialog>
                <DialogTrigger asChild>{children}</DialogTrigger>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-red-400">Account Restricted</DialogTitle>
                        <DialogDescription>
                            Your account has been restricted. You cannot make bookings at this time.
                            Please contact support if you believe this is an error.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => router.push('/dashboard')}>
                            Go to Dashboard
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    }

    if (!user) {
        return (
            <Dialog>
                <DialogTrigger asChild>{children}</DialogTrigger>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Sign in required</DialogTitle>
                        <DialogDescription>
                            Please sign in to request a booking for this vehicle.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button onClick={() => router.push('/auth')} className="w-full">
                            Sign In
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    }

    if (profile?.role === 'owner') {
        return (
            <Dialog>
                <DialogTrigger asChild>{children}</DialogTrigger>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Cannot book as owner</DialogTitle>
                        <DialogDescription>
                            You are signed in as an owner. Switch to a renter account to book vehicles.
                        </DialogDescription>
                    </DialogHeader>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                {success ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="py-8 text-center"
                    >
                        <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                            <svg className="w-10 h-10 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold mb-2">Booking Request Sent!</h3>
                        <p className="text-muted-foreground">
                            The owner will review your request. You&apos;ll be notified once they respond.
                        </p>
                    </motion.div>
                ) : (
                    <>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                Request to Book
                            </DialogTitle>
                            <DialogDescription>
                                Select rental date & time for <span className="font-medium text-foreground">{vehicleTitle}</span>
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                            {/* Start Date & Time */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Pickup Date & Time</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className="w-full justify-start text-left font-normal h-11">
                                                <svg className="w-4 h-4 mr-2 text-muted-foreground flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                <span className="truncate">{startDate ? format(startDate, 'PP') : 'Date'}</span>
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={startDate}
                                                onSelect={handleStartDateSelect}
                                                disabled={(date) => date < new Date()}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>

                                    <Select value={startHour} onValueChange={setStartHour}>
                                        <SelectTrigger className="h-11">
                                            <svg className="w-4 h-4 mr-2 text-muted-foreground flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <SelectValue placeholder="Time" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {timeSlots.map((slot) => (
                                                <SelectItem key={slot.value} value={slot.value}>
                                                    {slot.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* End Date & Time */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Return Date & Time</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className="w-full justify-start text-left font-normal h-11">
                                                <svg className="w-4 h-4 mr-2 text-muted-foreground flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                <span className="truncate">{endDate ? format(endDate, 'PP') : 'Date'}</span>
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={endDate}
                                                onSelect={setEndDate}
                                                disabled={(date) => date < (startDate || new Date())}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>

                                    <Select value={endHour} onValueChange={setEndHour}>
                                        <SelectTrigger className="h-11">
                                            <svg className="w-4 h-4 mr-2 text-muted-foreground flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <SelectValue placeholder="Time" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {timeSlots.map((slot) => (
                                                <SelectItem key={slot.value} value={slot.value}>
                                                    {slot.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Duration Display */}
                            <div className="flex items-center justify-center gap-2 py-2">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <span className="text-lg font-semibold">{rentalHours} hour{rentalHours !== 1 ? 's' : ''}</span>
                            </div>

                            {/* Price Breakdown */}
                            <Card className="bg-muted/30 border-border/50">
                                <CardContent className="p-4 space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">₹{pricePerDay}/hr × {rentalHours} hour{rentalHours !== 1 ? 's' : ''}</span>
                                        <span>₹{totalAmount}</span>
                                    </div>
                                    <Separator />
                                    <div className="flex justify-between font-semibold">
                                        <span>Total</span>
                                        <span className="text-lg gradient-text">₹{totalAmount}</span>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Info Note */}
                            <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                                <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div className="text-sm text-blue-400">
                                    <p className="font-medium">How it works</p>
                                    <p className="text-blue-400/80">The owner will review your request and respond within 24 hours. Payment will be collected after approval.</p>
                                </div>
                            </div>

                            {/* Security Deposit Note */}
                            <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                                <svg className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                <div className="text-sm text-amber-400">
                                    <p className="font-medium">Security Deposit</p>
                                    <p className="text-amber-400/80">A refundable security deposit (₹500-₹2000) will be collected in cash by the owner at pickup. Refunded upon safe return.</p>
                                </div>
                            </div>

                            {error && (
                                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                    {error}
                                </div>
                            )}
                        </div>

                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                disabled={loading || !startDate || !endDate || rentalHours < 1}
                                className="bg-gradient-to-r from-primary to-emerald-500"
                            >
                                {loading ? (
                                    <>
                                        <svg className="animate-spin w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        Sending...
                                    </>
                                ) : (
                                    'Send Request'
                                )}
                            </Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
