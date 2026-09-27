import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/db/client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req: NextRequest) {
  try {
    const { email, redirectTo } = await req.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'A valid email address is required' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.APP_URL ||
      'http://localhost:3000';

    let callbackUrl = `${appUrl}/auth/callback`;
    if (redirectTo) {
      try {
        const u = new URL(redirectTo, appUrl);
        const nextParam = `${u.pathname}${u.search}`;
        callbackUrl = `${appUrl}/auth/callback?next=${encodeURIComponent(nextParam)}`;
      } catch {
        // Fallback to default
      }
    }

    if (supabase) {
      const { error } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          emailRedirectTo: callbackUrl,
        },
      });

      if (error) {
        console.error('Supabase signInWithOtp error:', error);
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 400 }
        );
      }
    } else {
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json(
          { success: false, error: 'Authentication service is currently unavailable.' },
          { status: 503 }
        );
      }
      console.warn('Supabase client not configured; simulated email OTP dispatch in development');
    }

    return NextResponse.json({
      success: true,
      message: `Sign-in link sent to ${cleanEmail}`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to dispatch magic link' },
      { status: 500 }
    );
  }
}
