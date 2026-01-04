'use client';

import { useState, useEffect, use, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
    type CarouselApi,
} from '@/components/ui/carousel';
import PageWrapper from '@/components/layout/PageWrapper';
import BookingRequestDialog from '@/components/bookings/BookingRequestDialog';
import SecurityDepositInfo from '@/components/vehicles/SecurityDepositInfo';
import { getVehicleDetailsById, VehicleWithOwner } from '@/services/vehicleService';

export default function VehicleDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [loading, setLoading] = useState(true);
    const [vehicle, setVehicle] = useState<VehicleWithOwner | null>(null);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [carouselApi, setCarouselApi] = useState<CarouselApi>();

    // Sync carousel with thumbnail selection
    useEffect(() => {
        if (!carouselApi) return;

        const onSelect = () => {
            setSelectedImageIndex(carouselApi.selectedScrollSnap());
        };

        carouselApi.on('select', onSelect);

        return () => {
            carouselApi.off('select', onSelect);
        };
    }, [carouselApi]);

    // Scroll carousel when thumbnail is clicked
    const handleThumbnailClick = useCallback((index: number) => {
        setSelectedImageIndex(index);
        carouselApi?.scrollTo(index);
    }, [carouselApi]);

    useEffect(() => {
        const fetchVehicle = async () => {
            try {
                const data = await getVehicleDetailsById(id);
                setVehicle(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchVehicle();
    }, [id]);

    if (loading) {
        return (
            <PageWrapper className="container mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-12">
                <div className="lg:grid lg:grid-cols-[1fr_400px] lg:gap-10">
                    <div>
                        <Skeleton className="aspect-[4/3] w-full rounded-2xl mb-4" />
                        <div className="flex gap-2">
                            {[1, 2, 3, 4].map((i) => (
                                <Skeleton key={i} className="w-20 h-20 rounded-xl" />
                            ))}
                        </div>
                    </div>
                    <div className="mt-8 lg:mt-0 space-y-4">
                        <Skeleton className="h-8 w-24" />
                        <Skeleton className="h-10 w-3/4" />
                        <Skeleton className="h-6 w-1/2" />
                        <Skeleton className="h-32 w-full rounded-xl" />
                        <Skeleton className="h-24 w-full" />
                    </div>
                </div>
            </PageWrapper>
        );
    }

    if (!vehicle) {
        return (
            <PageWrapper className="container mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-12">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                >
                    <Card className="bg-card/50 border-border/50">
                        <CardContent className="py-20 text-center">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                                className="mx-auto w-24 h-24 rounded-3xl bg-gradient-to-br from-muted/50 to-muted/30 flex items-center justify-center mb-6"
                            >
                                <svg className="w-12 h-12 text-muted-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </motion.div>
                            <h3 className="text-2xl font-bold mb-3">Vehicle Not Found</h3>
                            <p className="text-muted-foreground max-w-md mx-auto mb-8">
                                This vehicle may no longer be available or the link is incorrect.
                            </p>
                            <Link href="/vehicles">
                                <Button size="lg" className="bg-gradient-to-r from-primary to-emerald-500">
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                    </svg>
                                    Browse All Vehicles
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                </motion.div>
            </PageWrapper>
        );
    }

    const primaryImage = vehicle.images[selectedImageIndex] || vehicle.images[0];
    const memberSince = vehicle.owner?.created_at
        ? new Date(vehicle.owner.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
        : 'Unknown';

    return (
        <TooltipProvider>
            <PageWrapper className="container mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    {/* Breadcrumb */}
                    <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                        <Link href="/vehicles" className="hover:text-primary transition-colors flex items-center gap-1 group">
                            <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            All Vehicles
                        </Link>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        <span className="text-foreground font-medium truncate max-w-[200px]">{vehicle.title}</span>
                    </nav>

                    <div className="lg:grid lg:grid-cols-[1fr_420px] lg:gap-10">
                        {/* Left Column - Images */}
                        <div>
                            {/* Main Image Carousel */}
                            {vehicle.images.length > 0 ? (
                                <Carousel className="w-full mb-4" setApi={setCarouselApi}>
                                    <CarouselContent>
                                        {vehicle.images.map((image, index) => (
                                            <CarouselItem key={image.id}>
                                                <div className="relative aspect-[4/3] bg-muted rounded-2xl overflow-hidden">
                                                    <Image
                                                        src={image.image_url}
                                                        alt={`${vehicle.title} - ${index + 1}`}
                                                        fill
                                                        className="object-cover"
                                                        priority={index === 0}
                                                    />
                                                    {/* Image counter */}
                                                    <div className="absolute bottom-4 right-4 bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-lg text-sm text-white font-medium">
                                                        {index + 1} / {vehicle.images.length}
                                                    </div>
                                                </div>
                                            </CarouselItem>
                                        ))}
                                    </CarouselContent>
                                    {vehicle.images.length > 1 && (
                                        <>
                                            <CarouselPrevious className="-left-4 lg:-left-5" />
                                            <CarouselNext className="-right-4 lg:-right-5" />
                                        </>
                                    )}
                                </Carousel>
                            ) : (
                                <div className="relative aspect-[4/3] bg-muted rounded-2xl flex items-center justify-center mb-4">
                                    <svg className="w-20 h-20 text-muted-foreground/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                            )}

                            {/* Thumbnails */}
                            {vehicle.images.length > 1 && (
                                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                    {vehicle.images.map((image, index) => (
                                        <motion.button
                                            key={image.id}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => handleThumbnailClick(index)}
                                            className={`relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 ring-2 transition-all ${index === selectedImageIndex
                                                ? 'ring-primary ring-offset-2 ring-offset-background'
                                                : 'ring-transparent hover:ring-border'
                                                }`}
                                        >
                                            <Image
                                                src={image.image_url}
                                                alt={`${vehicle.title} - ${index + 1}`}
                                                fill
                                                className="object-cover"
                                            />
                                        </motion.button>
                                    ))}
                                </div>
                            )}

                            {/* Description - Mobile */}
                            <div className="lg:hidden mt-8">
                                <Card className="bg-card/50 border-border/50">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            About this vehicle
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
                                            {vehicle.description || 'No description provided by the owner.'}
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>

                        {/* Right Column - Details */}
                        <div className="mt-8 lg:mt-0">
                            {/* Type & Actions */}
                            <div className="flex items-center justify-between mb-4">
                                <Badge
                                    variant="secondary"
                                    className="bg-primary/10 text-primary border-primary/20 capitalize text-sm px-3 py-1.5"
                                >
                                    {vehicle.vehicle_type === 'car' ? '🚗' : '🏍️'} {vehicle.vehicle_type}
                                </Badge>
                                <div className="flex items-center gap-2">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="outline" size="icon" className="h-9 w-9">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                                </svg>
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Save to favorites</TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="outline" size="icon" className="h-9 w-9">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                                </svg>
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Share</TooltipContent>
                                    </Tooltip>
                                </div>
                            </div>

                            {/* Title */}
                            <h1 className="text-2xl sm:text-3xl font-bold mb-2">{vehicle.title}</h1>

                            {/* Brand & Model */}
                            <p className="text-lg text-muted-foreground mb-5">
                                {vehicle.brand} {vehicle.model} • {vehicle.year}
                            </p>

                            {/* Price Card */}
                            <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20 mb-6 overflow-hidden">
                                <CardContent className="p-6 relative">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16" />
                                    <div className="relative">
                                        <p className="text-sm text-muted-foreground mb-1">Price per hour</p>
                                        <div className="flex items-baseline gap-1 mb-3">
                                            <span className="text-4xl font-bold gradient-text">₹{vehicle.price_per_day}</span>
                                            <span className="text-muted-foreground">/hr</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-emerald-400">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            Free cancellation up to 24 hours before
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Location */}
                            <Card className="bg-card/50 border-border/50 mb-6">
                                <CardContent className="p-4 flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                        <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Pickup Location</p>
                                        <p className="font-semibold">{vehicle.location}</p>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Owner Info */}
                            {vehicle.owner && (
                                <Card className="bg-card/50 border-border/50 mb-6">
                                    <CardContent className="p-4">
                                        <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wider">Hosted by</p>
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-emerald-500 flex items-center justify-center text-xl font-bold text-white shadow-lg shadow-primary/30">
                                                {vehicle.owner.full_name?.charAt(0).toUpperCase() || '?'}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-semibold text-lg">{vehicle.owner.full_name}</p>
                                                <p className="text-sm text-muted-foreground">Member since {memberSince}</p>
                                            </div>
                                            <Badge variant="outline" className="text-emerald-400 border-emerald-400/30 bg-emerald-400/10">
                                                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                                Verified
                                            </Badge>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Security Deposit Info */}
                            <SecurityDepositInfo
                                securityDepositText={vehicle.security_deposit_text}
                                variant="inline"
                                className="mb-6"
                            />

                            {/* CTA Button */}
                            <BookingRequestDialog
                                vehicleId={vehicle.id}
                                ownerId={vehicle.owner_id}
                                vehicleTitle={vehicle.title}
                                pricePerDay={vehicle.price_per_day}
                            >
                                <Button
                                    size="lg"
                                    className="w-full h-14 text-lg bg-gradient-to-r from-primary to-emerald-500 hover:from-primary/90 hover:to-emerald-500/90 text-white shadow-xl shadow-primary/30 transition-all hover:shadow-primary/40 hover:scale-[1.02]"
                                >
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    Request to Book
                                </Button>
                            </BookingRequestDialog>
                            <p className="text-xs text-center text-muted-foreground mt-3">
                                🔒 You won&apos;t be charged yet
                            </p>

                            {/* Description - Desktop */}
                            <div className="hidden lg:block mt-8">
                                <Card className="bg-card/50 border-border/50">
                                    <CardHeader className="pb-3 border-b border-border/50">
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            About this vehicle
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-4">
                                        <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
                                            {vehicle.description || 'No description provided by the owner.'}
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </div>

                    {/* Vehicle Specs */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="mt-12"
                    >
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                            </svg>
                            Vehicle Specifications
                        </h2>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {[
                                { label: 'Type', value: vehicle.vehicle_type, icon: '🚗', color: 'blue' },
                                { label: 'Brand', value: vehicle.brand, icon: '🏷️', color: 'purple' },
                                { label: 'Model', value: vehicle.model, icon: '✨', color: 'emerald' },
                                { label: 'Year', value: vehicle.year, icon: '📅', color: 'amber' },
                            ].map((spec, index) => (
                                <motion.div
                                    key={spec.label}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 * index }}
                                >
                                    <Card className="bg-card/50 border-border/50 hover:border-primary/30 transition-colors group">
                                        <CardContent className="p-5 flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-xl bg-${spec.color}-500/10 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform`}>
                                                {spec.icon}
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground">{spec.label}</p>
                                                <p className="font-semibold capitalize">{spec.value}</p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </motion.div>
            </PageWrapper>
        </TooltipProvider>
    );
}
