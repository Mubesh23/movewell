import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { GUEST_COOKIE_NAME, SESSION_COOKIE_NAME, LEGACY_COOKIE_NAME } from '@/lib/auth-helper';
import { draftService } from '@/services/draft-service';
import { invitationService } from '@/services/invitation-service';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Sanitizes the 'next' parameter to prevent open redirect vulnerabilities.
 * Strictly requires relative paths matching safe application prefixes.
 */
function sanitizeNextUrl(rawNext: string | null): string {
  if (!rawNext) return '/home';
  const trimmed = rawNext.trim();

  // Block protocol-relative (//example.com) or backslash evasion (/\example.com)
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.startsWith('/\\')) {
    return '/home';
  }

  // Whitelist safe internal route roots
  const safePrefixes = ['/home', '/draft/', '/plan/', '/invite/', '/start', '/get-started', '/'];
  const isSafe = safePrefixes.some((prefix) => trimmed === prefix || trimmed.startsWith(prefix));
  if (!isSafe) return '/home';
  if (trimmed === '/') return '/home';
  return trimmed;
}

export async function GET(req: NextRequest) {
  const requestUrl = new URL(req.url);
  const code = requestUrl.searchParams.get('code');
  const rawNext = requestUrl.searchParams.get('next');
  const intent = requestUrl.searchParams.get('intent');
  const draftIdParam = requestUrl.searchParams.get('draftId');
  const inviteTokenParam = requestUrl.searchParams.get('inviteToken') || requestUrl.searchParams.get('token');

  let next = sanitizeNextUrl(rawNext);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (code && supabaseUrl && supabaseAnonKey) {
    const cookieStore = cookies();
    const responseCookiesToSet: Array<{ name: string; value: string; options?: any }> = [];

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
            responseCookiesToSet.push({ name, value, options });
          });
        },
      },
    });

    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (data?.session?.user?.id && !error) {
        const userId = data.session.user.id;
        const userEmail = data.session.user.email || '';

        const previousGuestToken =
          req.cookies.get(GUEST_COOKIE_NAME)?.value ||
          req.cookies.get(SESSION_COOKIE_NAME)?.value ||
          req.cookies.get(LEGACY_COOKIE_NAME)?.value;

        // 1. Resume Draft Activation if explicitly requested
        if (intent === 'activate' && draftIdParam) {
          try {
            if (previousGuestToken) {
              await draftService.claimDraft(draftIdParam, previousGuestToken, userId);
            }
            const activatedCase = await draftService.activateDraft(draftIdParam, userId);
            next = `/plan/${activatedCase.caseId}`;
          } catch (activateErr) {
            console.error('Failed to resume draft activation after OAuth:', activateErr);
            next = `/draft/${draftIdParam}?error=activation_failed`;
          }
        }
        // 2. Resume Invitation Acceptance if explicitly requested
        else if (intent === 'accept_invite' && inviteTokenParam) {
          try {
            const validation = await invitationService.validateInvitation(inviteTokenParam);
            if (validation.valid && validation.invitation) {
              const invitedEmail = validation.invitation.email?.toLowerCase().trim();
              const currentEmail = userEmail.toLowerCase().trim();
              if (invitedEmail && currentEmail && invitedEmail !== currentEmail) {
                next = `/invite/${inviteTokenParam}?mismatch=true&invited=${encodeURIComponent(invitedEmail)}&current=${encodeURIComponent(currentEmail)}`;
              } else {
                const acceptResult = await invitationService.acceptInvitation(inviteTokenParam, userId);
                next = `/plan/${acceptResult.caseId}`;
              }
            } else {
              next = `/invite/${inviteTokenParam}`;
            }
          } catch (inviteErr) {
            console.error('Failed to resume invitation acceptance after OAuth:', inviteErr);
            next = `/invite/${inviteTokenParam}`;
          }
        }
        // 3. Normal navigation: auto-claim draft if navigating to /draft/{id}
        else {
          const draftIdMatch = next.match(/\/draft\/([^/?#]+)/);
          if (draftIdMatch && draftIdMatch[1] && previousGuestToken) {
            try {
              await draftService.claimDraft(draftIdMatch[1], previousGuestToken, userId);
            } catch (claimErr) {
              console.warn('Could not auto-claim draft during auth callback:', claimErr);
            }
          }
        }
      }
    } catch (exchangeErr) {
      console.error('Error exchanging Supabase auth code:', exchangeErr);
    }

    const finalResponse = NextResponse.redirect(new URL(next, req.url));
    responseCookiesToSet.forEach(({ name, value, options }) => {
      finalResponse.cookies.set(name, value, options);
    });
    return finalResponse;
  }

  return NextResponse.redirect(new URL(next, req.url));
}
