import { supabase } from './supabase';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://gowheel.vercel.app';

/**
 * Call the website's Next.js API route with the user's auth token.
 * This allows the mobile app to reuse the website's backend logic (OTP, email, etc.)
 * rather than maintaining separate Edge Functions.
 */
export async function apiCall<T>(
    endpoint: string,
    options: {
        method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
        body?: Record<string, unknown>;
    } = {}
): Promise<T> {
    const { method = 'POST', body } = options;

    // Get current session token from Supabase Auth
    const { data: { session } } = await supabase.auth.getSession();
    const accessToken = session?.access_token;

    if (!accessToken) {
        throw new Error('Not authenticated. Please sign in.');
    }

    // Call /api/ride/... by default for the ride API helpers
    // If the endpoint starts with /, use it as absolute path from base
    const path = endpoint.startsWith('/') ? endpoint : `/api/ride/${endpoint}`;
    const url = `${API_BASE_URL}${path}`;

    console.log(`API Call: ${method} ${url}`);

    try {
        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
            },
            ...(body ? { body: JSON.stringify(body) } : {}),
        });

        if (!response.ok) {
            const text = await response.text();
            console.error(`API Error (${response.status}):`, text);
            try {
                const errorData = JSON.parse(text);
                throw new Error(errorData.error || `API error: ${response.status}`);
            } catch (e) {
                throw new Error(`API error: ${response.status} - ${text}`);
            }
        }

        return response.json();
    } catch (error) {
        console.error('API Network Error:', error);
        throw error;
    }
}

/**
 * Convenience helpers for the ride management Edge Functions
 */
export const rideApi = {
    generateStartOTP: (bookingId: string) =>
        apiCall<{ success: boolean; otp: string; expiresAt: string; message: string }>(
            'generate-start-otp', { body: { bookingId } }
        ),

    generateEndOTP: (bookingId: string) =>
        apiCall<{ success: boolean; otp: string; expiresAt: string; message: string }>(
            'generate-end-otp', { body: { bookingId } }
        ),

    verifyStartOTP: (bookingId: string, otp: string) =>
        apiCall<{ success: boolean; message: string; ride_started_at: string }>(
            'verify-start-otp', { body: { bookingId, otp } }
        ),

    verifyEndOTP: (bookingId: string, otp: string) =>
        apiCall<{ success: boolean; message: string; ride_ended_at: string; payout: any }>(
            'verify-end-otp', { body: { bookingId, otp } }
        ),

    cancelBooking: (bookingId: string, cancelledBy: 'renter' | 'owner', reason?: string) =>
        apiCall<{ success: boolean; message: string; refund: any }>(
            '/api/bookings/cancel', { body: { bookingId, cancelledBy, reason } }
        ),
};
