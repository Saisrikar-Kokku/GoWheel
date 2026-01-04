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

// GET /api/admin/users - Get all users
export async function GET() {
    const auth = await verifyAdmin();
    if ('error' in auth) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { supabase } = auth;

    try {
        // Fetch all profiles - RLS should allow admin to see all
        const { data: users, error } = await supabase
            .from('profiles')
            .select('id, full_name, role, created_at, is_blocked')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching users:', error);
            throw error;
        }

        // Handle case where is_blocked column might not exist
        const formattedUsers = (users ?? []).map(u => ({
            ...u,
            is_blocked: u.is_blocked ?? false,
        }));

        return NextResponse.json({ users: formattedUsers });
    } catch (error) {
        console.error('Error in users API:', error);
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }
}

// PATCH /api/admin/users - Block/unblock user
export async function PATCH(request: NextRequest) {
    const auth = await verifyAdmin();
    if ('error' in auth) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { supabase, user: adminUser } = auth;

    try {
        const body = await request.json();
        const { userId, isBlocked } = body;

        if (!userId || typeof isBlocked !== 'boolean') {
            return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
        }

        // Prevent admin from blocking themselves
        if (userId === adminUser.id) {
            return NextResponse.json({ error: 'Cannot block yourself' }, { status: 400 });
        }

        const { error } = await supabase
            .from('profiles')
            .update({ is_blocked: isBlocked })
            .eq('id', userId);

        if (error) throw error;

        return NextResponse.json({
            success: true,
            message: isBlocked ? 'User blocked' : 'User unblocked'
        });
    } catch (error) {
        console.error('Error updating user:', error);
        return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }
}
