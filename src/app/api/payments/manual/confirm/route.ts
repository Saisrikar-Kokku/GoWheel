// API Route: Confirm Manual Payment (Owner)
// POST /api/payments/manual/confirm

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { sendEmail } from '@/services/emailService';

// Admin client to access auth.users for email
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(request: NextRequest) {
    try {
        const { bookingId } = await request.json();

        if (!bookingId) {
            return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 });
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

        // Fetch booking with vehicle details
        const { data: booking, error: bookingError } = await supabase
            .from('bookings')
            .select('*, vehicle:vehicles(title, registration_number)')
            .eq('id', bookingId)
            .single();

        if (bookingError || !booking) {
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }

        // Verify user is the owner
        if (booking.owner_id !== user.id) {
            return NextResponse.json(
                { error: 'Only the vehicle owner can confirm payment' },
                { status: 403 }
            );
        }

        // Verify booking has pending payment
        if (booking.payment_status !== 'pending') {
            return NextResponse.json(
                { error: 'No pending payment to confirm' },
                { status: 400 }
            );
        }

        const now = new Date().toISOString();

        // Update booking to confirmed status
        const { error: updateError } = await supabase
            .from('bookings')
            .update({
                status: 'confirmed',
                payment_status: 'paid',
                payment_confirmed_by: user.id,
                payment_confirmed_at: now,
                paid_at: now,
                ride_status: 'pending', // Initialize ride status
                updated_at: now,
            })
            .eq('id', bookingId);

        if (updateError) {
            console.error('Error confirming payment:', updateError);
            return NextResponse.json(
                { error: 'Failed to confirm payment' },
                { status: 500 }
            );
        }

        // Send confirmation email to renter
        try {
            const { data: renterData } = await supabaseAdmin.auth.admin.getUserById(booking.renter_id);
            
            if (renterData?.user?.email) {
                const vehicleTitle = booking.vehicle?.title || 'your booked vehicle';
                const paymentMethod = booking.payment_method || 'manual';
                const confirmedAt = new Date().toLocaleString('en-IN', {
                    timeZone: 'Asia/Kolkata',
                    dateStyle: 'medium',
                    timeStyle: 'short'
                });

                await sendEmail(
                    renterData.user.email,
                    `✅ Payment Confirmed - ${vehicleTitle}`,
                    `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                                <h1 style="color: white; margin: 0; font-size: 24px;">✅ Payment Confirmed!</h1>
                            </div>
                            <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
                                <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">Great news! The owner has confirmed your payment.</p>
                                
                                <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981;">
                                    <h3 style="margin: 0 0 15px 0; color: #111827;">Booking Confirmed</h3>
                                    <p style="margin: 5px 0; color: #6b7280;"><strong>Vehicle:</strong> ${vehicleTitle}</p>
                                    <p style="margin: 5px 0; color: #6b7280;"><strong>Amount Paid:</strong> ₹${booking.total_amount}</p>
                                    <p style="margin: 5px 0; color: #6b7280;"><strong>Payment Method:</strong> ${paymentMethod.toUpperCase()}</p>
                                    <p style="margin: 5px 0; color: #6b7280;"><strong>Confirmed At:</strong> ${confirmedAt}</p>
                                </div>

                                <div style="margin-top: 20px; padding: 15px; background: #eff6ff; border-radius: 8px;">
                                    <p style="margin: 0; color: #1e40af; font-size: 14px;">📸 <strong>Next Step:</strong> Upload vehicle inspection photos before your ride starts!</p>
                                </div>

                                <p style="margin-top: 25px; color: #9ca3af; font-size: 12px; text-align: center;">Thank you for using GoWheel!</p>
                            </div>
                        </div>
                    `
                );
            }
        } catch {
            // Don't fail the request if email fails
        }

        return NextResponse.json({
            success: true,
            message: 'Payment confirmed successfully! Booking is now active.',
        });

    } catch {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
