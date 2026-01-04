'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import PageWrapper from '@/components/layout/PageWrapper';
import { getVehicleById, uploadKYCDocument, submitVehicleForVerification, KYCDocumentType } from '@/services/vehicleService';
import { VehicleWithImages, vehicleStatusConfig } from '@/types/vehicle';

interface DocumentUpload {
    type: KYCDocumentType;
    label: string;
    description: string;
    currentUrl?: string;
    file?: File;
    preview?: string;
    uploading: boolean;
}

export default function VehicleKYCPage() {
    const params = useParams();
    const router = useRouter();
    const vehicleId = params.id as string;

    const [vehicle, setVehicle] = useState<VehicleWithImages | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [ownerPhone, setOwnerPhone] = useState('');
    const [ownerEmail, setOwnerEmail] = useState('');
    const [registrationNumber, setRegistrationNumber] = useState('');

    const [documents, setDocuments] = useState<DocumentUpload[]>([
        { type: 'pan_card', label: 'PAN Card', description: 'Clear photo of your PAN card', uploading: false },
        { type: 'aadhaar_front', label: 'Aadhaar Front', description: 'Front side of Aadhaar card', uploading: false },
        { type: 'aadhaar_back', label: 'Aadhaar Back', description: 'Back side of Aadhaar card', uploading: false },
        { type: 'rc_front', label: 'RC Front', description: 'Front of Registration Certificate', uploading: false },
        { type: 'rc_back', label: 'RC Back', description: 'Back of Registration Certificate', uploading: false },
        { type: 'insurance', label: 'Insurance', description: 'Valid vehicle insurance document', uploading: false },
    ]);

    useEffect(() => {
        const fetchVehicle = async () => {
            try {
                const data = await getVehicleById(vehicleId);
                if (data) {
                    setVehicle(data);
                    setOwnerPhone(data.owner_phone || '');
                    setOwnerEmail(data.owner_email || '');
                    setRegistrationNumber(data.registration_number || '');

                    // Update documents with existing URLs
                    setDocuments(prev => prev.map(doc => ({
                        ...doc,
                        currentUrl: (data as any)[`${doc.type}_url`] || undefined,
                    })));
                }
            } catch (error) {
                console.error('Failed to fetch vehicle:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchVehicle();
    }, [vehicleId]);

    const handleFileSelect = async (docType: KYCDocumentType, file: File) => {
        // Update state with file preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setDocuments(prev => prev.map(doc =>
                doc.type === docType
                    ? { ...doc, file, preview: reader.result as string }
                    : doc
            ));
        };
        reader.readAsDataURL(file);

        // Upload immediately
        setDocuments(prev => prev.map(doc =>
            doc.type === docType ? { ...doc, uploading: true } : doc
        ));

        try {
            const url = await uploadKYCDocument(vehicleId, docType, file);
            setDocuments(prev => prev.map(doc =>
                doc.type === docType
                    ? { ...doc, currentUrl: url, uploading: false }
                    : doc
            ));
        } catch (error) {
            console.error('Upload failed:', error);
            setDocuments(prev => prev.map(doc =>
                doc.type === docType ? { ...doc, uploading: false } : doc
            ));
            alert('Failed to upload document. Please try again.');
        }
    };

    const allDocumentsUploaded = documents.every(doc => doc.currentUrl || doc.file);

    const handleSubmit = async () => {
        if (!allDocumentsUploaded) {
            alert('Please upload all required documents');
            return;
        }

        if (!ownerPhone || !ownerEmail || !registrationNumber) {
            alert('Please fill in all required fields');
            return;
        }

        setSubmitting(true);
        try {
            await submitVehicleForVerification(vehicleId, {
                owner_phone: ownerPhone,
                owner_email: ownerEmail,
                registration_number: registrationNumber,
            });
            alert('✅ Submitted for verification! You will be notified once reviewed.');
            router.push('/dashboard/owner/vehicles');
        } catch (error: any) {
            console.error('Submit failed:', error);
            alert(error.message || 'Failed to submit. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <PageWrapper className="container mx-auto max-w-4xl px-4 py-8">
                <Skeleton className="h-8 w-64 mb-4" />
                <Skeleton className="h-4 w-96 mb-8" />
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <Skeleton key={i} className="h-40" />
                    ))}
                </div>
            </PageWrapper>
        );
    }

    if (!vehicle) {
        return (
            <PageWrapper className="container mx-auto max-w-4xl px-4 py-8">
                <div className="text-center py-12">
                    <h1 className="text-xl font-semibold mb-2">Vehicle not found</h1>
                    <Link href="/dashboard/owner/vehicles">
                        <Button>Back to Vehicles</Button>
                    </Link>
                </div>
            </PageWrapper>
        );
    }

    return (
        <PageWrapper className="container mx-auto max-w-4xl px-4 py-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                        <Link href="/dashboard/owner/vehicles" className="hover:text-primary">
                            My Vehicles
                        </Link>
                        <span>/</span>
                        <span className="text-foreground">KYC Documents</span>
                    </div>
                    <h1 className="text-2xl font-bold mb-2">Submit KYC Documents</h1>
                    <p className="text-muted-foreground">
                        Upload required documents for <strong>{vehicle.title}</strong> to go live.
                    </p>
                </div>

                {/* Vehicle Info */}
                <Card className="bg-card/50 border-border/50 mb-6">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center text-2xl">
                            {vehicle.vehicle_type === 'car' ? '🚗' : '🏍️'}
                        </div>
                        <div>
                            <h3 className="font-semibold">{vehicle.title}</h3>
                            <p className="text-sm text-muted-foreground">
                                {vehicle.brand} {vehicle.model} • ₹{vehicle.price_per_day}/hr
                            </p>
                        </div>
                        <Badge className={`ml-auto ${vehicleStatusConfig[vehicle.vehicle_status || 'draft']?.className}`}>
                            {vehicleStatusConfig[vehicle.vehicle_status || 'draft']?.icon}{' '}
                            {vehicleStatusConfig[vehicle.vehicle_status || 'draft']?.label}
                        </Badge>
                    </CardContent>
                </Card>

                {/* Owner & Vehicle Details */}
                <Card className="bg-card/50 border-border/50 mb-6">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Owner & Vehicle Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="phone">Mobile Number *</Label>
                                <Input
                                    id="phone"
                                    type="tel"
                                    value={ownerPhone}
                                    onChange={(e) => setOwnerPhone(e.target.value)}
                                    placeholder="10-digit mobile number"
                                    className="mt-1"
                                />
                            </div>
                            <div>
                                <Label htmlFor="email">Email ID *</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={ownerEmail}
                                    onChange={(e) => setOwnerEmail(e.target.value)}
                                    placeholder="your@email.com"
                                    className="mt-1"
                                />
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="reg">Vehicle Registration Number *</Label>
                            <Input
                                id="reg"
                                type="text"
                                value={registrationNumber}
                                onChange={(e) => setRegistrationNumber(e.target.value.toUpperCase())}
                                placeholder="e.g., AP09AB1234"
                                className="mt-1"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Document Uploads */}
                <Card className="bg-card/50 border-border/50 mb-6">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg">KYC Documents</CardTitle>
                        <p className="text-sm text-muted-foreground">
                            Upload clear photos of all required documents
                        </p>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {documents.map((doc) => (
                                <DocumentUploadCard
                                    key={doc.type}
                                    doc={doc}
                                    onFileSelect={(file) => handleFileSelect(doc.type, file)}
                                />
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Submit Button */}
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        {allDocumentsUploaded
                            ? '✅ All documents uploaded'
                            : `${documents.filter(d => d.currentUrl).length}/${documents.length} documents uploaded`
                        }
                    </p>
                    <Button
                        onClick={handleSubmit}
                        disabled={!allDocumentsUploaded || submitting}
                        className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                    >
                        {submitting ? (
                            <>
                                <span className="animate-spin mr-2">⏳</span>
                                Submitting...
                            </>
                        ) : (
                            'Submit for Verification'
                        )}
                    </Button>
                </div>
            </motion.div>
        </PageWrapper>
    );
}

interface DocumentUploadCardProps {
    doc: DocumentUpload;
    onFileSelect: (file: File) => void;
}

function DocumentUploadCard({ doc, onFileSelect }: DocumentUploadCardProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    const handleClick = () => {
        inputRef.current?.click();
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onFileSelect(file);
        }
    };

    const imageUrl = doc.preview || doc.currentUrl;
    const isUploaded = !!doc.currentUrl;

    return (
        <div
            onClick={handleClick}
            className={`relative border-2 border-dashed rounded-lg p-3 cursor-pointer transition-colors
                ${isUploaded ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-border hover:border-primary/50'}
                ${doc.uploading ? 'opacity-50 pointer-events-none' : ''}
            `}
        >
            <input
                ref={inputRef}
                type="file"
                accept="image/*,.pdf"
                onChange={handleChange}
                className="hidden"
            />

            {imageUrl ? (
                <div className="relative aspect-[4/3] rounded overflow-hidden mb-2">
                    <Image
                        src={imageUrl}
                        alt={doc.label}
                        fill
                        className="object-cover"
                    />
                    {isUploaded && (
                        <div className="absolute top-1 right-1 bg-emerald-500 rounded-full p-0.5">
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                    )}
                </div>
            ) : (
                <div className="aspect-[4/3] rounded bg-muted/50 flex items-center justify-center mb-2">
                    <svg className="w-8 h-8 text-muted-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </div>
            )}

            <p className="text-sm font-medium truncate">{doc.label}</p>
            <p className="text-xs text-muted-foreground truncate">{doc.description}</p>

            {doc.uploading && (
                <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-lg">
                    <div className="animate-spin">⏳</div>
                </div>
            )}
        </div>
    );
}
