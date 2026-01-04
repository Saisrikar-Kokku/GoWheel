// API Route: Submit Manual Payment
// POST /api/payments/manual/submit

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { PaymentMethod } from '@/types/booking';

export async function POST(request: NextRequest) {
    try {
        const { bookingId, paymentMethod } = await request.json();

        if (!bookingId || !paymentMethod) {
            return NextResponse.json(
                { error: 'Booking ID and payment method are required' },
                { status: 400 }
            );
        }

        // Validate payment method
        const validMethods: PaymentMethod[] = ['upi', 'cash', 'card', 'online'];
        if (!validMethods.includes(paymentMethod)) {
            return NextResponse.json(
                { error: 'Invalid payment method' },
                { status: 400 }
            );
        }

        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll();
                    },
                    setAll(cookiesToSet) {
                        cookiesToSet.forEach(({ name, value, options }) => {
                            cookieStore.set(name, value, options);
                        });
                    },
                },
            }
        );

        // Verify user is authenticated
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch booking
        const { data: booking, error: bookingError } = await supabase
            .from('bookings')
            .select('*')
            .eq('id', bookingId)
            .single();

        if (bookingError || !booking) {
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }

        // Verify user is the renter
        if (booking.renter_id !== user.id) {
            return NextResponse.json(
                { error: 'Only the renter can submit payment' },
                { status: 403 }
            );
        }

        // Verify booking is approved
        if (booking.status !== 'approved') {
            return NextResponse.json(
                { error: 'Booking must be approved before payment' },
                { status: 400 }
            );
        }

        // Update booking with payment method and set status to pending
        const { error: updateError } = await supabase
            .from('bookings')
            .update({
                payment_method: paymentMethod,
                payment_status: 'pending',
                updated_at: new Date().toISOString(),
            })
            .eq('id', bookingId);

        if (updateError) {
            console.error('Error updating booking:', updateError);
            return NextResponse.json(
                { error: 'Failed to submit payment' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Payment submitted. Waiting for owner confirmation.',
            paymentMethod,
        });

    } catch (error) {
        console.error('Manual payment submit error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
