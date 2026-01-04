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

// PATCH /api/admin/payouts - Mark payout as paid (after manual transfer)
export async function PATCH(request: NextRequest) {
    const auth = await verifyAdmin();
    if ('error' in auth) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { supabase } = auth;

    try {
        const { bookingId, payoutStatus } = await request.json();

        if (!bookingId || !payoutStatus) {
            return NextResponse.json(
                { error: 'Booking ID and payout status are required' },
                { status: 400 }
            );
        }

        if (!['pending', 'paid', 'failed'].includes(payoutStatus)) {
            return NextResponse.json(
                { error: 'Invalid payout status' },
                { status: 400 }
            );
        }

        // Fetch booking to verify it exists and is completed
        const { data: booking, error: fetchError } = await supabase
            .from('bookings')
            .select('id, status, owner_id')
            .eq('id', bookingId)
            .single();

        if (fetchError || !booking) {
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }

        if (booking.status !== 'completed') {
            return NextResponse.json(
                { error: 'Can only update payout status for completed bookings' },
                { status: 400 }
            );
        }

        // Update payout status
        const { error: updateError } = await supabase
            .from('bookings')
            .update({
                payout_status: payoutStatus,
                updated_at: new Date().toISOString()
            })
            .eq('id', bookingId);

        if (updateError) {
            console.error('Failed to update payout status:', updateError);
            return NextResponse.json({ error: 'Failed to update payout status' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: `Payout marked as ${payoutStatus}`,
            booking: {
                id: bookingId,
                payout_status: payoutStatus
            }
        });

    } catch (error) {
        console.error('Payout update error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// GET /api/admin/payouts - Get all completed bookings with pending payouts
export async function GET() {
    const auth = await verifyAdmin();
    if ('error' in auth) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { supabase } = auth;

    try {
        // Fetch all completed bookings - use simple query first
        const { data: bookings, error } = await supabase
            .from('bookings')
            .select('*')
            .eq('status', 'completed')
            .order('created_at', { ascending: false });

        // If error or no completed bookings, return empty array
        if (error) {
            return NextResponse.json({ bookings: [], note: 'No completed bookings or columns not yet added' });
        }

        if (!bookings || bookings.length === 0) {
            return NextResponse.json({ bookings: [] });
        }

        // Fetch owner and vehicle details
        const formattedBookings = await Promise.all(
            bookings.map(async (b) => {
                const { data: owner } = await supabase
                    .from('profiles')
                    .select('full_name')
                    .eq('id', b.owner_id)
                    .single();

                const { data: vehicle } = await supabase
                    .from('vehicles')
                    .select('title')
                    .eq('id', b.vehicle_id)
                    .single();

                return {
                    id: b.id,
                    total_amount: b.total_amount,
                    status: b.status,
                    payment_status: b.payment_status,
                    payout_status: b.payout_status ?? 'pending',
                    platform_commission: b.platform_commission ?? 0,
                    owner_payout_amount: b.owner_payout_amount ?? 0,
                    created_at: b.created_at,
                    owner_name: owner?.full_name ?? 'Unknown',
                    vehicle_title: vehicle?.title ?? 'Unknown',
                };
            })
        );

        return NextResponse.json({ bookings: formattedBookings });

    } catch (error) {
        console.error('Error fetching payouts:', error);
        return NextResponse.json({ bookings: [], error: 'Failed to fetch payouts' });
    }
}
