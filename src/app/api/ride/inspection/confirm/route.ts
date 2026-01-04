// API Route: Confirm Ride Inspection
// POST /api/ride/inspection/confirm

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { REQUIRED_PRE_RIDE_POSITIONS } from '@/types/rideInspection';

export async function POST(request: NextRequest) {
    try {
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

        // Get booking ID from request body
        const { bookingId } = await request.json();
        if (!bookingId) {
            return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 });
        }

        // Fetch booking to verify access
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
            return NextResponse.json({ 
                error: 'Only the renter can confirm inspection' 
            }, { status: 403 });
        }

        // Verify booking is confirmed and paid
        if (booking.status !== 'confirmed' || booking.payment_status !== 'paid') {
            return NextResponse.json({ 
                error: 'Booking must be confirmed and paid' 
            }, { status: 400 });
        }

        // Verify ride status is pending (not already submitted)
        if (booking.ride_status && booking.ride_status !== 'pending') {
            return NextResponse.json({ 
                error: 'Inspection already submitted' 
            }, { status: 400 });
        }

        // Verify all required photos are uploaded
        const { data: images, error: imagesError } = await supabase
            .from('ride_inspection_images')
            .select('position')
            .eq('booking_id', bookingId)
            .eq('inspection_type', 'pre_ride');

        if (imagesError) {
            console.error('Error fetching images:', imagesError);
            return NextResponse.json({ 
                error: 'Failed to verify inspection images' 
            }, { status: 500 });
        }

        const uploadedPositions = (images || []).map(img => img.position);
        const missingPositions = REQUIRED_PRE_RIDE_POSITIONS.filter(
            pos => !uploadedPositions.includes(pos)
        );

        if (missingPositions.length > 0) {
            return NextResponse.json({ 
                error: `Missing required photos: ${missingPositions.join(', ')}` 
            }, { status: 400 });
        }

        // Update booking ride_status to 'photos_uploaded'
        const { error: updateError } = await supabase
            .from('bookings')
            .update({ 
                ride_status: 'photos_uploaded',
                updated_at: new Date().toISOString()
            })
            .eq('id', bookingId);

        if (updateError) {
            console.error('Error updating booking:', updateError);
            return NextResponse.json({ 
                error: 'Failed to update booking status' 
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'Inspection confirmed successfully. Waiting for owner to generate OTP.',
            ride_status: 'photos_uploaded'
        });

    } catch (error) {
        console.error('Confirm inspection error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
