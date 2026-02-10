// API Route: Get Ride Inspection Images
// GET /api/ride/inspection/[bookingId]

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { REQUIRED_PRE_RIDE_POSITIONS } from '@/types/rideInspection';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ bookingId: string }> }
) {
    try {
        const { bookingId } = await params;

        if (!bookingId) {
            return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 });
        }

        const authHeader = request.headers.get('Authorization');
        let supabase;
        let accessToken: string | undefined;

        if (authHeader) {
            // Mobile app request with Bearer token
            accessToken = authHeader.replace('Bearer ', '');
            supabase = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                { global: { headers: { Authorization: authHeader } } }
            );
        } else {
            const cookieStore = await cookies();
            supabase = createServerClient(
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
        }

        // Verify user is authenticated - pass token explicitly for mobile requests
        const { data: { user } } = await supabase.auth.getUser(accessToken);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch booking to verify access
        const { data: booking, error: bookingError } = await supabase
            .from('bookings')
            .select('renter_id, owner_id')
            .eq('id', bookingId)
            .single();

        if (bookingError || !booking) {
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }

        // Verify user is participant in booking or admin
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (
            booking.renter_id !== user.id &&
            booking.owner_id !== user.id &&
            profile?.role !== 'admin'
        ) {
            return NextResponse.json({ error: 'Not authorized for this booking' }, { status: 403 });
        }

        // Fetch all inspection images
        const { data: images, error: imagesError } = await supabase
            .from('ride_inspection_images')
            .select('*')
            .eq('booking_id', bookingId)
            .order('created_at', { ascending: true });

        if (imagesError) {
            console.error('Error fetching images:', imagesError);
            return NextResponse.json({ error: 'Failed to fetch images' }, { status: 500 });
        }

        // Separate by inspection type
        const preRideImages = (images || []).filter(img => img.inspection_type === 'pre_ride');
        const postRideImages = (images || []).filter(img => img.inspection_type === 'post_ride');

        // Calculate completion status
        const preRidePositions = preRideImages.map(img => img.position);
        const postRidePositions = postRideImages.map(img => img.position);

        return NextResponse.json({
            images: images || [],
            preRide: {
                images: preRideImages,
                isComplete: REQUIRED_PRE_RIDE_POSITIONS.every(pos => preRidePositions.includes(pos)),
                missingPositions: REQUIRED_PRE_RIDE_POSITIONS.filter(pos => !preRidePositions.includes(pos)),
                uploadedPositions: preRidePositions,
            },
            postRide: {
                images: postRideImages,
                isComplete: REQUIRED_PRE_RIDE_POSITIONS.every(pos => postRidePositions.includes(pos)),
                missingPositions: REQUIRED_PRE_RIDE_POSITIONS.filter(pos => !postRidePositions.includes(pos)),
                uploadedPositions: postRidePositions,
            },
        });

    } catch (error) {
        console.error('Get inspection images error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
