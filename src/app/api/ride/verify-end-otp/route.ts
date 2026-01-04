// API Route: Verify Ride End OTP
// POST /api/ride/verify-end-otp

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { validateOTP } from '@/services/otpService';
import { sendEmail } from '@/services/emailService';
import { PLATFORM_COMMISSION_RATE } from '@/types/booking';

// Admin client to access auth.users for owner email
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(request: NextRequest) {
    try {
        const { bookingId, otp } = await request.json();

        if (!bookingId || !otp) {
            return NextResponse.json({ error: 'Booking ID and OTP are required' }, { status: 400 });
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

        // Verify user is the renter
        if (booking.renter_id !== user.id) {
            return NextResponse.json({ error: 'Only the renter can verify end OTP' }, { status: 403 });
        }

        // Verify ride has started
        if (booking.ride_status !== 'started') {
            return NextResponse.json({ 
                error: 'Ride must be started before ending' 
            }, { status: 400 });
        }

        // Check if OTP exists
        if (!booking.ride_end_otp_hash || !booking.ride_end_otp_expires) {
            return NextResponse.json({ 
                error: 'No end OTP generated. Ask the owner to generate an OTP.' 
            }, { status: 400 });
        }

        // Validate OTP
        const cleanOtp = otp.replace(/\s/g, '');
        const validation = validateOTP(
            cleanOtp,
            booking.ride_end_otp_hash,
            booking.ride_end_otp_expires
        );

        if (!validation.valid) {
            return NextResponse.json({ 
                error: validation.error 
            }, { status: 400 });
        }

        // Calculate payout amounts
        const platformCommission = Math.round(booking.total_amount * PLATFORM_COMMISSION_RATE);
        const ownerPayoutAmount = booking.total_amount - platformCommission;

        // OTP valid - complete the ride
        // Note: booking.status stays 'confirmed', only ride_status changes to 'completed'
        const updateData: Record<string, unknown> = {
            ride_status: 'completed',
            ride_ended_at: new Date().toISOString(),
            ride_end_otp_hash: null,
            ride_end_otp_expires: null,
            updated_at: new Date().toISOString(),
        };

        // Try to add payout fields (may not exist in some DB schemas)
        try {
            updateData.payout_status = 'pending';
            updateData.platform_commission = platformCommission;
            updateData.owner_payout_amount = ownerPayoutAmount;
        } catch {
            // Payout fields not available in schema
        }

        const { error: updateError } = await supabase
            .from('bookings')
            .update(updateData)
            .eq('id', bookingId);

        if (updateError) {
            // Try a minimal update if the full update failed
            const { error: minimalUpdateError } = await supabase
                .from('bookings')
                .update({
                    ride_status: 'completed',
                    ride_ended_at: new Date().toISOString(),
                })
                .eq('id', bookingId);

            if (minimalUpdateError) {
                return NextResponse.json({ 
                    error: 'Failed to end ride: ' + updateError.message 
                }, { status: 500 });
            }
        }

        // Send acknowledgment email to owner
        try {
            // Fetch owner email from auth.users using admin client
            const { data: ownerData, error: ownerError } = await supabaseAdmin.auth.admin.getUserById(booking.owner_id);
            
            if (!ownerError && ownerData?.user?.email) {
                const vehicleTitle = booking.vehicle?.title || 'your vehicle';
                const registrationNumber = booking.vehicle?.registration_number || '';
                const rideEndedAt = new Date().toLocaleString('en-IN', {
                    timeZone: 'Asia/Kolkata',
                    dateStyle: 'medium',
                    timeStyle: 'short'
                });

                await sendEmail(
                    ownerData.user.email,
                    `🎉 Ride Completed - ${vehicleTitle}`,
                    `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                            <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                                <h1 style="color: white; margin: 0; font-size: 24px;">🎉 Ride Completed Successfully!</h1>
                            </div>
                            <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
                                <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">The renter has successfully verified the end OTP and completed the ride.</p>
                                
                                <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6;">
                                    <h3 style="margin: 0 0 15px 0; color: #111827;">Ride Summary</h3>
                                    <p style="margin: 5px 0; color: #6b7280;"><strong>Vehicle:</strong> ${vehicleTitle}</p>
                                    ${registrationNumber ? `<p style="margin: 5px 0; color: #6b7280;"><strong>Registration:</strong> ${registrationNumber}</p>` : ''}
                                    <p style="margin: 5px 0; color: #6b7280;"><strong>Booking ID:</strong> ${bookingId.slice(0, 8)}...</p>
                                    <p style="margin: 5px 0; color: #6b7280;"><strong>Completed At:</strong> ${rideEndedAt}</p>
                                </div>

                                <div style="margin-top: 20px; background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981;">
                                    <h3 style="margin: 0 0 15px 0; color: #111827;">💰 Earnings Summary</h3>
                                    <p style="margin: 5px 0; color: #6b7280;"><strong>Total Amount:</strong> ₹${booking.total_amount}</p>
                                    <p style="margin: 5px 0; color: #6b7280;"><strong>Platform Commission (${Math.round(PLATFORM_COMMISSION_RATE * 100)}%):</strong> ₹${platformCommission}</p>
                                    <p style="margin: 10px 0 0 0; color: #059669; font-size: 18px;"><strong>Your Earnings:</strong> ₹${ownerPayoutAmount}</p>
                                </div>

                                <div style="margin-top: 20px; padding: 15px; background: #eff6ff; border-radius: 8px;">
                                    <p style="margin: 0; color: #1e40af; font-size: 14px;">💡 Your payout will be processed soon. You can track the status in your dashboard.</p>
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
            message: 'Ride completed successfully! Thank you for using GoWheel.',
            ride_ended_at: new Date().toISOString(),
            payout: {
                totalAmount: booking.total_amount,
                platformCommission,
                ownerPayoutAmount,
            },
        });

    } catch {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
