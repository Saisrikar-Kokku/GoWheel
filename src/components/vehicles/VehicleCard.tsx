'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { VehicleWithImages, VehicleStatus, vehicleStatusConfig } from '@/types/vehicle';
import { deleteVehicle, toggleVehicleStatus } from '@/services/vehicleService';

interface VehicleCardProps {
    vehicle: VehicleWithImages;
    onDelete: (id: string) => void;
}

export default function VehicleCard({ vehicle, onDelete }: VehicleCardProps) {
    const [isActive, setIsActive] = useState(vehicle.is_active);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [isTogglingStatus, setIsTogglingStatus] = useState(false);

    const primaryImage = vehicle.images.find((img) => img.is_primary) || vehicle.images[0];

    const handleToggleStatus = async () => {
        setIsTogglingStatus(true);
        try {
            await toggleVehicleStatus(vehicle.id, !isActive);
            setIsActive(!isActive);
        } catch (error) {
            console.error('Failed to toggle status:', error);
        } finally {
            setIsTogglingStatus(false);
        }
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            await deleteVehicle(vehicle.id);
            onDelete(vehicle.id);
            setShowDeleteDialog(false);
        } catch (error) {
            console.error('Failed to delete vehicle:', error);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <TooltipProvider>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
            >
                <Card className="bg-card/50 border-border/50 overflow-hidden hover:border-primary/30 transition-all duration-300 group card-hover">
                    {/* Image Section */}
                    <div className="relative h-48 bg-gradient-to-br from-muted to-muted/50 overflow-hidden">
                        {primaryImage ? (
                            <Image
                                src={primaryImage.image_url}
                                alt={vehicle.title}
                                fill
                                className="object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                <div className="text-center">
                                    <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <span className="text-xs">No image</span>
                                </div>
                            </div>
                        )}

                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                        {/* Status Badge */}
                        <div className="absolute top-3 left-3 z-10 flex flex-col gap-1">
                            <Badge
                                variant="secondary"
                                className={`backdrop-blur-sm ${isActive
                                    ? 'bg-emerald-500/90 text-white border-emerald-400/50'
                                    : 'bg-muted/90 text-muted-foreground border-muted'
                                    }`}
                            >
                                <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${isActive ? 'bg-white animate-pulse' : 'bg-muted-foreground'}`} />
                                {isActive ? 'Active' : 'Inactive'}
                            </Badge>
                            {/* KYC Status Badge */}
                            {vehicle.vehicle_status && vehicle.vehicle_status !== 'approved' && vehicleStatusConfig[vehicle.vehicle_status as VehicleStatus] && (
                                <Badge className={`backdrop-blur-sm text-xs ${vehicleStatusConfig[vehicle.vehicle_status as VehicleStatus]?.className || ''}`}>
                                    {vehicleStatusConfig[vehicle.vehicle_status as VehicleStatus]?.icon}{' '}
                                    {vehicleStatusConfig[vehicle.vehicle_status as VehicleStatus]?.label || vehicle.vehicle_status}
                                </Badge>
                            )}
                        </div>

                        {/* Type Badge */}
                        <div className="absolute top-3 right-3 z-10">
                            <Badge variant="outline" className="bg-background/80 backdrop-blur-sm capitalize border-white/20">
                                {vehicle.vehicle_type === 'car' ? '🚗' : '🏍️'} {vehicle.vehicle_type}
                            </Badge>
                        </div>

                        {/* Image Count */}
                        {vehicle.images.length > 0 && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="absolute bottom-3 right-3 z-10 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs text-white flex items-center gap-1.5 cursor-default">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        {vehicle.images.length}
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{vehicle.images.length} photo{vehicle.images.length > 1 ? 's' : ''}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}

                        {/* Quick Edit on Hover */}
                        <Link
                            href={`/dashboard/owner/vehicles/${vehicle.id}/edit`}
                            className="absolute bottom-3 left-3 z-10 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0"
                        >
                            <Button size="sm" className="bg-white/90 text-black hover:bg-white shadow-lg">
                                <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Quick Edit
                            </Button>
                        </Link>
                    </div>

                    <CardContent className="p-5">
                        {/* Title & Price */}
                        <div className="flex items-start justify-between gap-2 mb-3">
                            <div className="min-w-0 flex-1">
                                <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">
                                    {vehicle.title}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    {vehicle.brand} {vehicle.model} • {vehicle.year}
                                </p>
                            </div>
                            <div className="text-right flex-shrink-0">
                                <div className="text-xl font-bold gradient-text">₹{vehicle.price_per_day}</div>
                                <div className="text-xs text-muted-foreground">per day</div>
                            </div>
                        </div>

                        {/* Location */}
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4">
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="truncate">{vehicle.location}</span>
                        </div>

                        {/* Status Toggle - Only show for approved vehicles */}
                        {vehicle.vehicle_status === 'approved' ? (
                            <div className="flex items-center justify-between py-3 px-3 rounded-lg bg-muted/30 border border-border/50 mb-4">
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-400' : 'bg-muted-foreground'}`} />
                                    <span className="text-sm">Listing {isActive ? 'visible' : 'hidden'}</span>
                                </div>
                                <Switch
                                    checked={isActive}
                                    onCheckedChange={handleToggleStatus}
                                    disabled={isTogglingStatus}
                                    className="data-[state=checked]:bg-emerald-500"
                                />
                            </div>
                        ) : (
                            <div className="py-3 px-3 rounded-lg bg-amber-500/10 border border-amber-500/30 mb-4">
                                <div className="flex items-center gap-2 text-amber-400 text-sm">
                                    <span>⚠️</span>
                                    <span>
                                        {(!vehicle.vehicle_status || vehicle.vehicle_status === 'draft') && 'Submit documents for verification'}
                                        {vehicle.vehicle_status === 'pending_verification' && 'Awaiting admin approval'}
                                        {vehicle.vehicle_status === 'rejected' && `Rejected: ${vehicle.rejection_reason || 'Contact support'}`}
                                    </span>
                                </div>
                                {(!vehicle.vehicle_status || vehicle.vehicle_status === 'draft' || vehicle.vehicle_status === 'rejected') && (
                                    <Link href={`/dashboard/owner/vehicles/${vehicle.id}/kyc`}>
                                        <Button size="sm" variant="outline" className="mt-2 w-full border-amber-500/30 text-amber-400 hover:bg-amber-500/10">
                                            📄 Upload KYC Documents
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2">
                            <Link href={`/dashboard/owner/vehicles/${vehicle.id}/edit`} className="flex-1">
                                <Button variant="outline" className="w-full group/btn">
                                    <svg className="w-4 h-4 mr-2 transition-transform group-hover/btn:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    Edit
                                </Button>
                            </Link>

                            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <DialogTrigger asChild>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="text-red-400 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/30"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </Button>
                                        </DialogTrigger>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Delete vehicle</p>
                                    </TooltipContent>
                                </Tooltip>
                                <DialogContent className="sm:max-w-md">
                                    <DialogHeader>
                                        <DialogTitle className="flex items-center gap-2">
                                            <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                                                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                </svg>
                                            </div>
                                            Delete Vehicle
                                        </DialogTitle>
                                        <DialogDescription className="pt-2">
                                            Are you sure you want to delete <strong>&quot;{vehicle.title}&quot;</strong>? This will also remove all associated images. This action cannot be undone.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <DialogFooter className="gap-2 sm:gap-0">
                                        <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                                            Cancel
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            onClick={handleDelete}
                                            disabled={isDeleting}
                                            className="gap-2"
                                        >
                                            {isDeleting ? (
                                                <>
                                                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                    </svg>
                                                    Deleting...
                                                </>
                                            ) : (
                                                <>
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                    Delete
                                                </>
                                            )}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </TooltipProvider>
    );
}
