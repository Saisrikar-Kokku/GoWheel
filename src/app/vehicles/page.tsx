'use client';

import { useState, useCallback, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import PageWrapper from '@/components/layout/PageWrapper';
import VehicleBrowseCard from '@/components/vehicles/VehicleBrowseCard';
import VehicleFilterPanel from '@/components/vehicles/VehicleFilterPanel';
import { useVehicles } from '@/hooks/useVehicles';
import { getVehiclePriceRange, VehicleFilters } from '@/services/vehicleService';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.05 },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.3 },
    },
};

// Smaller page size for faster initial load
const PAGE_SIZE = 9;

function VehicleBrowseContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [priceRange, setPriceRange] = useState({ min: 0, max: 500 });
    const [filtersOpen, setFiltersOpen] = useState(false);

    // Parse filters from URL
    const getFiltersFromUrl = useCallback((): VehicleFilters => {
        return {
            type: searchParams.get('type') as 'car' | 'bike' | undefined,
            minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
            maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
            location: searchParams.get('location') || undefined,
            sort: (searchParams.get('sort') as VehicleFilters['sort']) || 'newest',
            page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
            limit: PAGE_SIZE, // Use smaller page size
        };
    }, [searchParams]);

    const filters = getFiltersFromUrl();

    // Use SWR hook for cached data fetching
    const { vehicles, total, totalPages, page, isLoading, isValidating, error } = useVehicles(filters);

    // Update URL when filters change
    const updateUrl = useCallback((newFilters: VehicleFilters) => {
        const params = new URLSearchParams();
        if (newFilters.type) params.set('type', newFilters.type);
        if (newFilters.minPrice) params.set('minPrice', String(newFilters.minPrice));
        if (newFilters.maxPrice) params.set('maxPrice', String(newFilters.maxPrice));
        if (newFilters.location) params.set('location', newFilters.location);
        if (newFilters.sort && newFilters.sort !== 'newest') params.set('sort', newFilters.sort);
        if (newFilters.page && newFilters.page > 1) params.set('page', String(newFilters.page));

        const queryString = params.toString();
        router.push(queryString ? `/vehicles?${queryString}` : '/vehicles', { scroll: false });
    }, [router]);

    // Fetch price range on mount (cached)
    useEffect(() => {
        getVehiclePriceRange().then(setPriceRange).catch(console.error);
    }, []);

    const handleFiltersChange = (newFilters: VehicleFilters) => {
        updateUrl(newFilters);
    };

    const handlePageChange = (newPage: number) => {
        handleFiltersChange({ ...filters, page: newPage });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <PageWrapper className="container mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-12">
            {/* Hero Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-card to-card border border-primary/20 p-6 sm:p-8 mb-6">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -mr-32 -mt-32" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl -ml-24 -mb-24" />
                    <div className="relative">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-emerald-500 flex items-center justify-center text-white shadow-lg shadow-primary/30">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-bold">Browse Vehicles</h1>
                                <p className="text-muted-foreground text-sm sm:text-base">
                                    Find the perfect car or bike for your next adventure
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Stats */}
                {!isLoading && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4"
                    >
                        <Card className="bg-card/50 border-border/50">
                            <CardContent className="p-3 sm:p-4 text-center">
                                <div className="text-xl sm:text-2xl font-bold gradient-text">{total}</div>
                                <div className="text-xs sm:text-sm text-muted-foreground">Available</div>
                            </CardContent>
                        </Card>
                        <Card className="bg-card/50 border-border/50">
                            <CardContent className="p-3 sm:p-4 text-center">
                                <div className="text-xl sm:text-2xl font-bold text-blue-400">🚗</div>
                                <div className="text-xs sm:text-sm text-muted-foreground">Cars</div>
                            </CardContent>
                        </Card>
                        <Card className="bg-card/50 border-border/50 col-span-2 sm:col-span-1">
                            <CardContent className="p-3 sm:p-4 text-center">
                                <div className="text-xl sm:text-2xl font-bold text-purple-400">🏍️</div>
                                <div className="text-xs sm:text-sm text-muted-foreground">Bikes</div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </motion.div>

            <div className="lg:grid lg:grid-cols-[280px_1fr] lg:gap-8">
                {/* Filters Sidebar */}
                <div className="lg:sticky lg:top-24 lg:self-start">
                    <VehicleFilterPanel
                        filters={filters}
                        onFiltersChange={handleFiltersChange}
                        priceRange={priceRange}
                        totalResults={total}
                        isOpen={filtersOpen}
                        onToggle={() => setFiltersOpen(!filtersOpen)}
                    />
                </div>

                {/* Vehicle Grid */}
                <div>
                    {/* Loading indicator for background revalidation */}
                    {isValidating && !isLoading && (
                        <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
                            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            Updating...
                        </div>
                    )}

                    {isLoading ? (
                        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <Card key={i} className="bg-card/50 border-border/50 overflow-hidden">
                                    <Skeleton className="aspect-[4/3] w-full" />
                                    <CardContent className="p-4 space-y-2">
                                        <Skeleton className="h-5 w-3/4" />
                                        <Skeleton className="h-4 w-1/2" />
                                        <Skeleton className="h-4 w-2/3" />
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : error ? (
                        <Card className="bg-red-500/10 border-red-500/20">
                            <CardContent className="p-8 text-center">
                                <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-semibold text-red-400 mb-2">Failed to Load Vehicles</h3>
                                <p className="text-sm text-red-400/80 mb-4">Please try again</p>
                                <Button variant="outline" onClick={() => window.location.reload()} className="border-red-500/30">
                                    Try Again
                                </Button>
                            </CardContent>
                        </Card>
                    ) : vehicles.length === 0 ? (
                        <Card className="bg-card/50 border-border/50 border-dashed">
                            <CardContent className="py-16 text-center">
                                <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-muted/50 to-muted/30 flex items-center justify-center mb-6">
                                    <svg className="w-10 h-10 text-muted-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-semibold mb-2">No vehicles found</h3>
                                <p className="text-muted-foreground max-w-md mx-auto mb-6">
                                    We couldn&apos;t find any vehicles matching your criteria. Try adjusting your filters or browse all available vehicles.
                                </p>
                                <Button
                                    variant="outline"
                                    onClick={() => handleFiltersChange({ sort: 'newest', page: 1 })}
                                >
                                    Clear Filters
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <>
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={page}
                                    variants={containerVariants}
                                    initial="hidden"
                                    animate="visible"
                                    className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6"
                                >
                                    {vehicles.map((vehicle, index) => (
                                        <motion.div key={vehicle.id} variants={itemVariants}>
                                            <VehicleBrowseCard vehicle={vehicle} priority={index < 3} />
                                        </motion.div>
                                    ))}
                                </motion.div>
                            </AnimatePresence>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="mt-10 flex items-center justify-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        disabled={page <= 1}
                                        onClick={() => handlePageChange(page - 1)}
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                    </Button>

                                    <div className="flex items-center gap-1">
                                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                                            .filter((p) => {
                                                // Show first, last, current, and neighbors
                                                return (
                                                    p === 1 ||
                                                    p === totalPages ||
                                                    Math.abs(p - page) <= 1
                                                );
                                            })
                                            .map((p, index, arr) => (
                                                <span key={p}>
                                                    {index > 0 && arr[index - 1] !== p - 1 && (
                                                        <span className="px-2 text-muted-foreground">...</span>
                                                    )}
                                                    <Button
                                                        variant={p === page ? 'default' : 'outline'}
                                                        size="sm"
                                                        onClick={() => handlePageChange(p)}
                                                        className={p === page ? 'bg-primary' : ''}
                                                    >
                                                        {p}
                                                    </Button>
                                                </span>
                                            ))}
                                    </div>

                                    <Button
                                        variant="outline"
                                        size="icon"
                                        disabled={page >= totalPages}
                                        onClick={() => handlePageChange(page + 1)}
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </PageWrapper>
    );
}

export default function VehicleBrowsePage() {
    return (
        <Suspense fallback={
            <PageWrapper className="container mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-12">
                <Skeleton className="h-10 w-64 mb-2" />
                <Skeleton className="h-5 w-96 mb-8" />
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <Card key={i} className="bg-card/50 border-border/50 overflow-hidden">
                            <Skeleton className="aspect-[4/3] w-full" />
                            <CardContent className="p-4 space-y-2">
                                <Skeleton className="h-5 w-3/4" />
                                <Skeleton className="h-4 w-1/2" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </PageWrapper>
        }>
            <VehicleBrowseContent />
        </Suspense>
    );
}
