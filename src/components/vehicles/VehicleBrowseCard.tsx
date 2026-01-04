'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { VehicleWithImages } from '@/types/vehicle';

interface VehicleBrowseCardProps {
    vehicle: VehicleWithImages;
    priority?: boolean;
}

export default function VehicleBrowseCard({ vehicle, priority = false }: VehicleBrowseCardProps) {
    const primaryImage = vehicle.images.find((img) => img.is_primary) || vehicle.images[0];
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);

    return (
        <TooltipProvider>
            <Link href={`/vehicles/${vehicle.id}`}>
                <motion.div
                    whileHover={{ y: -6, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                    <Card className="bg-card/50 border-border/50 overflow-hidden hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 group h-full">
                        {/* Image Container */}
                        <div className="relative aspect-[4/3] bg-gradient-to-br from-muted to-muted/50 overflow-hidden">
                            {/* Shimmer Loading State */}
                            {!imageLoaded && primaryImage && !imageError && (
                                <div className="absolute inset-0 bg-gradient-to-r from-muted via-muted/50 to-muted animate-pulse">
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
                                </div>
                            )}

                            {primaryImage && !imageError ? (
                                <>
                                    <Image
                                        src={primaryImage.image_url}
                                        alt={vehicle.title}
                                        fill
                                        priority={priority}
                                        loading={priority ? 'eager' : 'lazy'}
                                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                        className={`object-cover transition-all duration-700 group-hover:scale-110 ${imageLoaded ? 'opacity-100' : 'opacity-0'
                                            }`}
                                        onLoad={() => setImageLoaded(true)}
                                        onError={() => setImageError(true)}
                                    />
                                    {/* Gradient overlay */}
                                    <div className={`absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent transition-opacity duration-300 ${imageLoaded ? 'opacity-60 group-hover:opacity-80' : 'opacity-0'
                                        }`} />
                                </>
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                    <svg className="w-16 h-16 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                            )}

                            {/* Type badge */}
                            <div className="absolute top-3 left-3 z-10">
                                <Badge
                                    variant="secondary"
                                    className="bg-background/95 backdrop-blur-md capitalize shadow-lg border-0 gap-1.5 px-2.5 py-1"
                                >
                                    {vehicle.vehicle_type === 'car' ? '🚗' : '🏍️'} {vehicle.vehicle_type}
                                </Badge>
                            </div>

                            {/* Favorite button placeholder */}
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-background/80 backdrop-blur-md flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                onClick={(e) => {
                                    e.preventDefault();
                                    // Favorite functionality coming later
                                }}
                            >
                                <svg className="w-5 h-5 text-muted-foreground hover:text-red-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                            </motion.button>

                            {/* Price badge */}
                            <div className="absolute bottom-3 right-3 z-10">
                                <div className="bg-gradient-to-r from-primary to-emerald-500 px-3.5 py-2 rounded-xl shadow-lg shadow-primary/30">
                                    <span className="text-lg font-bold text-white">₹{vehicle.price_per_day}</span>
                                    <span className="text-xs text-white/80 ml-0.5">/hr</span>
                                </div>
                            </div>

                            {/* Image count tooltip */}
                            {vehicle.images.length > 1 && (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="absolute bottom-3 left-3 z-10 bg-black/70 backdrop-blur-sm px-2.5 py-1.5 rounded-lg text-xs text-white flex items-center gap-1.5 cursor-help">
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            {vehicle.images.length}
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{vehicle.images.length} photos</p>
                                    </TooltipContent>
                                </Tooltip>
                            )}

                            {/* View button on hover */}
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    whileHover={{ scale: 1 }}
                                    className="bg-white/95 backdrop-blur-sm px-5 py-2.5 rounded-full flex items-center gap-2 shadow-2xl"
                                >
                                    <span className="font-semibold text-gray-900 text-sm">View Details</span>
                                    <svg className="w-4 h-4 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </motion.div>
                            </div>
                        </div>

                        <CardContent className="p-4">
                            {/* Title with availability indicator */}
                            <div className="flex items-start justify-between gap-2 mb-1.5">
                                <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">
                                    {vehicle.title}
                                </h3>
                            </div>

                            {/* Brand & Model & Year */}
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-sm text-muted-foreground">
                                    {vehicle.brand} {vehicle.model}
                                </span>
                                <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                                <span className="text-sm text-muted-foreground">{vehicle.year}</span>
                            </div>

                            {/* Location */}
                            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 rounded-lg px-3 py-2">
                                <svg className="w-4 h-4 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span className="truncate">{vehicle.location}</span>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </Link>
        </TooltipProvider>
    );
}
