import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    );
                    supabaseResponse = NextResponse.next({
                        request,
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    // Get user session
    const {
        data: { user },
    } = await supabase.auth.getUser();

    const pathname = request.nextUrl.pathname;

    // Define protected routes
    const protectedRoutes = ['/dashboard'];
    const authRoutes = ['/auth'];

    // Check if current path is protected
    const isProtectedRoute = protectedRoutes.some((route) =>
        pathname.startsWith(route)
    );
    const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

    // Redirect unauthenticated users away from protected routes
    if (isProtectedRoute && !user) {
        const redirectUrl = new URL('/auth', request.url);
        redirectUrl.searchParams.set('redirectTo', pathname);
        return NextResponse.redirect(redirectUrl);
    }

    // Redirect authenticated users away from auth pages to dashboard
    // EXCEPT for reset-password page (needed for password reset flow)
    if (isAuthRoute && user && !pathname.includes('/auth/reset-password') && !pathname.includes('/auth/callback')) {
        // Fetch user profile to get role
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        const role = profile?.role || 'renter';
        return NextResponse.redirect(new URL(`/dashboard/${role}`, request.url));
    }

    // Role-based dashboard protection
    if (pathname.startsWith('/dashboard/')) {
        if (!user) {
            return NextResponse.redirect(new URL('/auth', request.url));
        }

        // Fetch user profile to check role
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        const userRole = profile?.role || 'renter';
        const requestedRole = pathname.split('/dashboard/')[1]?.split('/')[0];

        // Block access to other role's dashboard
        if (requestedRole && requestedRole !== userRole) {
            return NextResponse.redirect(
                new URL(`/dashboard/${userRole}`, request.url)
            );
        }
    }

    return supabaseResponse;
}
