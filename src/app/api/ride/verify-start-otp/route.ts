// API Route: Verify Ride Start OTP
// POST /api/ride/verify-start-otp

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { validateOTP } from '@/services/otpService';
import { sendEmail } from '@/services/emailService';

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
            return NextResponse.json({ error: 'Only the renter can verify start OTP' }, { status: 403 });
        }

        // Verify booking status
        if (booking.status !== 'confirmed') {
            return NextResponse.json({ 
                error: 'Booking must be confirmed before starting ride' 
            }, { status: 400 });
        }

        // Check if ride already started
        if (booking.ride_status === 'started' || booking.ride_status === 'completed') {
            return NextResponse.json({ 
                error: 'Ride has already started or completed' 
            }, { status: 400 });
        }

        // Check if OTP exists
        if (!booking.ride_start_otp_hash || !booking.ride_start_otp_expires) {
            return NextResponse.json({ 
                error: 'No OTP generated. Ask the owner to generate an OTP.' 
            }, { status: 400 });
        }

        // Validate OTP
        const validation = validateOTP(
            otp.replace(/\s/g, ''), // Remove any spaces
            booking.ride_start_otp_hash,
            booking.ride_start_otp_expires
        );

        if (!validation.valid) {
            return NextResponse.json({ 
                error: validation.error 
            }, { status: 400 });
        }

        // OTP valid - update booking status
        const { error: updateError } = await supabase
            .from('bookings')
            .update({
                ride_status: 'started',
                ride_started_at: new Date().toISOString(),
                // Clear OTP after successful verification
                ride_start_otp_hash: null,
                ride_start_otp_expires: null,
            })
            .eq('id', bookingId);

        if (updateError) {
            console.error('Error updating booking:', updateError);
            return NextResponse.json({ error: 'Failed to start ride' }, { status: 500 });
        }

        // Send acknowledgment email to owner
        try {
            // Fetch owner email from auth.users using admin client
            const { data: ownerData, error: ownerError } = await supabaseAdmin.auth.admin.getUserById(booking.owner_id);
            
            if (!ownerError && ownerData?.user?.email) {
                const vehicleTitle = booking.vehicle?.title || 'your vehicle';
                const registrationNumber = booking.vehicle?.registration_number || '';
                const rideStartedAt = new Date().toLocaleString('en-IN', {
                    timeZone: 'Asia/Kolkata',
                    dateStyle: 'medium',
                    timeStyle: 'short'
                });

                await sendEmail(
                    ownerData.user.email,
                    `🚗 Ride Started - ${vehicleTitle}`,
                    `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                                <h1 style="color: white; margin: 0; font-size: 24px;">✅ OTP Verified - Ride Started!</h1>
                            </div>
                            <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
                                <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">Great news! The renter has successfully verified the OTP and started the ride.</p>
                                
                                <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981;">
                                    <h3 style="margin: 0 0 15px 0; color: #111827;">Ride Details</h3>
                                    <p style="margin: 5px 0; color: #6b7280;"><strong>Vehicle:</strong> ${vehicleTitle}</p>
                                    ${registrationNumber ? `<p style="margin: 5px 0; color: #6b7280;"><strong>Registration:</strong> ${registrationNumber}</p>` : ''}
                                    <p style="margin: 5px 0; color: #6b7280;"><strong>Booking ID:</strong> ${bookingId.slice(0, 8)}...</p>
                                    <p style="margin: 5px 0; color: #6b7280;"><strong>Started At:</strong> ${rideStartedAt}</p>
                                </div>

                                <div style="margin-top: 20px; padding: 15px; background: #ecfdf5; border-radius: 8px;">
                                    <p style="margin: 0; color: #065f46; font-size: 14px;">💡 <strong>Tip:</strong> Remember to generate the End OTP when the renter returns the vehicle.</p>
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
            message: 'Ride started successfully! Drive safe.',
            ride_started_at: new Date().toISOString(),
        });

    } catch {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
