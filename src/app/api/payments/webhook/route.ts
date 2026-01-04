import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET!;

// Verify Razorpay webhook signature
function verifyRazorpaySignature(body: string, signature: string): boolean {
    const expectedSignature = crypto
        .createHmac('sha256', RAZORPAY_KEY_SECRET)
        .update(body)
        .digest('hex');

    return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
    );
}

export async function POST(request: NextRequest) {
    try {
        const rawBody = await request.text();
        const signature = request.headers.get('x-razorpay-signature') || '';

        // Verify webhook signature (CRITICAL for security)
        let isValid = false;
        try {
            isValid = verifyRazorpaySignature(rawBody, signature);
        } catch {
            // Signature verification error - will be handled below
        }

        // For production, strict signature verification is required
        if (!isValid && process.env.NODE_ENV === 'production') {
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }

        const webhookData = JSON.parse(rawBody);

        const { event, payload } = webhookData;

        // Create Supabase client with service role
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Handle payment.captured event
        if (event === 'payment.captured') {
            const payment = payload.payment.entity;
            const orderId = payment.order_id;

            // Find booking by payment_order_id
            const { data: booking, error: bookingError } = await supabase
                .from('bookings')
                .select('id, payment_status, status')
                .eq('payment_order_id', orderId)
                .single();

            if (bookingError || !booking) {
                return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
            }

            // Idempotency check - don't process if already paid
            if (booking.payment_status === 'paid') {
                return NextResponse.json({ message: 'Already processed' });
            }

            // Payment successful - confirm booking
            const { error: updateError } = await supabase
                .from('bookings')
                .update({
                    payment_status: 'paid',
                    status: 'confirmed',
                    paid_at: new Date().toISOString(),
                })
                .eq('id', booking.id);

            if (updateError) {
                return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
            }

            return NextResponse.json({ message: 'Payment confirmed' });
        }

        // Handle payment.failed event
        if (event === 'payment.failed') {
            const payment = payload.payment.entity;
            const orderId = payment.order_id;

            const { data: booking } = await supabase
                .from('bookings')
                .select('id, payment_status')
                .eq('payment_order_id', orderId)
                .single();

            if (booking && booking.payment_status !== 'paid') {
                await supabase
                    .from('bookings')
                    .update({ payment_status: 'failed' })
                    .eq('id', booking.id);
            }

            return NextResponse.json({ message: 'Payment failure recorded' });
        }

        // Unknown event type
        return NextResponse.json({ message: 'Webhook received' });

    } catch {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// Razorpay may send GET requests to verify endpoint is active
export async function GET() {
    return NextResponse.json({ status: 'Razorpay webhook endpoint active' });
}
