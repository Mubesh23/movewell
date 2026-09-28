import { NextRequest, NextResponse } from 'next/server';
import { createServerClientFromRequest } from '@/lib/supabase/server';

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

    const callbackUrl = new URL(`${appUrl}/auth/callback`);
    const targetRedirect = searchParams.get('redirectTo');
    const intent = searchParams.get('intent');
    const draftId = searchParams.get('draftId');
    const token = searchParams.get('token') || searchParams.get('inviteToken');

    if (intent) {
      callbackUrl.searchParams.set('intent', intent);
    }
    if (draftId) {
      callbackUrl.searchParams.set('draftId', draftId);
    }
    if (token) {
      callbackUrl.searchParams.set('inviteToken', token);
    }

    if (targetRedirect) {
      try {
        const u = new URL(targetRedirect, appUrl);
        const nextParam = `${u.pathname}${u.search}`;
        callbackUrl.searchParams.set('next', nextParam);
      } catch {
        // Fallback
      }
    } else if (!intent) {
      callbackUrl.searchParams.set('next', '/home');
    }

    const redirectTo = callbackUrl.toString();

    const supabase = createServerClientFromRequest(req);
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
