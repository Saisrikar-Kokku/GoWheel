import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { 
    sendBookingConfirmationEmail, 
    sendOwnerBookingNotificationEmail 
} from '@/services/emailService';
import { format } from 'date-fns';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET!;

// Verify Razorpay payment signature (for client-side verification callback)
function verifyPaymentSignature(orderId: string, paymentId: string, signature: string): boolean {
    const generatedSignature = crypto
        .createHmac('sha256', RAZORPAY_KEY_SECRET)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

    return generatedSignature === signature;
}

export async function POST(request: NextRequest) {
    try {
        const { bookingId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = await request.json();

        if (!bookingId) {
            return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 });
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Get booking with payment order ID
        const { data: booking, error: bookingError } = await supabase
            .from('bookings')
            .select('*')
            .eq('id', bookingId)
            .single();

        if (bookingError || !booking) {
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }

        // Already paid
        if (booking.payment_status === 'paid') {
            return NextResponse.json({
                status: 'paid',
                message: 'Payment already confirmed'
            });
        }

        // No order created yet
        if (!booking.payment_order_id) {
            return NextResponse.json({
                status: 'not_started',
                message: 'No payment initiated'
            });
        }

        // If payment details provided, verify signature
        if (razorpay_order_id && razorpay_payment_id && razorpay_signature) {
            // Verify the order ID matches
            if (razorpay_order_id !== booking.payment_order_id) {
                return NextResponse.json({ error: 'Order ID mismatch' }, { status: 400 });
            }

            // Verify payment signature
            const isValid = verifyPaymentSignature(
                razorpay_order_id,
                razorpay_payment_id,
                razorpay_signature
            );

            if (!isValid) {
                console.error('Invalid Razorpay signature for booking:', bookingId);
                return NextResponse.json({
                    status: 'failed',
                    error: 'Payment signature verification failed'
                }, { status: 400 });
            }

            // Signature verified - confirm booking
            const { error: updateError } = await supabase
                .from('bookings')
                .update({
                    payment_status: 'paid',
                    status: 'confirmed',
                    paid_at: new Date().toISOString(),
                    ride_status: 'pending', // Initialize ride status
                })
                .eq('id', bookingId);

            if (updateError) {
                console.error('Failed to update booking:', updateError);
                return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 });
            }

            // Send WhatsApp notifications asynchronously (non-blocking)
            sendBookingNotifications(supabase, bookingId).catch(err => {
                console.error('Error sending notifications:', err);
            });

            return NextResponse.json({
                status: 'paid',
                message: 'Payment verified and booking confirmed!',
            });
        }

        // No payment details - just return current status
        if (booking.payment_status === 'pending') {
            return NextResponse.json({
                status: 'pending',
                message: 'Payment is still pending',
            });
        } else if (booking.payment_status === 'failed') {
            return NextResponse.json({
                status: 'failed',
                message: 'Payment failed',
            });
        } else {
            return NextResponse.json({
                status: booking.payment_status,
                message: `Payment status: ${booking.payment_status}`,
            });
        }

    } catch (error) {
        console.error('Payment verification error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * Send email notifications to owner and renter after booking confirmation
 * This runs asynchronously and won't block the main response
 */
async function sendBookingNotifications(
    supabase: ReturnType<typeof createClient<any>>,
    bookingId: string
): Promise<void> {
    try {
        // Fetch booking with vehicle details
        const { data: booking, error: bookingError } = await supabase
            .from('bookings')
            .select(`
                *,
                vehicle:vehicles(
                    id,
                    title,
                    brand,
                    model,
                    vehicle_type,
                    price_per_day,
                    location,
                    registration_number
                )
            `)
            .eq('id', bookingId)
            .single();

        if (bookingError || !booking) {
            console.error('Failed to fetch booking for notification:', bookingError);
            return;
        }

        // Fetch renter profile separately
        const { data: renterProfile } = await supabase
            .from('profiles')
            .select('id, full_name, email')
            .eq('id', booking.renter_id)
            .single();

        // Fetch owner profile separately
        const { data: ownerProfile } = await supabase
            .from('profiles')
            .select('id, full_name, email')
            .eq('id', booking.owner_id)
            .single();

        // Get emails from auth if not in profiles
        const { data: renterAuth } = await supabase.auth.admin.getUserById(booking.renter_id);
        const { data: ownerAuth } = await supabase.auth.admin.getUserById(booking.owner_id);
        
        const renterEmail = renterProfile?.email || renterAuth?.user?.email;
        const ownerEmail = ownerProfile?.email || ownerAuth?.user?.email;
        const renterPhone = renterAuth?.user?.phone || renterAuth?.user?.user_metadata?.phone;

        // Format dates
        const bookingDate = format(new Date(booking.start_date), 'PPP');
        const startTime = format(new Date(booking.start_date), 'h:mm a');
        const endTime = format(new Date(booking.end_date), 'h:mm a');

        // Send confirmation email to renter
        if (renterEmail) {
            sendBookingConfirmationEmail(renterEmail, {
                renterName: renterProfile?.full_name || 'Rider',
                vehicleTitle: booking.vehicle?.title || 'Vehicle',
                bookingDate,
                startTime,
                endTime,
                totalAmount: booking.total_amount,
                pickupLocation: booking.vehicle?.location || 'Contact owner for location',
                bookingId: booking.id,
            });
        }

        // Send notification email to owner
        if (ownerEmail) {
            sendOwnerBookingNotificationEmail(ownerEmail, {
                ownerName: ownerProfile?.full_name || 'Owner',
                renterName: renterProfile?.full_name || 'Rider',
                vehicleTitle: booking.vehicle?.title || 'Vehicle',
                bookingDate,
                startTime,
                endTime,
                totalAmount: booking.total_amount,
                renterPhone,
                bookingId: booking.id,
            });
        }

    } catch (error) {
        // Silent fail for notification errors - payment already verified
    }
}
