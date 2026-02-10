// API Route: Upload Ride Inspection Image
// POST /api/ride/inspection/upload

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { ImagePosition, InspectionType, REQUIRED_PRE_RIDE_POSITIONS } from '@/types/rideInspection';

const INSPECTION_BUCKET = 'ride-inspections';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get('Authorization');
        let supabase;
        let accessToken: string | undefined;

        if (authHeader) {
            accessToken = authHeader.replace('Bearer ', '');
            supabase = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                { global: { headers: { Authorization: authHeader } } }
            );
        } else {
            const cookieStore = await cookies();
            supabase = createServerClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                {
                    cookies: {
                        getAll() {
                            return cookieStore.getAll();
                        },
                        setAll(cookiesToSet) {
                            cookiesToSet.forEach(({ name, value, options }) => {
                                cookieStore.set(name, value, options);
                            });
                        },
                    },
                }
            );
        }

        // Verify user is authenticated - pass token explicitly for mobile requests
        const { data: { user } } = await supabase.auth.getUser(accessToken);
        if (!user) {
            console.error('Upload API: User not authenticated');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        console.log('Upload API: User authenticated', user.id);

        // Parse form data
        const formData = await request.formData();
        const bookingId = formData.get('bookingId') as string;
        const position = formData.get('position') as ImagePosition;
        const inspectionType = formData.get('inspectionType') as InspectionType;
        const file = formData.get('file') as File;
        const notes = formData.get('notes') as string | null;

        console.log('Upload API: Received data', { bookingId, position, inspectionType, fileSize: file?.size });

        // Validate required fields
        if (!bookingId || !position || !inspectionType || !file) {
            return NextResponse.json({
                error: 'Missing required fields: bookingId, position, inspectionType, file'
            }, { status: 400 });
        }

        // Validate position
        const validPositions: ImagePosition[] = ['front', 'left', 'right', 'back', 'meter', 'damage'];
        if (!validPositions.includes(position)) {
            return NextResponse.json({ error: 'Invalid position' }, { status: 400 });
        }

        // Validate inspection type
        if (!['pre_ride', 'post_ride'].includes(inspectionType)) {
            return NextResponse.json({ error: 'Invalid inspection type' }, { status: 400 });
        }

        // Validate file type
        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json({
                error: 'Invalid file type. Allowed: JPG, PNG, WebP'
            }, { status: 400 });
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json({
                error: 'File too large. Maximum size is 10MB'
            }, { status: 400 });
        }

        // Fetch booking to verify access
        const { data: booking, error: bookingError } = await supabase
            .from('bookings')
            .select('*')
            .eq('id', bookingId)
            .single();

        if (bookingError || !booking) {
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }

        // Verify user is participant in booking
        if (booking.renter_id !== user.id && booking.owner_id !== user.id) {
            return NextResponse.json({ error: 'Not authorized for this booking' }, { status: 403 });
        }

        // Determine uploader role
        const uploadedByRole = booking.owner_id === user.id ? 'owner' : 'renter';

        // For pre_ride inspection, only renter should upload
        if (inspectionType === 'pre_ride' && uploadedByRole !== 'renter') {
            return NextResponse.json({
                error: 'Pre-ride inspection images must be uploaded by the renter'
            }, { status: 403 });
        }

        // Check booking status for pre_ride
        if (inspectionType === 'pre_ride' && booking.status !== 'confirmed') {
            return NextResponse.json({
                error: 'Booking must be confirmed for pre-ride inspection'
            }, { status: 400 });
        }

        // Generate unique filename
        const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
        const fileName = `${bookingId}/${inspectionType}/${position}_${Date.now()}.${fileExt}`;

        // Convert File to ArrayBuffer for upload
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Upload to storage
        const { error: uploadError } = await supabase.storage
            .from(INSPECTION_BUCKET)
            .upload(fileName, buffer, {
                contentType: file.type,
                cacheControl: '3600',
                upsert: false,
            });

        if (uploadError) {
            console.error('Upload API: Storage error:', uploadError);
            return NextResponse.json({ error: `Failed to upload image: ${uploadError.message}` }, { status: 500 });
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
            console.error('Upload API: DB error:', dbError);
            // Clean up uploaded file
            await supabase.storage.from(INSPECTION_BUCKET).remove([fileName]);
            return NextResponse.json({ error: 'Failed to save image record' }, { status: 500 });
        }

        // Check if pre_ride inspection is now complete
        let inspectionComplete = false;
        if (inspectionType === 'pre_ride') {
            const { data: allImages } = await supabase
                .from('ride_inspection_images')
                .select('position')
                .eq('booking_id', bookingId)
                .eq('inspection_type', 'pre_ride');

            const uploadedPositions = (allImages || []).map(img => img.position);
            inspectionComplete = REQUIRED_PRE_RIDE_POSITIONS.every(
                pos => uploadedPositions.includes(pos)
            );
        }

        return NextResponse.json({
            success: true,
            image: imageRecord,
            inspectionComplete,
            message: inspectionComplete
                ? 'All required images uploaded. You can now request the start OTP from the owner.'
                : 'Image uploaded successfully.',
        });

    } catch (error) {
        console.error('Upload API: Internal Fatal Error:', error);
        return NextResponse.json({ error: `Internal server error: ${error instanceof Error ? error.message : String(error)}` }, { status: 500 });
    }
}
