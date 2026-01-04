import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Helper to verify admin role
async function verifyAdmin() {
    const cookieStore = await cookies();

    const supabase = createServerClient(
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

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized', status: 401 };

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'admin') {
        return { error: 'Forbidden', status: 403 };
    }

    return { user, supabase };
}

// GET /api/admin/vehicles - Get all vehicles with owner info
export async function GET() {
    const auth = await verifyAdmin();
    if ('error' in auth) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { supabase } = auth;

    try {
        // Simple query without FK join to avoid issues
        const { data: vehicles, error } = await supabase
            .from('vehicles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Fetch owner names separately
        const formattedVehicles = await Promise.all(
            (vehicles ?? []).map(async (v) => {
                const { data: owner } = await supabase
                    .from('profiles')
                    .select('full_name')
                    .eq('id', v.owner_id)
                    .single();

                return {
                    id: v.id,
                    title: v.title,
                    brand: v.brand,
                    model: v.model,
                    vehicle_type: v.vehicle_type,
                    price_per_day: v.price_per_day,
                    location: v.location,
                    is_active: v.is_active,
                    created_at: v.created_at,
                    owner_id: v.owner_id,
                    owner_name: owner?.full_name ?? 'Unknown',
                    // KYC fields
                    vehicle_status: v.vehicle_status || 'draft',
                    registration_number: v.registration_number,
                    owner_phone: v.owner_phone,
                    owner_email: v.owner_email,
                    pan_card_url: v.pan_card_url,
                    aadhaar_front_url: v.aadhaar_front_url,
                    aadhaar_back_url: v.aadhaar_back_url,
                    rc_front_url: v.rc_front_url,
                    rc_back_url: v.rc_back_url,
                    insurance_url: v.insurance_url,
                    rejection_reason: v.rejection_reason,
                };
            })
        );

        return NextResponse.json({ vehicles: formattedVehicles });
    } catch (error) {
        console.error('Error fetching vehicles:', error);
        return NextResponse.json({ error: 'Failed to fetch vehicles' }, { status: 500 });
    }
}

// PATCH /api/admin/vehicles - Activate/deactivate vehicle
export async function PATCH(request: NextRequest) {
    const auth = await verifyAdmin();
    if ('error' in auth) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { supabase } = auth;

    try {
        const body = await request.json();
        const { vehicleId, isActive } = body;

        if (!vehicleId || typeof isActive !== 'boolean') {
            return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
        }

        // Update vehicle and return the updated row to verify it worked
        const { data: updatedVehicle, error } = await supabase
            .from('vehicles')
            .update({ is_active: isActive })
            .eq('id', vehicleId)
            .select('id, is_active')
            .single();

        if (error) {
            throw error;
        }

        if (!updatedVehicle) {
            return NextResponse.json({
                error: 'Vehicle update failed - you may not have permission to update this vehicle',
                hint: 'Add RLS policy: CREATE POLICY "Admin can update any vehicle" ON vehicles FOR UPDATE USING (is_admin());'
            }, { status: 403 });
        }

        return NextResponse.json({
            success: true,
            message: isActive ? 'Vehicle activated' : 'Vehicle deactivated',
            vehicle: updatedVehicle
        });
    } catch {
        return NextResponse.json({ error: 'Failed to update vehicle' }, { status: 500 });
    }
}

// POST /api/admin/vehicles - Approve or reject vehicle
export async function POST(request: NextRequest) {
    const auth = await verifyAdmin();
    if ('error' in auth) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { supabase, user } = auth;

    try {
        const body = await request.json();
        const { vehicleId, action, rejectionReason } = body;

        if (!vehicleId || !action) {
            return NextResponse.json({ error: 'Vehicle ID and action are required' }, { status: 400 });
        }

        if (!['approve', 'reject'].includes(action)) {
            return NextResponse.json({ error: 'Action must be approve or reject' }, { status: 400 });
        }

        if (action === 'reject' && !rejectionReason) {
            return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 });
        }

        // Get current vehicle status
        const { data: vehicle, error: fetchError } = await supabase
            .from('vehicles')
            .select('vehicle_status')
            .eq('id', vehicleId)
            .single();

        if (fetchError || !vehicle) {
            return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
        }

        if (vehicle.vehicle_status !== 'pending_verification') {
            return NextResponse.json({
                error: 'Only vehicles with pending_verification status can be reviewed'
            }, { status: 400 });
        }

        // Update vehicle status
        const updateData = action === 'approve'
            ? {
                vehicle_status: 'approved',
                is_active: true,
                verified_at: new Date().toISOString(),
                verified_by_admin_id: user.id,
                rejection_reason: null,
            }
            : {
                vehicle_status: 'rejected',
                is_active: false,
                rejection_reason: rejectionReason,
            };

        const { error: updateError } = await supabase
            .from('vehicles')
            .update(updateData)
            .eq('id', vehicleId);

        if (updateError) {
            console.error('Error updating vehicle:', updateError);
            throw updateError;
        }

        return NextResponse.json({
            success: true,
            message: action === 'approve' ? 'Vehicle approved and now live' : 'Vehicle rejected',
        });
    } catch (error) {
        console.error('Error processing vehicle review:', error);
        return NextResponse.json({ error: 'Failed to process review' }, { status: 500 });
    }
}
