'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import PageWrapper from '@/components/layout/PageWrapper';
import { VehicleStatus, vehicleStatusConfig } from '@/types/vehicle';

interface Vehicle {
    id: string;
    title: string;
    brand: string;
    model: string;
    vehicle_type: 'car' | 'bike';
    price_per_day: number;
    location: string;
    is_active: boolean;
    created_at: string;
    owner_name: string;
    vehicle_status: VehicleStatus;
    registration_number?: string;
    owner_phone?: string;
    owner_email?: string;
    pan_card_url?: string;
    aadhaar_front_url?: string;
    aadhaar_back_url?: string;
    rc_front_url?: string;
    rc_back_url?: string;
    insurance_url?: string;
    rejection_reason?: string;
}

export default function AdminVehiclesPage() {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [activeTab, setActiveTab] = useState('pending');

    const fetchVehicles = async () => {
        try {
            const res = await fetch('/api/admin/vehicles');
            if (!res.ok) throw new Error('Failed to fetch vehicles');
            const data = await res.json();
            setVehicles(data.vehicles);
        } catch (err) {
            setError('Failed to load vehicles');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVehicles();
    }, []);

    const toggleActive = async (vehicleId: string, activate: boolean) => {
        setActionLoading(vehicleId);
        try {
            const res = await fetch('/api/admin/vehicles', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ vehicleId, isActive: activate }),
            });

            if (!res.ok) throw new Error('Failed to update vehicle');

            setVehicles(vehicles.map(v =>
                v.id === vehicleId ? { ...v, is_active: activate } : v
            ));
        } catch (err) {
            console.error(err);
            alert('Failed to update vehicle');
        } finally {
            setActionLoading(null);
        }
    };

    const handleApproval = async (vehicleId: string, action: 'approve' | 'reject') => {
        if (action === 'reject' && !rejectionReason.trim()) {
            alert('Please provide a rejection reason');
            return;
        }

        setActionLoading(vehicleId);
        try {
            const res = await fetch('/api/admin/vehicles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    vehicleId,
                    action,
                    rejectionReason: action === 'reject' ? rejectionReason : undefined,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to process');
            }

            // Update local state
            setVehicles(vehicles.map(v =>
                v.id === vehicleId
                    ? {
                        ...v,
                        vehicle_status: action === 'approve' ? 'approved' : 'rejected',
                        is_active: action === 'approve',
                        rejection_reason: action === 'reject' ? rejectionReason : undefined,
                    }
                    : v
            ));
            setSelectedVehicle(null);
            setRejectionReason('');
            alert(action === 'approve' ? '✅ Vehicle approved!' : '❌ Vehicle rejected');
        } catch (err: any) {
            console.error(err);
            alert(err.message || 'Failed to process');
        } finally {
            setActionLoading(null);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    // Filter vehicles by status
    const pendingVehicles = vehicles.filter(v => v.vehicle_status === 'pending_verification');
    const approvedVehicles = vehicles.filter(v => v.vehicle_status === 'approved');
    const rejectedVehicles = vehicles.filter(v => v.vehicle_status === 'rejected');
    const draftVehicles = vehicles.filter(v => !v.vehicle_status || v.vehicle_status === 'draft');

    const getStatusBadge = (status: VehicleStatus) => {
        const config = vehicleStatusConfig[status] || vehicleStatusConfig.draft;
        return (
            <Badge className={`${config.className} text-xs`}>
                {config.icon} {config.label}
            </Badge>
        );
    };

    const renderVehicleList = (vehicleList: Vehicle[], showActions: boolean = false) => (
        <div className="divide-y divide-border/50">
            {vehicleList.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">
                    No vehicles in this category.
                </div>
            ) : (
                vehicleList.map((vehicle) => (
                    <div
                        key={vehicle.id}
                        className="p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 hover:bg-muted/30 transition-colors"
                    >
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${vehicle.is_active ? 'bg-emerald-500/10' : 'bg-red-500/10'
                                }`}>
                                {vehicle.vehicle_type === 'car' ? '🚗' : '🏍️'}
                            </div>
                            <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-medium">{vehicle.title}</span>
                                    {getStatusBadge(vehicle.vehicle_status)}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    {vehicle.brand} {vehicle.model} • ₹{vehicle.price_per_day}/hr
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="text-sm text-muted-foreground">
                                Owner: <span className="text-foreground">{vehicle.owner_name}</span>
                            </div>
                            {vehicle.registration_number && (
                                <Badge variant="outline" className="text-xs">
                                    {vehicle.registration_number}
                                </Badge>
                            )}
                        </div>
                        <div className="flex items-center gap-2 lg:ml-auto">
                            <Badge variant="outline" className="text-xs">
                                {formatDate(vehicle.created_at)}
                            </Badge>

                            {/* Review button for pending vehicles */}
                            {showActions && vehicle.vehicle_status === 'pending_verification' && (
                                <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => setSelectedVehicle(vehicle)}
                                >
                                    Review KYC
                                </Button>
                            )}

                            {/* Toggle active for approved vehicles */}
                            {vehicle.vehicle_status === 'approved' && (
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button
                                            variant={vehicle.is_active ? 'destructive' : 'outline'}
                                            size="sm"
                                            disabled={actionLoading === vehicle.id}
                                        >
                                            {actionLoading === vehicle.id ? '...' : vehicle.is_active ? 'Deactivate' : 'Activate'}
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>
                                                {vehicle.is_active ? 'Deactivate Vehicle' : 'Activate Vehicle'}
                                            </AlertDialogTitle>
                                            <AlertDialogDescription>
                                                {vehicle.is_active
                                                    ? `This will hide "${vehicle.title}" from renters.`
                                                    : `This will make "${vehicle.title}" visible to renters.`
                                                }
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={() => toggleActive(vehicle.id, !vehicle.is_active)}
                                                className={vehicle.is_active ? 'bg-red-500 hover:bg-red-600' : ''}
                                            >
                                                {vehicle.is_active ? 'Deactivate' : 'Activate'}
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            )}
                        </div>
                    </div>
                ))
            )}
        </div>
    );

    return (
        <PageWrapper className="container mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-12">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                        <Link href="/dashboard/admin" className="hover:text-primary transition-colors">
                            Admin
                        </Link>
                        <span>/</span>
                        <span className="text-foreground">Vehicles</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold mb-1">Vehicle KYC & Moderation</h1>
                            <p className="text-muted-foreground">
                                Review KYC documents and approve vehicles.
                            </p>
                        </div>
                        {pendingVehicles.length > 0 && (
                            <Badge variant="destructive" className="self-start text-sm px-3 py-1">
                                {pendingVehicles.length} pending review
                            </Badge>
                        )}
                    </div>
                </div>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="mb-4">
                        <TabsTrigger value="pending" className="relative">
                            Pending Review
                            {pendingVehicles.length > 0 && (
                                <span className="ml-2 bg-red-500 text-white text-xs px-1.5 rounded-full">
                                    {pendingVehicles.length}
                                </span>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="approved">Approved ({approvedVehicles.length})</TabsTrigger>
                        <TabsTrigger value="rejected">Rejected ({rejectedVehicles.length})</TabsTrigger>
                        <TabsTrigger value="draft">Draft ({draftVehicles.length})</TabsTrigger>
                    </TabsList>

                    <Card className="bg-card/50 border-border/50">
                        <CardContent className="p-0">
                            {loading ? (
                                <div className="p-6 space-y-4">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <Skeleton className="w-12 h-12 rounded-lg" />
                                                <div>
                                                    <Skeleton className="h-4 w-40 mb-1" />
                                                    <Skeleton className="h-3 w-32" />
                                                </div>
                                            </div>
                                            <Skeleton className="h-8 w-24" />
                                        </div>
                                    ))}
                                </div>
                            ) : error ? (
                                <div className="p-6 text-center text-red-400">{error}</div>
                            ) : (
                                <>
                                    <TabsContent value="pending" className="m-0">
                                        {renderVehicleList(pendingVehicles, true)}
                                    </TabsContent>
                                    <TabsContent value="approved" className="m-0">
                                        {renderVehicleList(approvedVehicles)}
                                    </TabsContent>
                                    <TabsContent value="rejected" className="m-0">
                                        {renderVehicleList(rejectedVehicles)}
                                    </TabsContent>
                                    <TabsContent value="draft" className="m-0">
                                        {renderVehicleList(draftVehicles)}
                                    </TabsContent>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </Tabs>
            </motion.div>

            {/* KYC Review Dialog */}
            <Dialog open={!!selectedVehicle} onOpenChange={() => setSelectedVehicle(null)}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>KYC Document Review</DialogTitle>
                    </DialogHeader>
                    {selectedVehicle && (
                        <div className="space-y-6">
                            {/* Vehicle Info */}
                            <div className="bg-muted/30 rounded-lg p-4">
                                <h3 className="font-semibold mb-2">{selectedVehicle.title}</h3>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>Brand: {selectedVehicle.brand}</div>
                                    <div>Model: {selectedVehicle.model}</div>
                                    <div>Registration: {selectedVehicle.registration_number || 'N/A'}</div>
                                    <div>Price: ₹{selectedVehicle.price_per_day}/hr</div>
                                </div>
                            </div>

                            {/* Owner Info */}
                            <div className="bg-muted/30 rounded-lg p-4">
                                <h3 className="font-semibold mb-2">Owner Details</h3>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>Name: {selectedVehicle.owner_name}</div>
                                    <div>Phone: {selectedVehicle.owner_phone || 'N/A'}</div>
                                    <div>Email: {selectedVehicle.owner_email || 'N/A'}</div>
                                </div>
                            </div>

                            {/* Documents Grid */}
                            <div>
                                <h3 className="font-semibold mb-3">KYC Documents</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {[
                                        { label: 'PAN Card', url: selectedVehicle.pan_card_url },
                                        { label: 'Aadhaar Front', url: selectedVehicle.aadhaar_front_url },
                                        { label: 'Aadhaar Back', url: selectedVehicle.aadhaar_back_url },
                                        { label: 'RC Front', url: selectedVehicle.rc_front_url },
                                        { label: 'RC Back', url: selectedVehicle.rc_back_url },
                                        { label: 'Insurance', url: selectedVehicle.insurance_url },
                                    ].map((doc) => (
                                        <div key={doc.label} className="border border-border/50 rounded-lg p-2">
                                            <p className="text-xs text-muted-foreground mb-2">{doc.label}</p>
                                            {doc.url ? (
                                                <a
                                                    href={doc.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="block"
                                                >
                                                    <div className="relative aspect-[4/3] bg-muted rounded overflow-hidden">
                                                        <Image
                                                            src={doc.url}
                                                            alt={doc.label}
                                                            fill
                                                            className="object-cover hover:scale-105 transition-transform"
                                                        />
                                                    </div>
                                                    <p className="text-xs text-primary mt-1 text-center">Click to view</p>
                                                </a>
                                            ) : (
                                                <div className="aspect-[4/3] bg-muted rounded flex items-center justify-center">
                                                    <span className="text-red-400 text-xs">Missing</span>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Rejection Reason */}
                            <div>
                                <label className="text-sm font-medium">Rejection Reason (if rejecting)</label>
                                <Textarea
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    placeholder="Enter reason for rejection..."
                                    className="mt-1"
                                />
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 justify-end">
                                <Button
                                    variant="outline"
                                    onClick={() => setSelectedVehicle(null)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={() => handleApproval(selectedVehicle.id, 'reject')}
                                    disabled={actionLoading === selectedVehicle.id}
                                >
                                    {actionLoading === selectedVehicle.id ? 'Processing...' : 'Reject'}
                                </Button>
                                <Button
                                    variant="default"
                                    onClick={() => handleApproval(selectedVehicle.id, 'approve')}
                                    disabled={actionLoading === selectedVehicle.id}
                                    className="bg-emerald-600 hover:bg-emerald-700"
                                >
                                    {actionLoading === selectedVehicle.id ? 'Processing...' : 'Approve'}
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </PageWrapper>
    );
}
