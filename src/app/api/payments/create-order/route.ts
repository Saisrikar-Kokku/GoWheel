import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID!;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET!;

// Create Basic Auth header for Razorpay API
function getRazorpayAuthHeader() {
    const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');
    return `Basic ${auth}`;
}

export async function POST(request: NextRequest) {
    try {
        const { bookingId, customerEmail, customerPhone, customerName } = await request.json();

        if (!bookingId) {
            return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 });
        }

        // Create Supabase client with service role for server-side operations
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Fetch booking details
        const { data: booking, error: bookingError } = await supabase
            .from('bookings')
            .select('*')
            .eq('id', bookingId)
            .single();

        if (bookingError || !booking) {
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }

        // Validate booking status
        if (booking.status !== 'approved') {
            return NextResponse.json({ error: 'Booking must be approved before payment' }, { status: 400 });
        }

        // Check if already paid
        if (booking.payment_status === 'paid') {
            return NextResponse.json({ error: 'Booking is already paid' }, { status: 400 });
        }

        // Check if order already exists (prevent duplicates)
        if (booking.payment_order_id && booking.payment_status === 'pending') {
            // Return existing order
            return NextResponse.json({
                order_id: booking.payment_order_id,
                amount: booking.total_amount * 100, // In paise
                currency: 'INR',
                key_id: RAZORPAY_KEY_ID,
            });
        }

        // Create Razorpay order using API (amount in paise)
        const orderResponse = await fetch('https://api.razorpay.com/v1/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': getRazorpayAuthHeader(),
            },
            body: JSON.stringify({
                amount: Math.round(booking.total_amount * 100), // Convert to paise
                currency: 'INR',
                receipt: bookingId.substring(0, 40), // Max 40 chars for Razorpay
                notes: {
                    booking_id: bookingId,
                    renter_id: booking.renter_id,
                    customer_email: customerEmail || '',
                    customer_phone: customerPhone || '',
                    customer_name: customerName || '',
                },
            }),
        });

        if (!orderResponse.ok) {
            const errorData = await orderResponse.json();
            console.error('Razorpay API Error:', JSON.stringify(errorData));
            console.error('Razorpay Status:', orderResponse.status);
            console.error('Key ID used:', RAZORPAY_KEY_ID ? 'Present' : 'Missing');
            return NextResponse.json({
                error: 'Failed to create payment order',
                details: errorData.error?.description || 'Unknown error'
            }, { status: 500 });
        }

        const order = await orderResponse.json();

        // Update booking with payment order details
        const { error: updateError } = await supabase
            .from('bookings')
            .update({
                payment_order_id: order.id,
                payment_status: 'pending',
            })
            .eq('id', bookingId);

        if (updateError) {
            console.error('Database update error:', updateError);
            return NextResponse.json({ error: 'Failed to save payment details' }, { status: 500 });
        }

        return NextResponse.json({
            order_id: order.id,
            amount: order.amount,
            currency: order.currency,
            key_id: RAZORPAY_KEY_ID,
        });

    } catch (error) {
        console.error('Payment order creation error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
