import { NextRequest, NextResponse } from 'next/server';
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

// GET /api/admin/bookings - Get all bookings with filters
export async function GET(request: NextRequest) {
    const auth = await verifyAdmin();
    if ('error' in auth) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { supabase } = auth;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    try {
        // Query with correct column names
        let query = supabase
            .from('bookings')
            .select(`
                id,
                start_date,
                end_date,
                total_amount,
                status,
                payment_status,
                created_at,
                renter_id,
                vehicle_id
            `)
            .order('created_at', { ascending: false });

        // Apply status filter if provided
        if (status && status !== 'all') {
            query = query.eq('status', status);
        }

        const { data: bookings, error } = await query;

        if (error) throw error;

        // Fetch vehicle and user details separately
        const formattedBookings = await Promise.all(
            (bookings ?? []).map(async (b) => {
                // Get vehicle info
                const { data: vehicle } = await supabase
                    .from('vehicles')
                    .select('title, owner_id')
                    .eq('id', b.vehicle_id)
                    .single();

                // Get renter name
                const { data: renter } = await supabase
                    .from('profiles')
                    .select('full_name')
                    .eq('id', b.renter_id)
                    .single();

                // Get owner name
                let ownerName = 'Unknown';
                if (vehicle?.owner_id) {
                    const { data: owner } = await supabase
                        .from('profiles')
                        .select('full_name')
                        .eq('id', vehicle.owner_id)
                        .single();
                    ownerName = owner?.full_name ?? 'Unknown';
                }

                return {
                    id: b.id,
                    start_date: b.start_date,
                    end_date: b.end_date,
                    total_price: b.total_amount, // Map to total_price for UI
                    status: b.status,
                    payment_status: b.payment_status,
                    created_at: b.created_at,
                    renter_name: renter?.full_name ?? 'Unknown',
                    vehicle_title: vehicle?.title ?? 'Unknown',
                    owner_name: ownerName,
                };
            })
        );

        return NextResponse.json({ bookings: formattedBookings });
    } catch (error) {
        console.error('Error fetching bookings:', error);
        return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
    }
}
