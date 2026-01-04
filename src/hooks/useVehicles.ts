'use client';

import useSWR from 'swr';
import { getActiveVehicles, getVehicleDetailsById, VehicleFilters, VehicleSearchResult, VehicleWithOwner } from '@/services/vehicleService';

// Global SWR configuration
export const swrConfig = {
    revalidateOnFocus: true, // Revalidate when user comes back to tab
    revalidateOnReconnect: true,
    dedupingInterval: 2000, // 2 seconds (reduced for fresher data)
    errorRetryCount: 3,
};

// Custom fetcher that handles errors properly
const vehicleFetcher = async (filters: VehicleFilters): Promise<VehicleSearchResult> => {
    return getActiveVehicles(filters);
};

const vehicleDetailsFetcher = async (id: string): Promise<VehicleWithOwner | null> => {
    return getVehicleDetailsById(id);
};

/**
 * Hook for fetching vehicles with caching
 * - Caches results to avoid refetching on page navigation
 * - Dedupes requests made within 5 seconds
 * - Automatically revalidates on window focus
 */
export function useVehicles(filters: VehicleFilters) {
    const key = ['vehicles', JSON.stringify(filters)];

    const { data, error, isLoading, isValidating, mutate } = useSWR<VehicleSearchResult>(
        key,
        () => vehicleFetcher(filters),
        {
            ...swrConfig,
            keepPreviousData: true, // Show stale data while loading new data
        }
    );

    return {
        vehicles: data?.vehicles ?? [],
        total: data?.total ?? 0,
        totalPages: data?.totalPages ?? 0,
        page: data?.page ?? 1,
        isLoading,
        isValidating,
        error,
        mutate,
    };
}

/**
 * Hook for fetching a single vehicle with caching
 */
export function useVehicle(id: string) {
    const { data, error, isLoading, mutate } = useSWR<VehicleWithOwner | null>(
        id ? ['vehicle', id] : null,
        () => vehicleDetailsFetcher(id),
        {
            ...swrConfig,
            revalidateOnFocus: false,
        }
    );

    return {
        vehicle: data,
        isLoading,
        error,
        mutate,
    };
}

/**
 * Prefetch vehicle data (for hover prefetching)
 */
export function prefetchVehicle(id: string) {
    // This triggers a fetch that will be cached
    getVehicleDetailsById(id).catch(() => { });
}
