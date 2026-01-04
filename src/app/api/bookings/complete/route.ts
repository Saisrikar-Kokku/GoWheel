import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Platform commission rate (10%)
const PLATFORM_COMMISSION_RATE = 0.10;

export async function POST(request: NextRequest) {
    try {
        const { bookingId } = await request.json();

        if (!bookingId) {
            return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 });
        }

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

        // Check if booking can be completed
        if (booking.status !== 'confirmed') {
            return NextResponse.json(
                { error: 'Only confirmed bookings can be marked as completed' },
                { status: 400 }
            );
        }

        // Check if rental period has ended
        const now = new Date();
        const endDate = new Date(booking.end_date);

        if (now < endDate) {
            return NextResponse.json(
                { error: 'Rental period has not ended yet' },
                { status: 400 }
            );
        }

        // Calculate payout amounts
        const totalAmount = booking.total_amount;
        const platformCommission = Math.round(totalAmount * PLATFORM_COMMISSION_RATE * 100) / 100;
        const ownerPayoutAmount = Math.round((totalAmount - platformCommission) * 100) / 100;

        // Update booking to completed with payout calculation
        const { error: updateError } = await supabase
            .from('bookings')
            .update({
                status: 'completed',
                payout_status: 'pending', // Will be marked 'paid' when admin transfers manually
                platform_commission: platformCommission,
                owner_payout_amount: ownerPayoutAmount,
            })
            .eq('id', bookingId);

        if (updateError) {
            console.error('Failed to complete booking:', updateError);
            return NextResponse.json({ error: 'Failed to complete booking' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'Booking marked as completed',
            payout: {
                totalAmount,
                platformCommission,
                ownerPayoutAmount,
                status: 'pending',
            },
        });

    } catch (error) {
        console.error('Complete booking error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
