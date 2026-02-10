// Booking service — mirrors the website's bookingService.ts

import { supabase } from '@/lib/supabase';
import { apiCall } from '@/lib/api';
import { Booking, BookingWithDetails, CreateBookingRequest } from '@/types/booking';

// ================================
// RENTER FUNCTIONS
// ================================

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

    if (error) throw error;
    return data;
}

export async function getRenterBookings(): Promise<BookingWithDetails[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: bookings, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('renter_id', user.id)
        .order('created_at', { ascending: false });

    if (error) throw error;

    return Promise.all(
        (bookings || []).map(async (booking) => {
            const { data: vehicle } = await supabase.from('vehicles').select('id, title, brand, model, vehicle_type, price_per_day, location').eq('id', booking.vehicle_id).single();
            let images: { id: string; image_url: string; is_primary: boolean }[] = [];
            if (vehicle) {
                const { data: vehicleImages } = await supabase.from('vehicle_images').select('id, image_url, is_primary').eq('vehicle_id', vehicle.id).order('is_primary', { ascending: false }).limit(1);
                images = vehicleImages || [];
            }
            const { data: owner } = await supabase.from('profiles').select('id, full_name').eq('id', booking.owner_id).single();
            return { ...booking, vehicle: vehicle ? { ...vehicle, images } : undefined, owner: owner || undefined } as BookingWithDetails;
        })
    );
}

export async function cancelBooking(bookingId: string, cancelledBy: 'renter' | 'owner' = 'renter', reason?: string): Promise<{ success: boolean }> {
    return apiCall<{ success: boolean }>('/api/bookings/cancel', {
        method: 'POST',
        body: { bookingId, cancelledBy, reason },
    });
}

export async function completeBooking(bookingId: string): Promise<{
    success: boolean;
    payout: { totalAmount: number; platformCommission: number; ownerPayoutAmount: number };
}> {
    return apiCall<{
        success: boolean;
        payout: { totalAmount: number; platformCommission: number; ownerPayoutAmount: number };
    }>('/api/bookings/complete', {
        method: 'POST',
        body: { bookingId },
    });
}

// ================================
// OWNER FUNCTIONS
// ================================

export async function getOwnerBookingRequests(): Promise<BookingWithDetails[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: bookings, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

    if (error) throw error;

    return Promise.all(
        (bookings || []).map(async (booking) => {
            const { data: vehicle } = await supabase.from('vehicles').select('id, title, brand, model, vehicle_type, price_per_day, location').eq('id', booking.vehicle_id).single();
            let images: { id: string; image_url: string; is_primary: boolean }[] = [];
            if (vehicle) {
                const { data: vehicleImages } = await supabase.from('vehicle_images').select('id, image_url, is_primary').eq('vehicle_id', vehicle.id).order('is_primary', { ascending: false }).limit(1);
                images = vehicleImages || [];
            }
            const { data: renter } = await supabase.from('profiles').select('id, full_name').eq('id', booking.renter_id).single();
            return { ...booking, vehicle: vehicle ? { ...vehicle, images } : undefined, renter: renter || undefined } as BookingWithDetails;
        })
    );
}

export async function getOwnerBookingCounts(): Promise<{ pending: number; approved: number; total: number }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { pending: 0, approved: 0, total: 0 };

    const { data: bookings } = await supabase.from('bookings').select('status').eq('owner_id', user.id);
    const pending = bookings?.filter(b => b.status === 'requested').length || 0;
    const approved = bookings?.filter(b => b.status === 'approved').length || 0;
    return { pending, approved, total: bookings?.length || 0 };
}

export async function approveBooking(bookingId: string): Promise<void> {
    const { error } = await supabase.from('bookings').update({ status: 'approved' }).eq('id', bookingId);
    if (error) throw error;
}

export async function rejectBooking(bookingId: string): Promise<void> {
    const { error } = await supabase.from('bookings').update({ status: 'rejected' }).eq('id', bookingId);
    if (error) throw error;
}

// ================================
// SHARED
// ================================

export async function checkDateAvailability(vehicleId: string, startDate: string, endDate: string): Promise<boolean> {
    // Overlap: existing.start_date < newEnd AND existing.end_date > newStart
    // Using separate filters = AND (not .or which was buggy)
    const { data } = await supabase
        .from('bookings')
        .select('id')
        .eq('vehicle_id', vehicleId)
        .in('status', ['requested', 'approved', 'confirmed'])
        .lt('start_date', endDate)
        .gt('end_date', startDate);

    return !data || data.length === 0;
}

export function calculateTotalPrice(pricePerHour: number, startDate: Date, endDate: Date): number {
    const hours = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60)));
    return pricePerHour * hours;
}

export function getRentalHours(startDate: Date, endDate: Date): number {
    return Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60)));
}

export async function getRenterStats(): Promise<{ active: number; upcoming: number; completed: number }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { active: 0, upcoming: 0, completed: 0 };

    const { data: bookings } = await supabase.from('bookings').select('status, ride_status').eq('renter_id', user.id);

    const active = bookings?.filter(b => b.ride_status === 'started' || b.ride_status === 'vehicle_inspected').length || 0;
    const upcoming = bookings?.filter(b => b.status === 'approved' && (!b.ride_status || b.ride_status === 'pending')).length || 0;
    const completed = bookings?.filter(b => b.ride_status === 'completed').length || 0;

    return { active, upcoming, completed };
}
