// Booking types for the rental system

export type BookingStatus = 'requested' | 'approved' | 'rejected' | 'cancelled' | 'confirmed';
export type PaymentStatus = 'not_started' | 'pending' | 'paid' | 'failed' | 'refunded';
export type RefundStatus = 'not_required' | 'pending' | 'processed' | 'failed';
export type PayoutStatus = 'pending' | 'paid' | 'failed';
export type CancelledBy = 'renter' | 'owner' | null;

// NEW: Manual payment method types
export type PaymentMethod = 'upi' | 'cash' | 'card' | 'online';

// NEW: Ride verification status
export type RideStatus = 'pending' | 'photos_uploaded' | 'started' | 'completed';

export interface Booking {
    id: string;
    vehicle_id: string;
    renter_id: string;
    owner_id: string;
    start_date: string;
    end_date: string;
    total_amount: number;
    status: BookingStatus;
    payment_status: PaymentStatus;
    payment_order_id?: string;
    payment_session_id?: string;
    paid_at?: string;
    // NEW: Manual payment fields
    payment_method?: PaymentMethod;
    payment_confirmed_by?: string;
    payment_confirmed_at?: string;
    // Cancellation fields
    cancelled_by?: CancelledBy;
    cancelled_at?: string;
    // Refund fields
    refund_status?: RefundStatus;
    refund_amount?: number;
    refund_id?: string;
    // Payout fields
    payout_status?: PayoutStatus;
    platform_commission?: number;
    owner_payout_amount?: number;
    // NEW: Ride verification fields
    ride_status?: RideStatus;
    ride_start_otp_hash?: string;
    ride_start_otp_expires?: string;
    ride_end_otp_hash?: string;
    ride_end_otp_expires?: string;
    ride_started_at?: string;
    ride_ended_at?: string;
    // Timestamps
    created_at: string;
    updated_at: string;
}

export interface BookingWithVehicle extends Booking {
    vehicle?: {
        id: string;
        title: string;
        brand: string;
        model: string;
        vehicle_type: 'car' | 'bike';
        price_per_day: number;
        location: string;
        registration_number?: string;
        images?: { id: string; image_url: string; is_primary: boolean }[];
    };
}

export interface BookingWithDetails extends BookingWithVehicle {
    renter?: {
        id: string;
        full_name: string;
        email?: string;
        phone?: string;
    };
    owner?: {
        id: string;
        full_name: string;
        phone?: string;
    };
}

export interface CreateBookingRequest {
    vehicle_id: string;
    owner_id: string;
    start_date: string;
    end_date: string;
    total_amount: number;
}

// Cancellation request
export interface CancelBookingRequest {
    booking_id: string;
    cancelled_by: 'renter' | 'owner';
    reason?: string;
}

// Refund calculation result
export interface RefundCalculation {
    eligible: boolean;
    refund_percentage: number;
    refund_amount: number;
    reason: string;
}

// Platform commission rate (10%)
export const PLATFORM_COMMISSION_RATE = 0.10;
