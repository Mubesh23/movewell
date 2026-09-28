import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase/admin';
import {
  GUEST_COOKIE_NAME,
  SESSION_COOKIE_NAME,
  LEGACY_COOKIE_NAME,
} from '@/lib/auth-helper';
import { draftService } from '@/services/draft-service';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const rawEmail = (body.email || '').trim().toLowerCase();
    const email = rawEmail || 'coordinator@bridgewell.org';

    let userId: string = '';

    // 1. If Supabase Admin client is available, find or create real Supabase user
    if (supabaseAdmin) {
      try {
        const { data: userList } = await supabaseAdmin.auth.admin.listUsers({
          page: 1,
          perPage: 100,
        });

        const existing = userList?.users?.find(
          (u) => u.email?.toLowerCase() === email
        );

        if (existing) {
          userId = existing.id;
        } else {
          const { data: newUser, error: createErr } =
            await supabaseAdmin.auth.admin.createUser({
              email,
              email_confirm: true,
              user_metadata: {
                full_name: body.name || 'Family Coordinator',
              },
            });

          if (newUser?.user?.id && !createErr) {
            userId = newUser.user.id;
          }
        }
      } catch (adminErr) {
        console.warn('Supabase admin lookup note:', adminErr);
      }
    }

    // 2. Fallback to deterministic user ID if Supabase admin call did not provide one
    if (!userId) {
      const hash = crypto.createHash('sha256').update(email).digest('hex').substring(0, 16);
      userId = `usr-${hash}`;
    }

    // 3. Auto-claim pending draft if guest token exists in cookies
    const previousGuestToken =
      req.cookies.get(GUEST_COOKIE_NAME)?.value ||
      req.cookies.get(SESSION_COOKIE_NAME)?.value ||
      req.cookies.get(LEGACY_COOKIE_NAME)?.value;

    const draftId = body.draftId;
    if (draftId && previousGuestToken) {
      try {
        await draftService.claimDraft(draftId, previousGuestToken, userId);
      } catch (claimErr) {
        console.warn('Draft auto-claim note:', claimErr);
      }
    }

    const response = NextResponse.json({
      success: true,
      userId,
      email,
      user: {
        id: userId,
        email,
        name: body.name || 'Family Coordinator',
      },
    });

    const isProd = process.env.NODE_ENV === 'production';
    const cookieOptions = {
      path: '/',
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax' as const,
      maxAge: 60 * 60 * 24 * 30, // 30 days
    };

    response.cookies.set(SESSION_COOKIE_NAME, userId, cookieOptions);
    response.cookies.set('bridgewell_email', email, {
      ...cookieOptions,
      httpOnly: false, // Accessible client-side for UI display
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Login failed' },
      { status: 500 }
    );
  }
}
