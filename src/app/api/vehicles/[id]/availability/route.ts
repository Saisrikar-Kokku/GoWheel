// API Route: Check Vehicle Availability
// GET /api/vehicles/[id]/availability

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: vehicleId } = await params;

        if (!vehicleId) {
            return NextResponse.json({ error: 'Vehicle ID is required' }, { status: 400 });
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

        // Check if vehicle exists and is active
        const { data: vehicle, error: vehicleError } = await supabase
            .from('vehicles')
            .select('id, is_active, vehicle_status')
            .eq('id', vehicleId)
            .single();

        if (vehicleError || !vehicle) {
            return NextResponse.json({ 
                isAvailable: false, 
                reason: 'not_found' 
            });
        }

        if (!vehicle.is_active) {
            return NextResponse.json({ 
                isAvailable: false, 
                reason: 'inactive' 
            });
        }

        if (vehicle.vehicle_status !== 'approved') {
            return NextResponse.json({ 
                isAvailable: false, 
                reason: 'not_approved' 
            });
        }

        // Check for overlapping active bookings
        const now = new Date().toISOString();
        
        const { data: activeBookings, error: bookingsError } = await supabase
            .from('bookings')
            .select('id, start_date, end_date, status, ride_status')
            .eq('vehicle_id', vehicleId)
            .in('status', ['confirmed', 'approved'])
            .gte('end_date', now)
            .order('start_date', { ascending: true });

        if (bookingsError) {
            console.error('Error checking availability:', bookingsError);
            return NextResponse.json({ isAvailable: true });
        }

        // Check if any booking overlaps with current time
        const currentTime = new Date();
        
        for (const booking of activeBookings || []) {
            const startDate = new Date(booking.start_date);
            const endDate = new Date(booking.end_date);
            
            // Check if current time falls within booking period
            // Also check if ride is ongoing (started but not ended)
            if (currentTime >= startDate && currentTime <= endDate) {
                return NextResponse.json({
                    isAvailable: false,
                    reason: 'booked',
                    currentBooking: {
                        id: booking.id,
                        start_date: booking.start_date,
                        end_date: booking.end_date,
                        status: booking.status,
                        ride_status: booking.ride_status,
                    },
                    nextAvailableDate: booking.end_date,
                });
            }
        }

        // Get all upcoming bookings for calendar
        const upcomingBookings = (activeBookings || []).map(b => ({
            start: b.start_date,
            end: b.end_date,
        }));

        return NextResponse.json({
            isAvailable: true,
            upcomingBookings,
        });

    } catch (error) {
        console.error('Check availability error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST: Check availability for specific date range
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: vehicleId } = await params;
        const { startDate, endDate } = await request.json();

        if (!vehicleId || !startDate || !endDate) {
            return NextResponse.json({ 
                error: 'Vehicle ID, startDate, and endDate are required' 
            }, { status: 400 });
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

        // Check for conflicting bookings in the date range
        const { data: conflictingBookings, error } = await supabase
            .from('bookings')
            .select('id, start_date, end_date, status')
            .eq('vehicle_id', vehicleId)
            .in('status', ['confirmed', 'approved', 'requested'])
            .or(`and(start_date.lte.${endDate},end_date.gte.${startDate})`);

        if (error) {
            console.error('Error checking date availability:', error);
            return NextResponse.json({ isAvailable: true });
        }

        if (conflictingBookings && conflictingBookings.length > 0) {
            return NextResponse.json({
                isAvailable: false,
                reason: 'date_conflict',
                conflictingBookings: conflictingBookings.map(b => ({
                    start_date: b.start_date,
                    end_date: b.end_date,
                    status: b.status,
                })),
            });
        }

        return NextResponse.json({ isAvailable: true });

    } catch (error) {
        console.error('Check date availability error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
