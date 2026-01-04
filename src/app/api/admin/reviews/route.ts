import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Helper to verify admin role
async function verifyAdmin() {
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

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized', status: 401 };

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'admin') {
        return { error: 'Forbidden', status: 403 };
    }

    return { user, supabase };
}

// GET /api/admin/reviews - Get all reviews (read-only)
export async function GET() {
    const auth = await verifyAdmin();
    if ('error' in auth) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { supabase } = auth;

    try {
        // Check if reviews table exists first
        const { data: reviews, error } = await supabase
            .from('reviews')
            .select('*')
            .order('created_at', { ascending: false });

        // If table doesn't exist, return empty array with a note
        if (error) {
            return NextResponse.json({
                reviews: [],
                note: 'Reviews feature not yet implemented or table does not exist'
            });
        }

        // Fetch reviewer and vehicle details separately
        const formattedReviews = await Promise.all(
            (reviews ?? []).map(async (r) => {
                // Get reviewer name
                const { data: reviewer } = await supabase
                    .from('profiles')
                    .select('full_name')
                    .eq('id', r.reviewer_id)
                    .single();

                // Get vehicle title via booking
                let vehicleTitle = 'Unknown';
                if (r.booking_id) {
                    const { data: booking } = await supabase
                        .from('bookings')
                        .select('vehicle_id')
                        .eq('id', r.booking_id)
                        .single();

                    if (booking?.vehicle_id) {
                        const { data: vehicle } = await supabase
                            .from('vehicles')
                            .select('title')
                            .eq('id', booking.vehicle_id)
                            .single();
                        vehicleTitle = vehicle?.title ?? 'Unknown';
                    }
                }

                return {
                    id: r.id,
                    rating: r.rating,
                    comment: r.comment,
                    created_at: r.created_at,
                    reviewer_name: reviewer?.full_name ?? 'Unknown',
                    vehicle_title: vehicleTitle,
                };
            })
        );

        return NextResponse.json({ reviews: formattedReviews });
    } catch (error) {
        console.error('Error fetching reviews:', error);
        // Return empty array if reviews table doesn't exist
        return NextResponse.json({
            reviews: [],
            note: 'Reviews feature not yet available'
        });
    }
}
