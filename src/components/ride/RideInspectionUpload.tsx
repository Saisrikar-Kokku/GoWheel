'use client';

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
    ImagePosition, 
    InspectionType, 
    REQUIRED_PRE_RIDE_POSITIONS,
    positionLabels,
    RideInspectionImage 
} from '@/types/rideInspection';

interface RideInspectionUploadProps {
    bookingId: string;
    inspectionType: InspectionType;
    existingImages?: RideInspectionImage[];
    onUploadComplete: (isComplete: boolean) => void;
    disabled?: boolean;
}

type SubmissionState = 'uploading' | 'ready_to_submit' | 'submitting' | 'submitted' | null;

export default function RideInspectionUpload({
    bookingId,
    inspectionType,
    existingImages = [],
    onUploadComplete,
    disabled = false,
}: RideInspectionUploadProps) {
    const [uploading, setUploading] = useState<ImagePosition | null>(null);
    const [uploadedImages, setUploadedImages] = useState<RideInspectionImage[]>(existingImages);
    const [error, setError] = useState<string | null>(null);
    const [submissionState, setSubmissionState] = useState<SubmissionState>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedPosition, setSelectedPosition] = useState<ImagePosition | null>(null);

    const uploadedPositions = uploadedImages.map(img => img.position);
    const missingPositions = REQUIRED_PRE_RIDE_POSITIONS.filter(
        pos => !uploadedPositions.includes(pos)
    );
    const allPhotosUploaded = missingPositions.length === 0;
    const progress = ((REQUIRED_PRE_RIDE_POSITIONS.length - missingPositions.length) / REQUIRED_PRE_RIDE_POSITIONS.length) * 100;

    const handlePositionClick = useCallback((position: ImagePosition) => {
        if (disabled || uploading || submissionState === 'submitted') return;
        
        // Check if already uploaded
        if (uploadedPositions.includes(position)) {
            setError('Image already uploaded for this position');
            return;
        }

        setSelectedPosition(position);
        setError(null);
        fileInputRef.current?.click();
    }, [disabled, uploading, uploadedPositions, submissionState]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedPosition) return;

        // Validate file
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            setError('Please select a valid image (JPG, PNG, or WebP)');
            return;
        }

        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            setError('Image is too large. Maximum size is 10MB');
            return;
        }

        setUploading(selectedPosition);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('bookingId', bookingId);
            formData.append('position', selectedPosition);
            formData.append('inspectionType', inspectionType);
            formData.append('file', file);

            const response = await fetch('/api/ride/inspection/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Upload failed');
            }

            const data = await response.json();
            setUploadedImages(prev => [...prev, data.image]);
            
            // Check if all photos are now uploaded
            const newUploadedCount = uploadedImages.length + 1;
            if (newUploadedCount >= REQUIRED_PRE_RIDE_POSITIONS.length) {
                setSubmissionState('ready_to_submit');
            }

        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to upload image');
        } finally {
            setUploading(null);
            setSelectedPosition(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleConfirmSubmission = async () => {
        setSubmissionState('submitting');
        setError(null);

        try {
            // Call API to confirm inspection and update booking status
            const response = await fetch('/api/ride/inspection/confirm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bookingId }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to confirm inspection');
            }

            setSubmissionState('submitted');
            
            // Wait a moment to show success message, then notify parent
            setTimeout(() => {
                onUploadComplete(true);
            }, 2000);

        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to confirm inspection');
            setSubmissionState('ready_to_submit');
        }
    };

    const getPositionImage = (position: ImagePosition) => {
        return uploadedImages.find(img => img.position === position);
    };

    // Success state - all done
    if (submissionState === 'submitted') {
        return (
            <Card className="bg-card/50 border-emerald-500/30">
                <CardContent className="py-12">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="flex flex-col items-center text-center"
                    >
                        <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
                            <motion.svg 
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 0.5, delay: 0.2 }}
                                className="w-10 h-10 text-emerald-400" 
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                            >
                                <motion.path 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round" 
                                    strokeWidth={2.5} 
                                    d="M5 13l4 4L19 7"
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{ duration: 0.5, delay: 0.2 }}
                                />
                            </motion.svg>
                        </div>
                        <h3 className="text-xl font-semibold text-emerald-400 mb-2">
                            Inspection Photos Submitted! ✅
                        </h3>
                        <p className="text-muted-foreground max-w-sm">
                            Your vehicle inspection photos have been successfully uploaded. 
                            The owner will now generate your Start OTP.
                        </p>
                        <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Updating booking status...
                        </div>
                    </motion.div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                        <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {inspectionType === 'pre_ride' ? 'Pre-Ride Inspection' : 'Post-Ride Inspection'}
                    </CardTitle>
                    <Badge 
                        variant="secondary"
                        className={allPhotosUploaded 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }
                    >
                        {allPhotosUploaded ? '✓ Ready to Submit' : `${uploadedPositions.length}/${REQUIRED_PRE_RIDE_POSITIONS.length}`}
                    </Badge>
                </div>
                {!allPhotosUploaded && (
                    <p className="text-sm text-muted-foreground mt-1">
                        Upload photos of the vehicle before starting the ride
                    </p>
                )}
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Progress bar */}
                <div className="space-y-2">
                    <Progress value={progress} className="h-2" />
                    <p className="text-xs text-muted-foreground text-center">
                        {allPhotosUploaded 
                            ? '🎉 All required photos uploaded! Click confirm to proceed.'
                            : `${missingPositions.length} more photo${missingPositions.length > 1 ? 's' : ''} required`
                        }
                    </p>
                </div>

                {/* Error message */}
                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="bg-red-500/10 text-red-400 text-sm px-3 py-2 rounded-lg flex items-center gap-2"
                        >
                            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {error}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Image grid */}
                <div className="grid grid-cols-3 gap-3">
                    {REQUIRED_PRE_RIDE_POSITIONS.map((position) => {
                        const existingImage = getPositionImage(position);
                        const label = positionLabels[position];
                        const isUploading = uploading === position;

                        return (
                            <motion.div
                                key={position}
                                whileHover={!existingImage && !disabled ? { scale: 1.02 } : {}}
                                whileTap={!existingImage && !disabled ? { scale: 0.98 } : {}}
                                className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-colors ${
                                    existingImage
                                        ? 'border-emerald-500/50 bg-emerald-500/5'
                                        : disabled
                                        ? 'border-dashed border-muted cursor-not-allowed'
                                        : 'border-dashed border-muted-foreground/30 hover:border-primary/50 cursor-pointer bg-muted/20'
                                }`}
                                onClick={() => !existingImage && handlePositionClick(position)}
                            >
                                {existingImage ? (
                                    <>
                                        <Image
                                            src={existingImage.image_url}
                                            alt={label.label}
                                            fill
                                            className="object-cover"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                        <div className="absolute bottom-2 left-2 right-2">
                                            <Badge className="bg-emerald-500/90 text-white text-xs">
                                                ✓ {label.label}
                                            </Badge>
                                        </div>
                                    </>
                                ) : (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center p-2">
                                        {isUploading ? (
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                                <span className="text-xs text-muted-foreground">Uploading...</span>
                                            </div>
                                        ) : (
                                            <>
                                                <span className="text-2xl mb-1">{label.icon}</span>
                                                <span className="text-xs font-medium text-center">{label.label}</span>
                                                <span className="text-[10px] text-muted-foreground text-center mt-0.5">
                                                    Tap to upload
                                                </span>
                                            </>
                                        )}
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}
                </div>

                {/* Hidden file input */}
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    className="hidden"
                />

                {/* Confirm Button - Only shown when all photos uploaded */}
                {allPhotosUploaded && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="pt-4 border-t border-border/50"
                    >
                        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 mb-4">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                                    <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <h4 className="font-medium text-emerald-400">All Photos Ready!</h4>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Review your photos above and click confirm to submit the inspection. 
                                        Once submitted, the owner will generate your ride start OTP.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <Button
                            onClick={handleConfirmSubmission}
                            disabled={submissionState === 'submitting'}
                            className="w-full h-12 text-base bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                        >
                            {submissionState === 'submitting' ? (
                                <>
                                    <svg className="w-5 h-5 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Submitting Inspection...
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Confirm & Submit Inspection
                                </>
                            )}
                        </Button>
                    </motion.div>
                )}

                {/* Instructions - Only show when not all photos uploaded */}
                {!allPhotosUploaded && (
                    <div className="bg-muted/30 rounded-lg p-3 space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">📋 Photo Requirements:</p>
                        <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                            <li>Clear, well-lit photos showing the vehicle condition</li>
                            <li>Maximum file size: 10MB per image</li>
                            <li>Accepted formats: JPG, PNG, WebP</li>
                        </ul>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
