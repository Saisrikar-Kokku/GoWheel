import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID!;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET!;

// Create Basic Auth header for Razorpay API
function getRazorpayAuthHeader() {
    const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');
    return `Basic ${auth}`;
}

// Platform commission rate (10%)
const PLATFORM_COMMISSION_RATE = 0.10;

// Calculate refund based on cancellation timing
function calculateRefund(
    booking: {
        start_date: string;
        total_amount: number;
        payment_status: string;
    },
    cancelledBy: 'renter' | 'owner'
): { eligible: boolean; percentage: number; amount: number; reason: string } {
    const now = new Date();
    const startDate = new Date(booking.start_date);
    const hoursUntilStart = (startDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    // Only paid bookings are eligible for refund
    if (booking.payment_status !== 'paid') {
        return {
            eligible: false,
            percentage: 0,
            amount: 0,
            reason: 'Booking is not paid'
        };
    }

    // Owner cancellation: always full refund
    if (cancelledBy === 'owner') {
        return {
            eligible: true,
            percentage: 100,
            amount: booking.total_amount,
            reason: 'Owner cancelled - full refund'
        };
    }

    // Renter cancellation rules
    if (hoursUntilStart < 0) {
        // After rental start - no refund
        return {
            eligible: false,
            percentage: 0,
            amount: 0,
            reason: 'Cannot cancel after rental has started'
        };
    } else if (hoursUntilStart < 24) {
        // Less than 24 hours - 50% refund
        return {
            eligible: true,
            percentage: 50,
            amount: Math.round(booking.total_amount * 0.5),
            reason: '50% refund (cancelled within 24 hours of start)'
        };
    } else {
        // More than 24 hours - full refund
        return {
            eligible: true,
            percentage: 100,
            amount: booking.total_amount,
            reason: 'Full refund (cancelled more than 24 hours before start)'
        };
    }
}

export async function POST(request: NextRequest) {
    try {
        const { bookingId, cancelledBy, reason } = await request.json();

        if (!bookingId || !cancelledBy) {
            return NextResponse.json(
                { error: 'Booking ID and cancelledBy are required' },
                { status: 400 }
            );
        }

        // 1. Authenticate User
        const authHeader = request.headers.get('Authorization');
        let authClient;

        if (authHeader) {
            // Mobile app request with Bearer token
            authClient = createClient(supabaseUrl, supabaseAnonKey, {
                global: { headers: { Authorization: authHeader } }
            });
        } else {
            // Web request with Cookies
            const cookieStore = await cookies();
            authClient = createServerClient(supabaseUrl, supabaseAnonKey, {
                cookies: {
                    getAll() { return cookieStore.getAll(); },
                    setAll(cookiesToSet) {
                        cookiesToSet.forEach(({ name, value, options }) => {
                            cookieStore.set(name, value, options);
                        });
                    },
                },
            });
        }

        const { data: { user } } = await authClient.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Fetch booking using Admin Client (to bypass RLS if needed, though usually RLS is fine)
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Fetch booking
        const { data: booking, error: bookingError } = await supabase
            .from('bookings')
            .select('*')
            .eq('id', bookingId)
            .single();

        if (bookingError || !booking) {
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }

        // 3. Verify Ownership
        if (cancelledBy === 'renter' && booking.renter_id !== user.id) {
            return NextResponse.json({ error: 'Not authorized to cancel this booking' }, { status: 403 });
        }
        if (cancelledBy === 'owner' && booking.owner_id !== user.id) {
            return NextResponse.json({ error: 'Not authorized to cancel this booking' }, { status: 403 });
        }

        // ... continue with logic ...

        // Check if booking can be cancelled
        if (['cancelled', 'completed', 'rejected'].includes(booking.status)) {
            return NextResponse.json(
                { error: `Cannot cancel a ${booking.status} booking` },
                { status: 400 }
            );
        }

        // Calculate refund
        const refundCalc = calculateRefund(booking, cancelledBy);

        // Prepare update data
        const updateData: Record<string, unknown> = {
            status: 'cancelled',
            cancelled_by: cancelledBy,
            cancelled_at: new Date().toISOString(),
            refund_status: refundCalc.eligible ? 'pending' : 'not_required',
            refund_amount: refundCalc.amount,
            // If owner cancels, no payout
            payout_status: cancelledBy === 'owner' ? 'failed' : booking.payout_status,
            platform_commission: 0,
            owner_payout_amount: 0,
        };

        // If refund is eligible and booking was paid, initiate Razorpay refund
        if (refundCalc.eligible && booking.payment_order_id && booking.payment_status === 'paid') {
            try {
                // Get payments for this order
                const paymentsResponse = await fetch(
                    `https://api.razorpay.com/v1/orders/${booking.payment_order_id}/payments`,
                    {
                        method: 'GET',
                        headers: {
                            'Authorization': getRazorpayAuthHeader(),
                        },
                    }
                );

                if (paymentsResponse.ok) {
                    const payments = await paymentsResponse.json();

                    if (payments.items && payments.items.length > 0) {
                        // Get the captured payment
                        const capturedPayment = payments.items.find(
                            (p: any) => p.status === 'captured'
                        );

                        if (capturedPayment) {
                            // Create refund via API
                            const refundResponse = await fetch(
                                `https://api.razorpay.com/v1/payments/${capturedPayment.id}/refund`,
                                {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'Authorization': getRazorpayAuthHeader(),
                                    },
                                    body: JSON.stringify({
                                        amount: refundCalc.amount * 100, // Convert to paise
                                        notes: {
                                            booking_id: bookingId,
                                            reason: reason || `Cancellation by ${cancelledBy}`,
                                        },
                                    }),
                                }
                            );

                            if (refundResponse.ok) {
                                const refund = await refundResponse.json();
                                updateData.refund_id = refund.id;
                                updateData.refund_status = 'pending';
                            } else {
                                updateData.refund_status = 'failed';
                            }
                        } else {
                            updateData.refund_status = 'failed';
                        }
                    } else {
                        updateData.refund_status = 'failed';
                    }
                } else {
                    updateData.refund_status = 'failed';
                }
            } catch {
                updateData.refund_status = 'failed';
            }
        }

        // Update booking
        const { error: updateError } = await supabase
            .from('bookings')
            .update(updateData)
            .eq('id', bookingId);

        if (updateError) {
            return NextResponse.json({ error: 'Failed to cancel booking' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'Booking cancelled successfully',
            refund: {
                eligible: refundCalc.eligible,
                amount: refundCalc.amount,
                percentage: refundCalc.percentage,
                reason: refundCalc.reason,
                status: updateData.refund_status,
            },
        });

    } catch {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
