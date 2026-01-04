import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const next = requestUrl.searchParams.get('next') || '/dashboard';
    const type = requestUrl.searchParams.get('type');

    // Check if this is a recovery (password reset) flow
    const isRecovery = type === 'recovery';

    if (code) {
        const supabase = await createClient();

        // Exchange code for session on the server side (handles PKCE properly)
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error && data.session) {
            // If this is a password recovery flow, redirect to reset password page
            if (isRecovery) {
                const response = NextResponse.redirect(
                    new URL('/auth/reset-password?valid=true', requestUrl.origin)
                );
                // Clear the pending cookie
                response.cookies.delete('password_reset_pending');
                return response;
            }

            // Normal auth flow - redirect to dashboard or next page
            return NextResponse.redirect(new URL(next, requestUrl.origin));
        }

        // If code exchange failed, log error and redirect to auth with error
        console.error('Code exchange error:', error);
    }

    // If there's an error or no code, redirect to auth page with error
    return NextResponse.redirect(new URL('/auth?error=auth_callback_error', requestUrl.origin));
}
