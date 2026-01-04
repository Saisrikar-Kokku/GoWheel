'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import RideInspectionUpload from './RideInspectionUpload';
import RideOTPVerification from './RideOTPVerification';
import RideOTPGenerator from './RideOTPGenerator';
import type { RideStatus } from '@/types/booking';

type UserRole = 'owner' | 'renter';

interface RideVerificationPanelProps {
    bookingId: string;
    userRole: UserRole;
    rideStatus: RideStatus;
    vehicleRegistration: string;
    renterName?: string;
    onStatusChange?: (newStatus: RideStatus) => void;
}

interface InspectionStatus {
    complete: boolean;
    uploadedPositions: string[];
    requiredPositions: string[];
}

const RIDE_STEPS = {
    pending: {
        renter: 'Upload inspection photos and wait for OTP from owner',
        owner: 'Review inspection photos and generate start OTP',
    },
    photos_uploaded: {
        renter: 'Photos uploaded. Wait for OTP from owner.',
        owner: 'Review inspection photos and generate start OTP',
    },
    started: {
        renter: 'Ride in progress. Upload return photos when returning.',
        owner: 'Ride in progress. Generate end OTP when vehicle is returned.',
    },
    completed: {
        renter: 'Ride completed successfully.',
        owner: 'Ride completed successfully.',
    },
};

export default function RideVerificationPanel({
    bookingId,
    userRole,
    rideStatus,
    vehicleRegistration,
    renterName = 'Renter',
    onStatusChange,
}: RideVerificationPanelProps) {
    const [inspectionStatus, setInspectionStatus] = useState<InspectionStatus>({
        complete: false,
        uploadedPositions: [],
        requiredPositions: ['front', 'left', 'right'],
    });
    const [loading, setLoading] = useState(true);

    // Fetch inspection status
    useEffect(() => {
        const fetchInspectionStatus = async () => {
            try {
                const inspectionType = rideStatus === 'pending' ? 'pre_ride' : 'post_ride';
                const response = await fetch(`/api/ride/inspection/${bookingId}?type=${inspectionType}`);
                
                if (response.ok) {
                    const data = await response.json();
                    const uploadedPositions = data.images?.map((img: { position: string }) => img.position) || [];
                    setInspectionStatus({
                        complete: data.complete || false,
                        uploadedPositions,
                        requiredPositions: ['front', 'left', 'right'],
                    });
                }
            } catch (error) {
                console.error('Error fetching inspection status:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchInspectionStatus();
    }, [bookingId, rideStatus]);

    const handleInspectionComplete = (isComplete: boolean) => {
        setInspectionStatus(prev => ({ ...prev, complete: isComplete }));
    };

    const handleOTPVerified = (success: boolean) => {
        if (success) {
            const newStatus: RideStatus = rideStatus === 'pending' || rideStatus === 'photos_uploaded' ? 'started' : 'completed';
            onStatusChange?.(newStatus);
        }
    };

    const getStatusBadge = () => {
        switch (rideStatus) {
            case 'pending':
            case 'photos_uploaded':
                return <Badge variant="secondary" className="bg-amber-500/10 text-amber-400 border-amber-500/20">Awaiting Start</Badge>;
            case 'started':
                return <Badge variant="secondary" className="bg-blue-500/10 text-blue-400 border-blue-500/20">Ride In Progress</Badge>;
            case 'completed':
                return <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Completed</Badge>;
        }
    };

    const getStepProgress = () => {
        if (rideStatus === 'completed') return 100;
        if (rideStatus === 'started') return 66;
        if (inspectionStatus.complete) return 40;
        return 10;
    };

    if (loading) {
        return (
            <Card className="bg-card/50 border-border/50">
                <CardContent className="py-8">
                    <div className="flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="bg-card/50 border-border/50 overflow-hidden">
            {/* Header */}
            <CardHeader className="bg-gradient-to-br from-primary/5 to-emerald-500/5 border-b border-border/50">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            Ride Verification
                        </CardTitle>
                        <CardDescription className="mt-1">
                            Vehicle: <span className="font-medium text-foreground">{vehicleRegistration}</span>
                        </CardDescription>
                    </div>
                    {getStatusBadge()}
                </div>

                {/* Progress bar */}
                <div className="mt-4">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Progress</span>
                        <span>{getStepProgress()}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-gradient-to-r from-primary to-emerald-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${getStepProgress()}%` }}
                            transition={{ duration: 0.5 }}
                        />
                    </div>
                </div>
            </CardHeader>

            <CardContent className="pt-6 space-y-6">
                {/* Current step indicator */}
                <div className="bg-muted/30 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">Next step: </span>
                        {RIDE_STEPS[rideStatus][userRole]}
                    </p>
                </div>

                {/* RIDE COMPLETED STATE */}
                {rideStatus === 'completed' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-8"
                    >
                        <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold mb-2">Ride Completed Successfully</h3>
                        <p className="text-sm text-muted-foreground">
                            Thank you for using GoWheel. Your security deposit will be processed according to the booking terms.
                        </p>
                    </motion.div>
                )}

                {/* PENDING STATE */}
                {rideStatus === 'pending' && (
                    <div className="space-y-6">
                        {/* Step 1: Pre-ride inspection (Renter uploads) */}
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                    inspectionStatus.complete 
                                        ? 'bg-emerald-500 text-white' 
                                        : 'bg-primary text-white'
                                }`}>
                                    {inspectionStatus.complete ? '✓' : '1'}
                                </div>
                                <h3 className="font-medium">Pre-Ride Inspection Photos</h3>
                                {inspectionStatus.complete && (
                                    <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400 text-xs">
                                        Complete
                                    </Badge>
                                )}
                            </div>

                            {userRole === 'renter' ? (
                                <RideInspectionUpload
                                    bookingId={bookingId}
                                    inspectionType="pre_ride"
                                    existingImages={[]}
                                    onUploadComplete={handleInspectionComplete}
                                />
                            ) : (
                                <Card className="bg-muted/20 border-border/30">
                                    <CardContent className="py-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-3 h-3 rounded-full ${
                                                inspectionStatus.complete ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
                                            }`} />
                                            <p className="text-sm">
                                                {inspectionStatus.complete 
                                                    ? `${renterName} has uploaded inspection photos`
                                                    : `Waiting for ${renterName} to upload inspection photos...`
                                                }
                                            </p>
                                        </div>
                                        {inspectionStatus.uploadedPositions.length > 0 && (
                                            <div className="mt-2 flex gap-2 flex-wrap">
                                                {inspectionStatus.uploadedPositions.map(pos => (
                                                    <Badge key={pos} variant="outline" className="text-xs capitalize">
                                                        {pos}
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        <Separator className="my-4" />

                        {/* Step 2: OTP Generation/Verification */}
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                    inspectionStatus.complete 
                                        ? 'bg-primary text-white' 
                                        : 'bg-muted text-muted-foreground'
                                }`}>
                                    2
                                </div>
                                <h3 className={`font-medium ${!inspectionStatus.complete ? 'text-muted-foreground' : ''}`}>
                                    Start Ride Verification
                                </h3>
                            </div>

                            {userRole === 'owner' ? (
                                <RideOTPGenerator
                                    bookingId={bookingId}
                                    type="start"
                                    disabled={!inspectionStatus.complete}
                                />
                            ) : (
                                <RideOTPVerification
                                    bookingId={bookingId}
                                    type="start"
                                    disabled={!inspectionStatus.complete}
                                    onVerified={handleOTPVerified}
                                />
                            )}
                        </div>
                    </div>
                )}

                {/* STARTED STATE */}
                {rideStatus === 'started' && (
                    <div className="space-y-6">
                        {/* Ride started badge */}
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                </div>
                                <div>
                                    <h4 className="font-medium text-blue-400">Ride In Progress</h4>
                                    <p className="text-sm text-muted-foreground">
                                        Complete the ride verification when returning the vehicle
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Post-ride inspection (Renter uploads) */}
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                    inspectionStatus.complete 
                                        ? 'bg-emerald-500 text-white' 
                                        : 'bg-primary text-white'
                                }`}>
                                    {inspectionStatus.complete ? '✓' : '1'}
                                </div>
                                <h3 className="font-medium">Post-Ride Inspection Photos</h3>
                            </div>

                            {userRole === 'renter' ? (
                                <RideInspectionUpload
                                    bookingId={bookingId}
                                    inspectionType="post_ride"
                                    existingImages={[]}
                                    onUploadComplete={handleInspectionComplete}
                                />
                            ) : (
                                <Card className="bg-muted/20 border-border/30">
                                    <CardContent className="py-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-3 h-3 rounded-full ${
                                                inspectionStatus.complete ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
                                            }`} />
                                            <p className="text-sm">
                                                {inspectionStatus.complete 
                                                    ? `${renterName} has uploaded return inspection photos`
                                                    : `Waiting for ${renterName} to upload return inspection photos...`
                                                }
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        <Separator className="my-4" />

                        {/* End OTP */}
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                    inspectionStatus.complete 
                                        ? 'bg-primary text-white' 
                                        : 'bg-muted text-muted-foreground'
                                }`}>
                                    2
                                </div>
                                <h3 className={`font-medium ${!inspectionStatus.complete ? 'text-muted-foreground' : ''}`}>
                                    End Ride Verification
                                </h3>
                            </div>

                            {userRole === 'owner' ? (
                                <RideOTPGenerator
                                    bookingId={bookingId}
                                    type="end"
                                    disabled={!inspectionStatus.complete}
                                />
                            ) : (
                                <RideOTPVerification
                                    bookingId={bookingId}
                                    type="end"
                                    disabled={!inspectionStatus.complete}
                                    onVerified={handleOTPVerified}
                                />
                            )}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
