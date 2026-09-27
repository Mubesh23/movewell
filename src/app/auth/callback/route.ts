import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { GUEST_COOKIE_NAME, SESSION_COOKIE_NAME, LEGACY_COOKIE_NAME } from '@/lib/auth-helper';
import { draftService } from '@/services/draft-service';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Sanitizes the 'next' parameter to prevent open redirect vulnerabilities.
 * Strictly requires relative paths matching safe application prefixes.
 */
function sanitizeNextUrl(rawNext: string | null): string {
  if (!rawNext) return '/';
  const trimmed = rawNext.trim();

  // Block protocol-relative (//example.com) or backslash evasion (/\example.com)
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.startsWith('/\\')) {
    return '/';
  }

  // Whitelist safe internal route roots
  const safePrefixes = ['/draft/', '/plan/', '/invite/', '/start', '/get-started', '/'];
  const isSafe = safePrefixes.some((prefix) => trimmed === prefix || trimmed.startsWith(prefix));
  return isSafe ? trimmed : '/';
}

export async function GET(req: NextRequest) {
  const requestUrl = new URL(req.url);
  const code = requestUrl.searchParams.get('code');
  const next = sanitizeNextUrl(requestUrl.searchParams.get('next'));

  const response = NextResponse.redirect(new URL(next, req.url));

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (code && supabaseUrl && supabaseAnonKey) {
    const cookieStore = cookies();
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
            response.cookies.set(name, value, options);
          });
        },
      },
    });

    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (data?.session?.user?.id && !error) {
        const userId = data.session.user.id;

        // Auto-claim pending draft if guest token exists in incoming cookies
        const previousGuestToken =
          req.cookies.get(GUEST_COOKIE_NAME)?.value ||
          req.cookies.get(SESSION_COOKIE_NAME)?.value ||
          req.cookies.get(LEGACY_COOKIE_NAME)?.value;

        const draftIdMatch = next.match(/\/draft\/([^/?#]+)/);
        if (draftIdMatch && draftIdMatch[1] && previousGuestToken) {
          try {
            await draftService.claimDraft(draftIdMatch[1], previousGuestToken, userId);
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
