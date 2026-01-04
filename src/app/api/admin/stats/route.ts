import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Helper to verify admin role
async function verifyAdmin(request: NextRequest) {
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

// GET /api/admin/stats - Get platform statistics
export async function GET(request: NextRequest) {
    const auth = await verifyAdmin(request);
    if ('error' in auth) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { supabase } = auth;

    try {
        // Get counts
        const [usersResult, vehiclesResult, bookingsResult, completedResult, reviewsResult] = await Promise.all([
            supabase.from('profiles').select('id', { count: 'exact', head: true }),
            supabase.from('vehicles').select('id', { count: 'exact', head: true }),
            supabase.from('bookings').select('id', { count: 'exact', head: true }),
            supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
            supabase.from('reviews').select('id', { count: 'exact', head: true }),
        ]);

        const stats = {
            totalUsers: usersResult.count ?? 0,
            totalVehicles: vehiclesResult.count ?? 0,
            totalBookings: bookingsResult.count ?? 0,
            completedRentals: completedResult.count ?? 0,
            totalReviews: reviewsResult.count ?? 0,
        };

        return NextResponse.json(stats);
    } catch (error) {
        console.error('Error fetching stats:', error);
        return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
    }
}
