import { NextRequest, NextResponse } from 'next/server';
import { createServerClientFromRequest } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerClientFromRequest(req);
    if (supabase) {
      await supabase.auth.signOut();
    }

    const res = NextResponse.json({ success: true });
    // Clear legacy / custom cookies if present
    res.cookies.delete('bridgewell_session');
    res.cookies.delete('bridgewell_email');
    return res;
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000';
  try {
    const supabase = createServerClientFromRequest(req);
    if (supabase) {
      await supabase.auth.signOut();
    }
  } catch {
    // Ignore
  }

  const res = NextResponse.redirect(new URL('/', appUrl));
  res.cookies.delete('bridgewell_session');
  res.cookies.delete('bridgewell_email');
  return res;
}
