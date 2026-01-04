// API Route: Generate Ride Start OTP
// POST /api/ride/generate-start-otp

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { generateOTPWithExpiry, formatOTPForDisplay } from '@/services/otpService';
import { sendOTPEmail } from '@/services/emailService';

// Admin client to access auth.users
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

        // Fetch booking
        const { data: booking, error: bookingError } = await supabase
            .from('bookings')
            .select('*, vehicle:vehicles(title, registration_number)')
            .eq('id', bookingId)
            .single();

        if (bookingError || !booking) {
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }

        // Verify user is the owner of the booking
        if (booking.owner_id !== user.id) {
            return NextResponse.json({ error: 'Only the vehicle owner can generate start OTP' }, { status: 403 });
        }

        // Verify booking status
        if (booking.status !== 'confirmed') {
            return NextResponse.json({ 
                error: 'Booking must be confirmed (paid) before generating start OTP' 
            }, { status: 400 });
        }

        // Check if ride already started
        if (booking.ride_status === 'started' || booking.ride_status === 'completed') {
            return NextResponse.json({ 
                error: 'Ride has already started or completed' 
            }, { status: 400 });
        }

        // Check if pre-ride inspection is complete
        const { data: inspectionImages } = await supabase
            .from('ride_inspection_images')
            .select('position')
            .eq('booking_id', bookingId)
            .eq('inspection_type', 'pre_ride');

        const requiredPositions = ['front', 'left', 'right'];
        const uploadedPositions = (inspectionImages || []).map(img => img.position);
        const missingPositions = requiredPositions.filter(pos => !uploadedPositions.includes(pos));

        if (missingPositions.length > 0) {
            return NextResponse.json({
                error: 'Pre-ride inspection images not complete',
                missingPositions,
            }, { status: 400 });
        }

        // Generate OTP
        const { otp, hash, expiresAt } = generateOTPWithExpiry();

        // Store hashed OTP in database
        const { error: updateError } = await supabase
            .from('bookings')
            .update({
                ride_start_otp_hash: hash,
                ride_start_otp_expires: expiresAt,
                ride_status: 'photos_uploaded',
            })
            .eq('id', bookingId);

        if (updateError) {
            return NextResponse.json({ error: 'Failed to generate OTP' }, { status: 500 });
        }

        // Get renter's email from auth.users using admin client
        const { data: renterAuth } = await supabaseAdmin.auth.admin.getUserById(booking.renter_id);

        // Get renter's profile for name
        const { data: renterProfile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', booking.renter_id)
            .single();

        const renterEmail = renterAuth?.user?.email;
        const renterName = renterProfile?.full_name || 'Rider';

        // Send OTP via email to renter
        let emailSent = false;
        if (renterEmail) {
            const emailResult = await sendOTPEmail(renterEmail, {
                recipientName: renterName,
                otp: formatOTPForDisplay(otp),
                vehicleTitle: booking.vehicle?.title || 'Vehicle',
                otpType: 'start',
            });
            emailSent = emailResult.success;
        }

        return NextResponse.json({
            success: true,
            otp: formatOTPForDisplay(otp),
            expiresAt,
            message: renterEmail 
                ? `OTP generated successfully. Email sent to ${renterEmail}.`
                : 'OTP generated successfully. Could not send email (no email found).',
            emailSent,
        });

    } catch {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
