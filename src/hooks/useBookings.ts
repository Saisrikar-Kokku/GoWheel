'use client';

import useSWR from 'swr';
import { getRenterBookings, getOwnerBookingRequests } from '@/services/bookingService';
import { BookingWithDetails } from '@/types/booking';

// SWR configuration for bookings
const bookingSwrConfig = {
    revalidateOnFocus: true, // Revalidate when user focuses back
    revalidateOnReconnect: true,
    dedupingInterval: 3000, // 3 seconds
    errorRetryCount: 2,
};

/**
 * Hook for fetching renter bookings with caching
 */
export function useRenterBookings() {
    const { data, error, isLoading, isValidating, mutate } = useSWR<BookingWithDetails[]>(
        'renterBookings',
        getRenterBookings,
        {
            ...bookingSwrConfig,
            fallbackData: [], // Show empty array while loading
        }
    );

    return {
        bookings: data ?? [],
        isLoading,
        isValidating,
        error,
        refresh: mutate,
    };
}

/**
 * Hook for fetching owner bookings with caching
 */
export function useOwnerBookings() {
    const { data, error, isLoading, isValidating, mutate } = useSWR<BookingWithDetails[]>(
        'ownerBookings',
        getOwnerBookingRequests,
        {
            ...bookingSwrConfig,
            fallbackData: [],
        }
    );

    return {
        bookings: data ?? [],
        isLoading,
        isValidating,
        error,
        refresh: mutate,
    };
}
