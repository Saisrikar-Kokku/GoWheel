import { createClient } from '@/lib/supabase/client';
import { Vehicle, VehicleWithImages, VehicleFormData, VehicleImage } from '@/types/vehicle';

const supabase = createClient();

// Get all vehicles for the current owner
export async function getOwnerVehicles(): Promise<VehicleWithImages[]> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Not authenticated');

    const { data: vehicles, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

    if (error) throw error;

    // Fetch images for each vehicle
    const vehiclesWithImages = await Promise.all(
        (vehicles || []).map(async (vehicle) => {
            const { data: images } = await supabase
                .from('vehicle_images')
                .select('*')
                .eq('vehicle_id', vehicle.id)
                .order('is_primary', { ascending: false });

            return {
                ...vehicle,
                images: images || [],
            } as VehicleWithImages;
        })
    );

    return vehiclesWithImages;
}

// Get single vehicle by ID
export async function getVehicleById(id: string): Promise<VehicleWithImages | null> {
    const { data: vehicle, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !vehicle) return null;

    const { data: images } = await supabase
        .from('vehicle_images')
        .select('*')
        .eq('vehicle_id', id)
        .order('is_primary', { ascending: false });

    return {
        ...vehicle,
        images: images || [],
    } as VehicleWithImages;
}

// Create new vehicle
export async function createVehicle(
    data: VehicleFormData,
    imageFiles: File[]
): Promise<Vehicle> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Not authenticated');

    // Create vehicle with draft status
    const { data: vehicle, error } = await supabase
        .from('vehicles')
        .insert({
            ...data,
            owner_id: user.id,
            vehicle_status: 'draft',
        })
        .select()
        .single();

    if (error) throw error;

    // Upload images
    if (imageFiles.length > 0) {
        await uploadVehicleImages(vehicle.id, imageFiles);
    }

    return vehicle;
}

// Update vehicle
export async function updateVehicle(
    id: string,
    data: Partial<VehicleFormData>
): Promise<Vehicle> {
    const { data: vehicle, error } = await supabase
        .from('vehicles')
        .update(data)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return vehicle;
}

// Delete vehicle
export async function deleteVehicle(id: string): Promise<void> {
    // First, get all images to delete from storage
    const { data: images } = await supabase
        .from('vehicle_images')
        .select('image_url')
        .eq('vehicle_id', id);

    // Delete images from storage
    if (images && images.length > 0) {
        const filePaths = images.map((img) => {
            const url = new URL(img.image_url);
            return url.pathname.split('/vehicle-images/')[1];
        }).filter(Boolean);

        if (filePaths.length > 0) {
            await supabase.storage.from('vehicle-images').remove(filePaths);
        }
    }

    // Delete vehicle (images will cascade delete)
    const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', id);

    if (error) throw error;
}

// Upload vehicle images
export async function uploadVehicleImages(
    vehicleId: string,
    files: File[]
): Promise<VehicleImage[]> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Not authenticated');

    const uploadedImages: VehicleImage[] = [];

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${vehicleId}/${Date.now()}_${i}.${fileExt}`;

        // Upload to storage
        const { error: uploadError } = await supabase.storage
            .from('vehicle-images')
            .upload(fileName, file);

        if (uploadError) {
            console.error('Upload error:', uploadError);
            continue;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from('vehicle-images')
            .getPublicUrl(fileName);

        // Save to database
        const { data: imageRecord, error: dbError } = await supabase
            .from('vehicle_images')
            .insert({
                vehicle_id: vehicleId,
                image_url: urlData.publicUrl,
                is_primary: i === 0,
            })
            .select()
            .single();

        if (!dbError && imageRecord) {
            uploadedImages.push(imageRecord);
        }
    }

    return uploadedImages;
}

// Delete vehicle image
export async function deleteVehicleImage(imageId: string, imageUrl: string): Promise<void> {
    // Delete from storage
    try {
        const url = new URL(imageUrl);
        const filePath = url.pathname.split('/vehicle-images/')[1];
        if (filePath) {
            await supabase.storage.from('vehicle-images').remove([filePath]);
        }
    } catch (e) {
        console.error('Error deleting from storage:', e);
    }

    // Delete from database
    const { error } = await supabase
        .from('vehicle_images')
        .delete()
        .eq('id', imageId);

    if (error) throw error;
}

// Toggle vehicle active status
export async function toggleVehicleStatus(id: string, isActive: boolean): Promise<void> {
    const { error } = await supabase
        .from('vehicles')
        .update({ is_active: isActive })
        .eq('id', id);

    if (error) throw error;
}

// ================================
// PUBLIC VEHICLE BROWSING (Renter)
// ================================

export interface VehicleFilters {
    type?: 'car' | 'bike';
    minPrice?: number;
    maxPrice?: number;
    location?: string;
    sort?: 'price_asc' | 'price_desc' | 'newest';
    page?: number;
    limit?: number;
}

export interface VehicleSearchResult {
    vehicles: VehicleWithImages[];
    total: number;
    page: number;
    totalPages: number;
}

export interface VehicleWithOwner extends VehicleWithImages {
    owner?: {
        id: string;
        full_name: string;
        created_at: string;
    };
}

// Get active vehicles for public browsing with filters
export async function getActiveVehicles(filters: VehicleFilters = {}): Promise<VehicleSearchResult> {
    const {
        type,
        minPrice,
        maxPrice,
        location,
        sort = 'newest',
        page = 1,
        limit = 12,
    } = filters;

    // Build query - only show approved and active vehicles
    let query = supabase
        .from('vehicles')
        .select('*', { count: 'exact' })
        .eq('is_active', true)
        .eq('vehicle_status', 'approved');

    // Apply filters
    if (type) {
        query = query.eq('vehicle_type', type);
    }
    if (minPrice !== undefined) {
        query = query.gte('price_per_day', minPrice);
    }
    if (maxPrice !== undefined) {
        query = query.lte('price_per_day', maxPrice);
    }
    if (location) {
        query = query.ilike('location', `%${location}%`);
    }

    // Apply sorting
    switch (sort) {
        case 'price_asc':
            query = query.order('price_per_day', { ascending: true });
            break;
        case 'price_desc':
            query = query.order('price_per_day', { ascending: false });
            break;
        case 'newest':
        default:
            query = query.order('created_at', { ascending: false });
            break;
    }

    // Apply pagination
    const start = (page - 1) * limit;
    query = query.range(start, start + limit - 1);

    const { data: vehicles, error, count } = await query;

    if (error) throw error;

    // Fetch images for each vehicle
    const vehiclesWithImages = await Promise.all(
        (vehicles || []).map(async (vehicle) => {
            const { data: images } = await supabase
                .from('vehicle_images')
                .select('*')
                .eq('vehicle_id', vehicle.id)
                .order('is_primary', { ascending: false });

            return {
                ...vehicle,
                images: images || [],
            } as VehicleWithImages;
        })
    );

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    return {
        vehicles: vehiclesWithImages,
        total,
        page,
        totalPages,
    };
}

// Get vehicle details with owner info (for public detail page)
export async function getVehicleDetailsById(id: string): Promise<VehicleWithOwner | null> {
    const { data: vehicle, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .eq('vehicle_status', 'approved')
        .single();

    if (error || !vehicle) return null;

    // Fetch images
    const { data: images } = await supabase
        .from('vehicle_images')
        .select('*')
        .eq('vehicle_id', id)
        .order('is_primary', { ascending: false });

    // Fetch owner info
    const { data: owner } = await supabase
        .from('profiles')
        .select('id, full_name, created_at')
        .eq('id', vehicle.owner_id)
        .single();

    return {
        ...vehicle,
        images: images || [],
        owner: owner || undefined,
    } as VehicleWithOwner;
}

// Get min and max prices for filters
export async function getVehiclePriceRange(): Promise<{ min: number; max: number }> {
    const { data } = await supabase
        .from('vehicles')
        .select('price_per_day')
        .eq('is_active', true)
        .eq('vehicle_status', 'approved')
        .order('price_per_day', { ascending: true });

    if (!data || data.length === 0) {
        return { min: 0, max: 500 };
    }

    return {
        min: Math.floor(data[0].price_per_day),
        max: Math.ceil(data[data.length - 1].price_per_day),
    };
}

// ================================
// KYC DOCUMENT FUNCTIONS
// ================================

export type KYCDocumentType =
    | 'pan_card'
    | 'aadhaar_front'
    | 'aadhaar_back'
    | 'rc_front'
    | 'rc_back'
    | 'insurance';

// Upload KYC document
export async function uploadKYCDocument(
    vehicleId: string,
    documentType: KYCDocumentType,
    file: File
): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Not authenticated');

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${vehicleId}/kyc_${documentType}_${Date.now()}.${fileExt}`;

    // Upload to storage (using vehicle-images bucket for now)
    const { error: uploadError } = await supabase.storage
        .from('vehicle-images')
        .upload(fileName, file);

    if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error('Failed to upload document');
    }

    // Get public URL
    const { data: urlData } = supabase.storage
        .from('vehicle-images')
        .getPublicUrl(fileName);

    // Update vehicle with document URL
    const updateField = `${documentType}_url`;
    const { error: updateError } = await supabase
        .from('vehicles')
        .update({ [updateField]: urlData.publicUrl })
        .eq('id', vehicleId);

    if (updateError) {
        console.error('Update error:', updateError);
        throw new Error('Failed to save document reference');
    }

    return urlData.publicUrl;
}

// Update vehicle documents and submit for verification
export async function submitVehicleForVerification(
    vehicleId: string,
    data: {
        registration_number: string;
        owner_phone: string;
        owner_email: string;
    }
): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Not authenticated');

    // Verify vehicle belongs to user and has all required documents
    const { data: vehicle, error: fetchError } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', vehicleId)
        .eq('owner_id', user.id)
        .single();

    if (fetchError || !vehicle) {
        throw new Error('Vehicle not found');
    }

    // Check required documents
    const requiredDocs = [
        'pan_card_url',
        'aadhaar_front_url',
        'aadhaar_back_url',
        'rc_front_url',
        'rc_back_url',
        'insurance_url',
    ];

    const missingDocs = requiredDocs.filter(doc => !vehicle[doc]);
    if (missingDocs.length > 0) {
        throw new Error(`Missing required documents: ${missingDocs.join(', ')}`);
    }

    // Update vehicle status to pending verification
    const { error: updateError } = await supabase
        .from('vehicles')
        .update({
            ...data,
            vehicle_status: 'pending_verification',
        })
        .eq('id', vehicleId);

    if (updateError) {
        throw new Error('Failed to submit for verification');
    }
}

// Get vehicle documents status
export async function getVehicleDocumentsStatus(vehicleId: string): Promise<{
    hasAllDocuments: boolean;
    documents: Record<string, boolean>;
}> {
    const { data: vehicle, error } = await supabase
        .from('vehicles')
        .select('pan_card_url, aadhaar_front_url, aadhaar_back_url, rc_front_url, rc_back_url, insurance_url')
        .eq('id', vehicleId)
        .single();

    if (error || !vehicle) {
        return {
            hasAllDocuments: false,
            documents: {},
        };
    }

    const documents = {
        pan_card: !!vehicle.pan_card_url,
        aadhaar_front: !!vehicle.aadhaar_front_url,
        aadhaar_back: !!vehicle.aadhaar_back_url,
        rc_front: !!vehicle.rc_front_url,
        rc_back: !!vehicle.rc_back_url,
        insurance: !!vehicle.insurance_url,
    };

    return {
        hasAllDocuments: Object.values(documents).every(Boolean),
        documents,
    };
}

// ================================
// VEHICLE AVAILABILITY FUNCTIONS
// ================================

export interface VehicleAvailability {
    isAvailable: boolean;
    reason?: 'booked' | 'inactive' | 'not_approved';
    currentBooking?: {
        id: string;
        start_date: string;
        end_date: string;
        status: string;
    };
    nextAvailableDate?: string;
}

/**
 * Check if a vehicle is currently available for booking
 * A vehicle is NOT available if:
 * - It has an active booking (confirmed or ongoing) that overlaps with current time
 * - It's not active or not approved
 */
export async function checkVehicleAvailability(vehicleId: string): Promise<VehicleAvailability> {
    // First check if vehicle is active and approved
    const { data: vehicle, error: vehicleError } = await supabase
        .from('vehicles')
        .select('id, is_active, vehicle_status')
        .eq('id', vehicleId)
        .single();

    if (vehicleError || !vehicle) {
        return { isAvailable: false, reason: 'inactive' };
    }

    if (!vehicle.is_active) {
        return { isAvailable: false, reason: 'inactive' };
    }

    if (vehicle.vehicle_status !== 'approved') {
        return { isAvailable: false, reason: 'not_approved' };
    }

    // Check for overlapping active bookings
    const now = new Date().toISOString();
    
    const { data: activeBookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('id, start_date, end_date, status')
        .eq('vehicle_id', vehicleId)
        .in('status', ['confirmed', 'approved']) // Confirmed = paid, Approved = awaiting payment
        .gte('end_date', now) // Booking hasn't ended yet
        .order('start_date', { ascending: true });

    if (bookingsError) {
        console.error('Error checking availability:', bookingsError);
        return { isAvailable: true }; // Default to available on error
    }

    // Check if any booking overlaps with current time
    const currentTime = new Date();
    
    for (const booking of activeBookings || []) {
        const startDate = new Date(booking.start_date);
        const endDate = new Date(booking.end_date);
        
        // Check if current time falls within booking period
        if (currentTime >= startDate && currentTime <= endDate) {
            return {
                isAvailable: false,
                reason: 'booked',
                currentBooking: {
                    id: booking.id,
                    start_date: booking.start_date,
                    end_date: booking.end_date,
                    status: booking.status,
                },
                nextAvailableDate: booking.end_date,
            };
        }
    }

    return { isAvailable: true };
}

/**
 * Check if a vehicle is available for a specific date range
 */
export async function checkVehicleAvailabilityForDates(
    vehicleId: string,
    startDate: string,
    endDate: string
): Promise<{ isAvailable: boolean; conflictingBookings?: Array<{ start_date: string; end_date: string }> }> {
    const { data: conflictingBookings, error } = await supabase
        .from('bookings')
        .select('id, start_date, end_date, status')
        .eq('vehicle_id', vehicleId)
        .in('status', ['confirmed', 'approved', 'requested'])
        .or(`and(start_date.lte.${endDate},end_date.gte.${startDate})`);

    if (error) {
        console.error('Error checking date availability:', error);
        return { isAvailable: true };
    }

    if (conflictingBookings && conflictingBookings.length > 0) {
        return {
            isAvailable: false,
            conflictingBookings: conflictingBookings.map(b => ({
                start_date: b.start_date,
                end_date: b.end_date,
            })),
        };
    }

    return { isAvailable: true };
}

/**
 * Get all booked date ranges for a vehicle (for calendar display)
 */
export async function getVehicleBookedDates(vehicleId: string): Promise<Array<{ start: Date; end: Date }>> {
    const now = new Date().toISOString();
    
    const { data: bookings, error } = await supabase
        .from('bookings')
        .select('start_date, end_date')
        .eq('vehicle_id', vehicleId)
        .in('status', ['confirmed', 'approved', 'requested'])
        .gte('end_date', now);

    if (error || !bookings) {
        return [];
    }

    return bookings.map(b => ({
        start: new Date(b.start_date),
        end: new Date(b.end_date),
    }));
}

