import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/db/client';
import { SESSION_COOKIE_NAME, LEGACY_COOKIE_NAME } from '@/lib/auth-helper';
import { draftService } from '@/services/draft-service';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const requestUrl = new URL(req.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/';

  const response = NextResponse.redirect(new URL(next, req.url));

  if (code && supabase) {
    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (data?.session?.user?.id && !error) {
        const userId = data.session.user.id;

        // Set session cookies
        response.cookies.set(SESSION_COOKIE_NAME, userId, {
          path: '/',
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 30 * 24 * 60 * 60,
          sameSite: 'lax',
        });
        response.cookies.set(LEGACY_COOKIE_NAME, userId, {
          path: '/',
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 30 * 24 * 60 * 60,
          sameSite: 'lax',
        });

        // Link pending draft if anonymous draft token exists in cookies
        const previousSessionToken =
          req.cookies.get(SESSION_COOKIE_NAME)?.value ||
          req.cookies.get(LEGACY_COOKIE_NAME)?.value;

        const draftIdMatch = next.match(/\/draft\/([^/?#]+)/);
        if (draftIdMatch && draftIdMatch[1] && previousSessionToken) {
          try {
            await draftService.claimDraft(draftIdMatch[1], previousSessionToken, userId);
          } catch (claimErr) {
            console.warn('Could not auto-claim draft during auth callback:', claimErr);
          }
        }
      }
    } catch (exchangeErr) {
      console.error('Error exchanging Supabase auth code:', exchangeErr);
    }
  }

  return response;
}
