// Ride inspection service — mirrors the website, adapted for React Native image picker

import { supabase } from '@/lib/supabase';
import { RideInspectionImage, ImagePosition, InspectionType, InspectionValidation, REQUIRED_PRE_RIDE_POSITIONS } from '@/types/rideInspection';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';

const INSPECTION_BUCKET = 'ride-inspections';

export async function uploadInspectionImage(
    bookingId: string,
    position: ImagePosition,
    inspectionType: InspectionType,
    uri: string,
    fileName: string,
    mimeType: string,
    notes?: string
): Promise<RideInspectionImage> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    const uploadedByRole = profile?.role === 'owner' ? 'owner' : 'renter';

    const fileExt = fileName.split('.').pop()?.toLowerCase() || 'jpg';


    // ...

    // PREFIX WITH USER ID to match RLS policies (update/delete require root folder = uid)
    const storagePath = `${user.id}/${bookingId}/${inspectionType}/${position}_${Date.now()}.${fileExt}`;

    // Read file as base64 and convert to ArrayBuffer
    const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
    const arrayBuffer = decode(base64);

    const { error: uploadError } = await supabase.storage
        .from(INSPECTION_BUCKET)
        .upload(storagePath, arrayBuffer, {
            contentType: mimeType,
            cacheControl: '3600',
            upsert: false,
        });

    if (uploadError) {
        console.error('Upload Direct Storage Error:', uploadError);
        throw new Error(`Failed to upload image to storage: ${uploadError.message}`);
    }

    const { data: urlData } = supabase.storage.from(INSPECTION_BUCKET).getPublicUrl(storagePath);

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
        console.error('Database Insert Error:', dbError);
        await supabase.storage.from(INSPECTION_BUCKET).remove([storagePath]);
        throw new Error(`Failed to save image record: ${dbError.message}`);
    }

    return imageRecord;
}

export async function getInspectionImages(bookingId: string, inspectionType?: InspectionType): Promise<RideInspectionImage[]> {
    let query = supabase.from('ride_inspection_images').select('*').eq('booking_id', bookingId).order('created_at', { ascending: true });
    if (inspectionType) query = query.eq('inspection_type', inspectionType);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
}

export async function validatePreRideInspection(bookingId: string): Promise<InspectionValidation> {
    const images = await getInspectionImages(bookingId, 'pre_ride');
    const uploadedPositions = images.map(img => img.position);
    const missingPositions = REQUIRED_PRE_RIDE_POSITIONS.filter(pos => !uploadedPositions.includes(pos));
    return { isComplete: missingPositions.length === 0, missingPositions, uploadedPositions };
}

export async function deleteInspectionImage(imageId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: image } = await supabase.from('ride_inspection_images').select('*').eq('id', imageId).single();
    if (!image) throw new Error('Image not found');
    if (image.uploaded_by !== user.id) throw new Error('Not authorized');

    try {
        const url = new URL(image.image_url);
        // Extract path after /ride-inspections/
        // URL is like: .../storage/v1/object/public/ride-inspections/USER_ID/BOOKING_ID/...
        // The previous split was by bucket name, which works.
        const pathParts = url.pathname.split(`/${INSPECTION_BUCKET}/`);
        if (pathParts.length > 1) {
            const filePath = decodeURIComponent(pathParts[1]); // decode in case of spaces etc
            await supabase.storage.from(INSPECTION_BUCKET).remove([filePath]);
        }
    } catch (e) { console.error('Storage delete error:', e); }

    const { error } = await supabase.from('ride_inspection_images').delete().eq('id', imageId);
    if (error) throw new Error('Failed to delete image');
}

export async function getInspectionStatus(bookingId: string) {
    const allImages = await getInspectionImages(bookingId);
    const preRideImages = allImages.filter(img => img.inspection_type === 'pre_ride');
    const postRideImages = allImages.filter(img => img.inspection_type === 'post_ride');
    const preRideUploaded = preRideImages.map(img => img.position);
    const postRideUploaded = postRideImages.map(img => img.position);

    return {
        preRide: {
            isComplete: REQUIRED_PRE_RIDE_POSITIONS.every(pos => preRideUploaded.includes(pos)),
            missingPositions: REQUIRED_PRE_RIDE_POSITIONS.filter(pos => !preRideUploaded.includes(pos)),
            uploadedPositions: preRideUploaded,
        },
        postRide: {
            isComplete: REQUIRED_PRE_RIDE_POSITIONS.every(pos => postRideUploaded.includes(pos)),
            missingPositions: REQUIRED_PRE_RIDE_POSITIONS.filter(pos => !postRideUploaded.includes(pos)),
            uploadedPositions: postRideUploaded,
        },
        totalImages: allImages.length,
    };
}

/**
 * Confirm pre-ride inspection: validates all required photos are uploaded,
 * then updates booking ride_status to 'photos_uploaded'.
 * Mirrors website's /api/ride/inspection/confirm endpoint.
 */
export async function confirmInspection(bookingId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Validate all required photos
    const validation = await validatePreRideInspection(bookingId);
    if (!validation.isComplete) {
        throw new Error(`Missing required photos: ${validation.missingPositions.join(', ')}`);
    }

    // Update booking ride_status to photos_uploaded
    const { error } = await supabase
        .from('bookings')
        .update({ ride_status: 'photos_uploaded' })
        .eq('id', bookingId);

    if (error) throw new Error('Failed to update ride status');
}
