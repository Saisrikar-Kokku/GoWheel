// Ride Inspection Service - Image upload and management for ride security

import { createBrowserClient } from '@supabase/ssr';
import {
    RideInspectionImage,
    ImagePosition,
    InspectionType,
    InspectionValidation,
    REQUIRED_PRE_RIDE_POSITIONS,
} from '@/types/rideInspection';

const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Storage bucket name
const INSPECTION_BUCKET = 'ride-inspections';

/**
 * Upload a ride inspection image
 */
export async function uploadInspectionImage(
    bookingId: string,
    position: ImagePosition,
    inspectionType: InspectionType,
    file: File,
    notes?: string
): Promise<RideInspectionImage> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get user's role
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    const uploadedByRole = profile?.role === 'owner' ? 'owner' : 'renter';

    // Validate file
    validateImageFile(file);

    // Generate unique filename
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${bookingId}/${inspectionType}/${position}_${Date.now()}.${fileExt}`;

    // Upload to storage
    const { error: uploadError } = await supabase.storage
        .from(INSPECTION_BUCKET)
        .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false,
        });

    if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error('Failed to upload image. Please try again.');
    }

    // Get public URL
    const { data: urlData } = supabase.storage
        .from(INSPECTION_BUCKET)
        .getPublicUrl(fileName);

    // Save to database
    const { data: imageRecord, error: dbError } = await supabase
        .from('ride_inspection_images')
        .insert({
            booking_id: bookingId,
            image_url: urlData.publicUrl,
            position,
            inspection_type: inspectionType,
            uploaded_by: user.id,
            uploaded_by_role: uploadedByRole,
            notes: notes || null,
        })
        .select()
        .single();

    if (dbError) {
        console.error('Database error:', dbError);
        // Try to clean up uploaded file
        await supabase.storage.from(INSPECTION_BUCKET).remove([fileName]);
        throw new Error('Failed to save image record');
    }

    return imageRecord;
}

/**
 * Get all inspection images for a booking
 */
export async function getInspectionImages(
    bookingId: string,
    inspectionType?: InspectionType
): Promise<RideInspectionImage[]> {
    let query = supabase
        .from('ride_inspection_images')
        .select('*')
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: true });

    if (inspectionType) {
        query = query.eq('inspection_type', inspectionType);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching inspection images:', error);
        throw error;
    }

    return data || [];
}

/**
 * Validate if pre-ride inspection is complete (all required images uploaded)
 */
export async function validatePreRideInspection(bookingId: string): Promise<InspectionValidation> {
    const images = await getInspectionImages(bookingId, 'pre_ride');
    
    const uploadedPositions = images.map(img => img.position);
    const missingPositions = REQUIRED_PRE_RIDE_POSITIONS.filter(
        pos => !uploadedPositions.includes(pos)
    );

    return {
        isComplete: missingPositions.length === 0,
        missingPositions,
        uploadedPositions,
    };
}

/**
 * Delete an inspection image
 */
export async function deleteInspectionImage(imageId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get image details first
    const { data: image, error: fetchError } = await supabase
        .from('ride_inspection_images')
        .select('*')
        .eq('id', imageId)
        .single();

    if (fetchError || !image) {
        throw new Error('Image not found');
    }

    // Only allow the uploader to delete
    if (image.uploaded_by !== user.id) {
        throw new Error('Not authorized to delete this image');
    }

    // Delete from storage
    try {
        const url = new URL(image.image_url);
        const filePath = url.pathname.split(`/${INSPECTION_BUCKET}/`)[1];
        if (filePath) {
            await supabase.storage.from(INSPECTION_BUCKET).remove([filePath]);
        }
    } catch (e) {
        console.error('Error deleting from storage:', e);
    }

    // Delete from database
    const { error: deleteError } = await supabase
        .from('ride_inspection_images')
        .delete()
        .eq('id', imageId);

    if (deleteError) {
        throw new Error('Failed to delete image record');
    }
}

/**
 * Validate image file before upload
 */
function validateImageFile(file: File): void {
    // Allowed types
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
        throw new Error('Invalid file type. Please upload JPG, PNG, or WebP images.');
    }

    // Max size: 10MB
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
        throw new Error('File too large. Maximum size is 10MB.');
    }
}

/**
 * Get inspection status for a booking
 */
export async function getInspectionStatus(bookingId: string): Promise<{
    preRide: InspectionValidation;
    postRide: InspectionValidation;
    totalImages: number;
}> {
    const allImages = await getInspectionImages(bookingId);
    
    const preRideImages = allImages.filter(img => img.inspection_type === 'pre_ride');
    const postRideImages = allImages.filter(img => img.inspection_type === 'post_ride');

    const preRideUploadedPositions = preRideImages.map(img => img.position);
    const postRideUploadedPositions = postRideImages.map(img => img.position);

    return {
        preRide: {
            isComplete: REQUIRED_PRE_RIDE_POSITIONS.every(pos => preRideUploadedPositions.includes(pos)),
            missingPositions: REQUIRED_PRE_RIDE_POSITIONS.filter(pos => !preRideUploadedPositions.includes(pos)),
            uploadedPositions: preRideUploadedPositions,
        },
        postRide: {
            isComplete: REQUIRED_PRE_RIDE_POSITIONS.every(pos => postRideUploadedPositions.includes(pos)),
            missingPositions: REQUIRED_PRE_RIDE_POSITIONS.filter(pos => !postRideUploadedPositions.includes(pos)),
            uploadedPositions: postRideUploadedPositions,
        },
        totalImages: allImages.length,
    };
}
