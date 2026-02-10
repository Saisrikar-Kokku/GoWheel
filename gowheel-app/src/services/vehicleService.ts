// Vehicle service — mirrors the website's vehicleService.ts

import { supabase } from '@/lib/supabase';
import { Vehicle, VehicleWithImages, VehicleFormData, VehicleImage, VehicleFilters, VehicleSearchResult, VehicleWithOwner } from '@/types/vehicle';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';

// ================================
// OWNER FUNCTIONS
// ================================

export async function getOwnerVehicles(): Promise<VehicleWithImages[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: vehicles, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

    if (error) throw error;

    const vehiclesWithImages = await Promise.all(
        (vehicles || []).map(async (vehicle) => {
            const { data: images } = await supabase
                .from('vehicle_images')
                .select('*')
                .eq('vehicle_id', vehicle.id)
                .order('is_primary', { ascending: false });
            return { ...vehicle, images: images || [] } as VehicleWithImages;
        })
    );
    return vehiclesWithImages;
}

export async function getVehicleById(id: string): Promise<VehicleWithImages | null> {
    const { data: vehicle, error } = await supabase.from('vehicles').select('*').eq('id', id).single();
    if (error || !vehicle) return null;
    const { data: images } = await supabase.from('vehicle_images').select('*').eq('vehicle_id', id).order('is_primary', { ascending: false });
    return { ...vehicle, images: images || [] } as VehicleWithImages;
}

export async function createVehicle(data: VehicleFormData): Promise<Vehicle> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: vehicle, error } = await supabase
        .from('vehicles')
        .insert({ ...data, owner_id: user.id, vehicle_status: 'draft' })
        .select()
        .single();
    if (error) throw error;
    return vehicle;
}

export async function updateVehicle(id: string, data: Partial<VehicleFormData>): Promise<Vehicle> {
    const { data: vehicle, error } = await supabase.from('vehicles').update(data).eq('id', id).select().single();
    if (error) throw error;
    return vehicle;
}

export async function deleteVehicle(id: string): Promise<void> {
    const { data: images } = await supabase.from('vehicle_images').select('image_url').eq('vehicle_id', id);
    if (images && images.length > 0) {
        const filePaths = images.map((img) => {
            try { return new URL(img.image_url).pathname.split('/vehicle-images/')[1]; } catch { return null; }
        }).filter(Boolean) as string[];
        if (filePaths.length > 0) await supabase.storage.from('vehicle-images').remove(filePaths);
    }
    const { error } = await supabase.from('vehicles').delete().eq('id', id);
    if (error) throw error;
}

export async function uploadVehicleImage(vehicleId: string, uri: string, fileName: string, mimeType: string): Promise<VehicleImage | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const fileExt = fileName.split('.').pop() || 'jpg';
    const storagePath = `${user.id}/${vehicleId}/${Date.now()}.${fileExt}`;

    // Read file as base64 and convert to ArrayBuffer
    const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
    const arrayBuffer = decode(base64);

    const { error: uploadError } = await supabase.storage.from('vehicle-images').upload(storagePath, arrayBuffer, { contentType: mimeType });
    if (uploadError) { console.error('Upload error:', uploadError); return null; }

    const { data: urlData } = supabase.storage.from('vehicle-images').getPublicUrl(storagePath);
    const { data: imageRecord, error: dbError } = await supabase
        .from('vehicle_images')
        .insert({ vehicle_id: vehicleId, image_url: urlData.publicUrl, is_primary: false })
        .select()
        .single();

    if (dbError) return null;
    return imageRecord;
}

export async function deleteVehicleImage(imageId: string, imageUrl: string): Promise<void> {
    try {
        const filePath = new URL(imageUrl).pathname.split('/vehicle-images/')[1];
        if (filePath) await supabase.storage.from('vehicle-images').remove([filePath]);
    } catch (e) { console.error('Storage delete error:', e); }
    const { error } = await supabase.from('vehicle_images').delete().eq('id', imageId);
    if (error) throw error;
}

export async function toggleVehicleStatus(id: string, isActive: boolean): Promise<void> {
    const { error } = await supabase.from('vehicles').update({ is_active: isActive }).eq('id', id);
    if (error) throw error;
}

// ================================
// PUBLIC BROWSING (Renter)
// ================================

export async function getActiveVehicles(filters: VehicleFilters = {}): Promise<VehicleSearchResult> {
    const { type, minPrice, maxPrice, location, sort = 'newest', page = 1, limit = 12 } = filters;

    let query = supabase.from('vehicles').select('*', { count: 'exact' }).eq('is_active', true).eq('vehicle_status', 'approved');

    if (type) query = query.eq('vehicle_type', type);
    if (minPrice !== undefined) query = query.gte('price_per_day', minPrice);
    if (maxPrice !== undefined) query = query.lte('price_per_day', maxPrice);
    if (location) query = query.ilike('location', `%${location}%`);

    switch (sort) {
        case 'price_asc': query = query.order('price_per_day', { ascending: true }); break;
        case 'price_desc': query = query.order('price_per_day', { ascending: false }); break;
        default: query = query.order('created_at', { ascending: false }); break;
    }

    const start = (page - 1) * limit;
    query = query.range(start, start + limit - 1);

    const { data: vehicles, error, count } = await query;
    if (error) throw error;

    const vehiclesWithImages = await Promise.all(
        (vehicles || []).map(async (vehicle) => {
            const { data: images } = await supabase.from('vehicle_images').select('*').eq('vehicle_id', vehicle.id).order('is_primary', { ascending: false });
            return { ...vehicle, images: images || [] } as VehicleWithImages;
        })
    );

    const total = count || 0;
    return { vehicles: vehiclesWithImages, total, page, totalPages: Math.ceil(total / limit) };
}

export async function getVehicleDetailsById(id: string): Promise<VehicleWithOwner | null> {
    const { data: vehicle, error } = await supabase.from('vehicles').select('*').eq('id', id).single();
    if (error || !vehicle) return null;

    const { data: images } = await supabase.from('vehicle_images').select('*').eq('vehicle_id', id).order('is_primary', { ascending: false });
    const { data: owner } = await supabase.from('profiles').select('id, full_name, created_at').eq('id', vehicle.owner_id).single();

    return { ...vehicle, images: images || [], owner: owner || undefined } as VehicleWithOwner;
}

export async function getVehiclePriceRange(): Promise<{ min: number; max: number }> {
    const { data } = await supabase.from('vehicles').select('price_per_day').eq('is_active', true).eq('vehicle_status', 'approved').order('price_per_day', { ascending: true });
    if (!data || data.length === 0) return { min: 0, max: 500 };
    return { min: Math.floor(data[0].price_per_day), max: Math.ceil(data[data.length - 1].price_per_day) };
}

// ================================
// KYC FUNCTIONS
// ================================

export type KYCDocumentType = 'pan_card' | 'aadhaar_front' | 'aadhaar_back' | 'rc_front' | 'rc_back' | 'insurance';

export async function uploadKYCDocument(vehicleId: string, documentType: KYCDocumentType, uri: string, fileName: string, mimeType: string): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const fileExt = fileName.split('.').pop() || 'jpg';
    const storagePath = `${user.id}/${vehicleId}/kyc_${documentType}_${Date.now()}.${fileExt}`;

    // Read file as base64 and convert to ArrayBuffer
    const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
    const arrayBuffer = decode(base64);

    const { error: uploadError } = await supabase.storage.from('vehicle-images').upload(storagePath, arrayBuffer, { contentType: mimeType });
    if (uploadError) throw new Error('Failed to upload document');

    const { data: urlData } = supabase.storage.from('vehicle-images').getPublicUrl(storagePath);
    const { error: updateError } = await supabase.from('vehicles').update({ [`${documentType}_url`]: urlData.publicUrl }).eq('id', vehicleId);
    if (updateError) throw new Error('Failed to save document reference');

    return urlData.publicUrl;
}

export async function submitVehicleForVerification(vehicleId: string, data: { registration_number: string; owner_phone: string; owner_email: string }): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: vehicle, error: fetchError } = await supabase.from('vehicles').select('*').eq('id', vehicleId).eq('owner_id', user.id).single();
    if (fetchError || !vehicle) throw new Error('Vehicle not found');

    const requiredDocs = ['pan_card_url', 'aadhaar_front_url', 'aadhaar_back_url', 'rc_front_url', 'rc_back_url', 'insurance_url'];
    const missingDocs = requiredDocs.filter(doc => !vehicle[doc]);
    if (missingDocs.length > 0) throw new Error(`Missing required documents: ${missingDocs.join(', ')}`);

    const { error: updateError } = await supabase.from('vehicles').update({ ...data, vehicle_status: 'pending_verification' }).eq('id', vehicleId);
    if (updateError) throw new Error('Failed to submit for verification');
}

// ================================
// AVAILABILITY
// ================================

export async function checkVehicleAvailability(vehicleId: string): Promise<{ isAvailable: boolean; reason?: string }> {
    const { data: vehicle } = await supabase.from('vehicles').select('id, is_active, vehicle_status').eq('id', vehicleId).single();
    if (!vehicle || !vehicle.is_active) return { isAvailable: false, reason: 'inactive' };
    if (vehicle.vehicle_status !== 'approved') return { isAvailable: false, reason: 'not_approved' };

    const now = new Date().toISOString();
    const { data: activeBookings } = await supabase
        .from('bookings')
        .select('id, start_date, end_date, status')
        .eq('vehicle_id', vehicleId)
        .in('status', ['confirmed', 'approved'])
        .gte('end_date', now);

    const currentTime = new Date();
    for (const booking of activeBookings || []) {
        if (currentTime >= new Date(booking.start_date) && currentTime <= new Date(booking.end_date)) {
            return { isAvailable: false, reason: 'booked' };
        }
    }
    return { isAvailable: true };
}
