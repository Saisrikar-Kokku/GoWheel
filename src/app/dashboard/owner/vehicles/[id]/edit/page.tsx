'use client';

import { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import PageWrapper from '@/components/layout/PageWrapper';
import { getVehicleById, updateVehicle, uploadVehicleImages, deleteVehicleImage } from '@/services/vehicleService';
import { VehicleFormData, VehicleType, VehicleWithImages, VehicleImage } from '@/types/vehicle';

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 30 }, (_, i) => currentYear - i);

export default function EditVehiclePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [vehicle, setVehicle] = useState<VehicleWithImages | null>(null);
    const [existingImages, setExistingImages] = useState<VehicleImage[]>([]);
    const [newImages, setNewImages] = useState<File[]>([]);
    const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);

    const [formData, setFormData] = useState<VehicleFormData>({
        title: '',
        vehicle_type: 'car',
        brand: '',
        model: '',
        year: currentYear,
        price_per_day: 0,
        location: '',
        description: '',
        is_active: true,
    });

    useEffect(() => {
        const fetchVehicle = async () => {
            try {
                const data = await getVehicleById(id);
                if (!data) {
                    setError('Vehicle not found');
                    return;
                }
                setVehicle(data);
                setExistingImages(data.images);
                setFormData({
                    title: data.title,
                    vehicle_type: data.vehicle_type,
                    brand: data.brand,
                    model: data.model,
                    year: data.year,
                    price_per_day: data.price_per_day,
                    location: data.location,
                    description: data.description || '',
                    is_active: data.is_active,
                });
            } catch (err) {
                setError('Failed to load vehicle');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchVehicle();
    }, [id]);

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: name === 'price_per_day' || name === 'year' ? Number(value) : value,
        }));
    };

    const handleNewImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        const totalImages = existingImages.length + newImages.length + files.length;

        if (totalImages > 5) {
            setError('Maximum 5 images allowed');
            return;
        }

        setNewImages((prev) => [...prev, ...files]);

        files.forEach((file) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setNewImagePreviews((prev) => [...prev, reader.result as string]);
            };
            reader.readAsDataURL(file);
        });
    };

    const removeNewImage = (index: number) => {
        setNewImages((prev) => prev.filter((_, i) => i !== index));
        setNewImagePreviews((prev) => prev.filter((_, i) => i !== index));
    };

    const handleDeleteExistingImage = async (image: VehicleImage) => {
        try {
            await deleteVehicleImage(image.id, image.image_url);
            setExistingImages((prev) => prev.filter((img) => img.id !== image.id));
        } catch (err) {
            console.error('Failed to delete image:', err);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);

        // Validation
        if (!formData.title.trim()) {
            setError('Title is required');
            setSaving(false);
            return;
        }
        if (!formData.brand.trim()) {
            setError('Brand is required');
            setSaving(false);
            return;
        }
        if (!formData.model.trim()) {
            setError('Model is required');
            setSaving(false);
            return;
        }
        if (formData.price_per_day <= 0) {
            setError('Price must be greater than 0');
            setSaving(false);
            return;
        }
        if (!formData.location.trim()) {
            setError('Location is required');
            setSaving(false);
            return;
        }

        try {
            await updateVehicle(id, formData);

            // Upload new images if any
            if (newImages.length > 0) {
                await uploadVehicleImages(id, newImages);
            }

            setSuccess(true);
            setTimeout(() => {
                router.push('/dashboard/owner/vehicles');
            }, 1000);
        } catch (err) {
            console.error(err);
            setError('Failed to update vehicle. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <PageWrapper className="container mx-auto max-w-3xl px-4 sm:px-6 py-8 sm:py-12">
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-xl" />
                        <div>
                            <Skeleton className="h-8 w-48" />
                            <Skeleton className="h-4 w-32 mt-2" />
                        </div>
                    </div>
                    <Card className="bg-card/50 border-border/50">
                        <CardContent className="p-6 space-y-4">
                            <div className="grid grid-cols-5 gap-4">
                                {[1, 2, 3].map((i) => (
                                    <Skeleton key={i} className="aspect-square rounded-xl" />
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-card/50 border-border/50">
                        <CardContent className="p-6 space-y-4">
                            <Skeleton className="h-10 w-full" />
                            <div className="grid grid-cols-2 gap-4">
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </PageWrapper>
        );
    }

    if (!vehicle) {
        return (
            <PageWrapper className="container mx-auto max-w-3xl px-4 sm:px-6 py-8 sm:py-12">
                <Card className="bg-red-500/10 border-red-500/20">
                    <CardContent className="p-8 text-center">
                        <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <p className="text-red-400 text-lg font-medium mb-2">Vehicle Not Found</p>
                        <p className="text-muted-foreground mb-4">{error}</p>
                        <Link href="/dashboard/owner/vehicles">
                            <Button variant="outline">
                                Back to Vehicles
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </PageWrapper>
        );
    }

    return (
        <PageWrapper className="container mx-auto max-w-3xl px-4 sm:px-6 py-8 sm:py-12">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                {/* Header */}
                <div className="mb-8">
                    <Link
                        href="/dashboard/owner/vehicles"
                        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4 group"
                    >
                        <svg className="w-4 h-4 mr-1 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to Vehicles
                    </Link>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold">Edit Vehicle</h1>
                            <p className="text-muted-foreground text-sm">
                                Update your listing details
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Success Message */}
                    <AnimatePresence>
                        {success && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                            >
                                <Card className="bg-emerald-500/10 border-emerald-500/20 mb-6">
                                    <CardContent className="p-4 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                                            <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <p className="text-emerald-400 text-sm">Vehicle updated successfully! Redirecting...</p>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Error Display */}
                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                            >
                                <Card className="bg-red-500/10 border-red-500/20 mb-6">
                                    <CardContent className="p-4 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                                            <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </div>
                                        <p className="text-red-400 text-sm">{error}</p>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Images */}
                    <Card className="bg-card/50 border-border/50 mb-6 overflow-hidden">
                        <CardHeader className="border-b border-border/50 border-l-4 border-l-purple-500">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <CardTitle className="text-lg">Vehicle Photos</CardTitle>
                                    <CardDescription>Manage your vehicle images</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-5">
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                                {/* Existing Images */}
                                <AnimatePresence>
                                    {existingImages.map((image, index) => (
                                        <motion.div
                                            key={image.id}
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.8 }}
                                            className="relative aspect-square rounded-xl overflow-hidden bg-muted group"
                                        >
                                            <Image
                                                src={image.image_url}
                                                alt={`Image ${index + 1}`}
                                                fill
                                                className="object-cover"
                                            />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteExistingImage(image)}
                                                className="absolute top-2 right-2 w-7 h-7 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                            {image.is_primary && (
                                                <Badge className="absolute bottom-2 left-2 bg-emerald-500 text-white text-[10px]">
                                                    Primary
                                                </Badge>
                                            )}
                                        </motion.div>
                                    ))}
                                </AnimatePresence>

                                {/* New Image Previews */}
                                <AnimatePresence>
                                    {newImagePreviews.map((preview, index) => (
                                        <motion.div
                                            key={`new-${index}`}
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.8 }}
                                            className="relative aspect-square rounded-xl overflow-hidden bg-muted group"
                                        >
                                            <Image
                                                src={preview}
                                                alt={`New ${index + 1}`}
                                                fill
                                                className="object-cover"
                                            />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            <button
                                                type="button"
                                                onClick={() => removeNewImage(index)}
                                                className="absolute top-2 right-2 w-7 h-7 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                            <Badge className="absolute bottom-2 left-2 bg-blue-500 text-white text-[10px]">
                                                New
                                            </Badge>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>

                                {/* Add More */}
                                {existingImages.length + newImages.length < 5 && (
                                    <motion.button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="aspect-square rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 flex flex-col items-center justify-center text-muted-foreground hover:text-foreground transition-all"
                                    >
                                        <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                        <span className="text-xs font-medium">Add Photo</span>
                                    </motion.button>
                                )}
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleNewImageSelect}
                                className="hidden"
                            />
                        </CardContent>
                    </Card>

                    {/* Basic Info */}
                    <Card className="bg-card/50 border-border/50 mb-6 overflow-hidden">
                        <CardHeader className="border-b border-border/50 border-l-4 border-l-blue-500">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <CardTitle className="text-lg">Basic Information</CardTitle>
                                    <CardDescription>Update your vehicle details</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-5 space-y-4">
                            <div>
                                <Label htmlFor="title">Listing Title *</Label>
                                <Input
                                    id="title"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    className="mt-1.5"
                                />
                            </div>

                            <div className="grid sm:grid-cols-2 gap-4">
                                <div>
                                    <Label>Vehicle Type *</Label>
                                    <Select
                                        value={formData.vehicle_type}
                                        onValueChange={(value: VehicleType) =>
                                            setFormData((prev) => ({ ...prev, vehicle_type: value }))
                                        }
                                    >
                                        <SelectTrigger className="mt-1.5">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="car">🚗 Car</SelectItem>
                                            <SelectItem value="bike">🏍️ Bike</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Year *</Label>
                                    <Select
                                        value={formData.year.toString()}
                                        onValueChange={(value) =>
                                            setFormData((prev) => ({ ...prev, year: parseInt(value) }))
                                        }
                                    >
                                        <SelectTrigger className="mt-1.5">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {years.map((year) => (
                                                <SelectItem key={year} value={year.toString()}>
                                                    {year}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="brand">Brand *</Label>
                                    <Input
                                        id="brand"
                                        name="brand"
                                        value={formData.brand}
                                        onChange={handleInputChange}
                                        className="mt-1.5"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="model">Model *</Label>
                                    <Input
                                        id="model"
                                        name="model"
                                        value={formData.model}
                                        onChange={handleInputChange}
                                        className="mt-1.5"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Pricing & Location */}
                    <Card className="bg-card/50 border-border/50 mb-6 overflow-hidden">
                        <CardHeader className="border-b border-border/50 border-l-4 border-l-emerald-500">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <CardTitle className="text-lg">Pricing & Location</CardTitle>
                                    <CardDescription>Update your rate and location</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-5 space-y-4">
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="price_per_day">Price per Day (₹) *</Label>
                                    <div className="relative mt-1.5">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                                        <Input
                                            id="price_per_day"
                                            name="price_per_day"
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={formData.price_per_day || ''}
                                            onChange={handleInputChange}
                                            className="pl-7"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <Label htmlFor="location">Pickup Location *</Label>
                                    <Input
                                        id="location"
                                        name="location"
                                        value={formData.location}
                                        onChange={handleInputChange}
                                        className="mt-1.5"
                                    />
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    rows={4}
                                    className="mt-1.5"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Settings */}
                    <Card className="bg-card/50 border-border/50 mb-8 overflow-hidden">
                        <CardHeader className="border-b border-border/50 border-l-4 border-l-amber-500">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <CardTitle className="text-lg">Visibility Settings</CardTitle>
                                    <CardDescription>Control your listing visibility</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50">
                                <div className="flex items-center gap-3">
                                    <div className={`w-3 h-3 rounded-full ${formData.is_active ? 'bg-emerald-400 animate-pulse' : 'bg-muted-foreground'}`} />
                                    <div>
                                        <Label className="text-base">Listing Active</Label>
                                        <p className="text-sm text-muted-foreground">
                                            {formData.is_active ? 'Visible to renters' : 'Hidden from renters'}
                                        </p>
                                    </div>
                                </div>
                                <Switch
                                    checked={formData.is_active}
                                    onCheckedChange={(checked) =>
                                        setFormData((prev) => ({ ...prev, is_active: checked }))
                                    }
                                    className="data-[state=checked]:bg-emerald-500"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Submit */}
                    <div className="flex gap-4">
                        <Link href="/dashboard/owner/vehicles" className="flex-1 sm:flex-none">
                            <Button type="button" variant="outline" className="w-full sm:w-auto" disabled={saving}>
                                Cancel
                            </Button>
                        </Link>
                        <Button
                            type="submit"
                            disabled={saving || success}
                            className="flex-1 sm:flex-none bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg shadow-blue-500/25"
                        >
                            {saving ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Saving...
                                </span>
                            ) : success ? (
                                <span className="flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Saved!
                                </span>
                            ) : (
                                <>
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Save Changes
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </motion.div>
        </PageWrapper>
    );
}
