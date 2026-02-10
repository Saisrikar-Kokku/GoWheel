// Booking service for rental transactions

import { createBrowserClient } from '@supabase/ssr';
import { Booking, BookingWithDetails, BookingWithVehicle, CreateBookingRequest, BookingStatus } from '@/types/booking';

const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ================================
// RENTER FUNCTIONS
// ================================

// Create a new booking request
export async function createBookingRequest(request: CreateBookingRequest): Promise<Booking> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
        .from('bookings')
        .insert({
            vehicle_id: request.vehicle_id,
            renter_id: user.id,
            owner_id: request.owner_id,
            start_date: request.start_date,
            end_date: request.end_date,
            total_amount: request.total_amount,
            status: 'requested',
        })
        .select()
        .single();

    if (error) {
        throw error;
    }
    return data;
}

// Get renter's bookings
export async function getRenterBookings(): Promise<BookingWithDetails[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: bookings, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('renter_id', user.id)
        .order('created_at', { ascending: false });

    if (error) {
        throw error;
    }

    // Fetch vehicle and owner details for each booking
    const bookingsWithDetails = await Promise.all(
        (bookings || []).map(async (booking) => {
            const { data: vehicle } = await supabase
                .from('vehicles')
                .select('id, title, brand, model, vehicle_type, price_per_day, location')
                .eq('id', booking.vehicle_id)
                .single();

            // Fetch primary image
            let images: { id: string; image_url: string; is_primary: boolean }[] = [];
            if (vehicle) {
                const { data: vehicleImages } = await supabase
                    .from('vehicle_images')
                    .select('id, image_url, is_primary')
                    .eq('vehicle_id', vehicle.id)
                    .order('is_primary', { ascending: false })
                    .limit(1);
                images = vehicleImages || [];
            }

            // Fetch owner profile for chat
            const { data: owner } = await supabase
                .from('profiles')
                .select('id, full_name')
                .eq('id', booking.owner_id)
                .single();

            return {
                ...booking,
                vehicle: vehicle ? { ...vehicle, images } : undefined,
                owner: owner || undefined,
            } as BookingWithDetails;
        })
    );

    return bookingsWithDetails;
}

// Cancel a booking with refund processing
export async function cancelBooking(
    bookingId: string,
    cancelledBy: 'renter' | 'owner' = 'renter',
    reason?: string
): Promise<{ success: boolean; refund?: { eligible: boolean; amount: number; percentage: number } }> {
    const response = await fetch('/api/bookings/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            bookingId,
            cancelledBy,
            reason,
        }),
    });

    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to cancel booking');
    }

    return response.json();
}

// Mark booking as completed (after rental period ends)
export async function completeBooking(bookingId: string): Promise<{
    success: boolean;
    payout: { totalAmount: number; platformCommission: number; ownerPayoutAmount: number };
}> {
    const response = await fetch('/api/bookings/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId }),
    });

    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to complete booking');
    }

    return response.json();
}

// ================================
// OWNER FUNCTIONS
// ================================

// Get owner's booking requests
export async function getOwnerBookingRequests(): Promise<BookingWithDetails[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get owner's booking requests
    const { data: bookings, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

    if (error) throw error;

    // Fetch vehicle and renter details
    const bookingsWithDetails = await Promise.all(
        (bookings || []).map(async (booking) => {
            // Fetch vehicle
            const { data: vehicle, error: vehicleError } = await supabase
                .from('vehicles')
                .select('id, title, brand, model, vehicle_type, price_per_day, location')
                .eq('id', booking.vehicle_id)
                .single();

            if (vehicleError) {
                console.error(`Error fetching vehicle ${booking.vehicle_id}:`, vehicleError);
            }

            // Fetch vehicle image
            let images: { id: string; image_url: string; is_primary: boolean }[] = [];
            if (vehicle) {
                const { data: vehicleImages } = await supabase
                    .from('vehicle_images')
                    .select('id, image_url, is_primary')
                    .eq('vehicle_id', vehicle.id)
                    .order('is_primary', { ascending: false })
                    .limit(1);
                images = vehicleImages || [];
            }

            // Fetch renter profile
            const { data: renter, error: renterError } = await supabase
                .from('profiles')
                .select('id, full_name')
                .eq('id', booking.renter_id)
                .single();

            if (renterError) {
                console.error(`Error fetching renter ${booking.renter_id}:`, renterError);
            }

            return {
                ...booking,
                vehicle: vehicle ? { ...vehicle, images } : undefined,
                renter: renter || undefined,
            } as BookingWithDetails;
        })
    );

    return bookingsWithDetails;
}

// Get counts for owner dashboard
export async function getOwnerBookingCounts(): Promise<{ pending: number; approved: number; total: number }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { pending: 0, approved: 0, total: 0 };

    const { data: bookings } = await supabase
        .from('bookings')
        .select('status')
        .eq('owner_id', user.id);

    const pending = bookings?.filter(b => b.status === 'requested').length || 0;
    const approved = bookings?.filter(b => b.status === 'approved').length || 0;
    const total = bookings?.length || 0;

    return { pending, approved, total };
}

// Approve a booking
export async function approveBooking(bookingId: string): Promise<void> {
    const { error } = await supabase
        .from('bookings')
        .update({ status: 'approved' })
        .eq('id', bookingId);

    if (error) throw error;
}

// Reject a booking
export async function rejectBooking(bookingId: string): Promise<void> {
    const { error } = await supabase
        .from('bookings')
        .update({ status: 'rejected' })
        .eq('id', bookingId);

    if (error) throw error;
}

// ================================
// SHARED FUNCTIONS
// ================================

// Check if dates overlap with existing bookings
export async function checkDateAvailability(
    vehicleId: string,
    startDate: string,
    endDate: string,
    excludeBookingId?: string
): Promise<boolean> {
    // Overlap: existing.start_date < newEnd AND existing.end_date > newStart
    let query = supabase
        .from('bookings')
        .select('id')
        .eq('vehicle_id', vehicleId)
        .in('status', ['requested', 'approved', 'confirmed'])
        .lt('start_date', endDate)
        .gt('end_date', startDate);

    if (excludeBookingId) {
        query = query.neq('id', excludeBookingId);
    }

    const { data } = await query;
    return !data || data.length === 0;
}

// Calculate total price (now hourly)
export function calculateTotalPrice(pricePerHour: number, startDate: Date, endDate: Date): number {
    const hours = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60)));
    return pricePerHour * hours;
}

// Get number of rental hours
export function getRentalHours(startDate: Date, endDate: Date): number {
    return Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60)));
}
