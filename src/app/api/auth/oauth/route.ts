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
    const redirectTo = searchParams.get('redirectTo') || `${appUrl}/auth/callback`;

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

    return NextResponse.json({ success: true, url: data.url });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'OAuth error' },
      { status: 500 }
    );
  }
}
