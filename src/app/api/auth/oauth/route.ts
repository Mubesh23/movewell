import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/db/client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const provider = (searchParams.get('provider') || 'google') as 'google';
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.APP_URL ||
      'http://localhost:3000';

    let redirectTo = `${appUrl}/auth/callback`;
    const targetRedirect = searchParams.get('redirectTo');
    if (targetRedirect) {
      try {
        const u = new URL(targetRedirect, appUrl);
        const nextParam = `${u.pathname}${u.search}`;
        redirectTo = `${appUrl}/auth/callback?next=${encodeURIComponent(nextParam)}`;
      } catch {
        // Fallback to default
      }
    }

    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Authentication service unavailable' },
        { status: 503 }
      );
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error || !data.url) {
      return NextResponse.json(
        { success: false, error: error?.message || 'Failed to initiate OAuth flow' },
        { status: 400 }
      );
    }

    // Proactively verify whether this provider is enabled in Supabase
    try {
      const probeRes = await fetch(data.url, { method: 'GET', redirect: 'manual' });
      if (probeRes.status === 400) {
        const probeJson = await probeRes.json().catch(() => null);
        if (
          probeJson?.error_code === 'validation_failed' ||
          probeJson?.msg?.toLowerCase().includes('not enabled')
        ) {
          return NextResponse.json(
            {
              success: false,
              providerNotEnabled: true,
              error:
                'Google sign-in is not enabled on this Supabase project yet. Please enter your email to receive a passwordless sign-in link.',
            },
            { status: 400 }
          );
        }
      }
    } catch {
      // Proceed if network probe fails
    }

    return NextResponse.json({ success: true, url: data.url });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'OAuth error' },
      { status: 500 }
    );
  }
}
