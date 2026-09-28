import { NextRequest, NextResponse } from 'next/server';
import { draftService } from '@/services/draft-service';
import { resolveSession, GUEST_COOKIE_NAME, SESSION_COOKIE_NAME, LEGACY_COOKIE_NAME } from '@/lib/auth-helper';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ draftId: string }> }
) {
  try {
    const { draftId } = await params;
    const session = await resolveSession(req);

    // Enforce that only authenticated accounts can activate a plan into a real TransitionCase
    if (session.kind !== 'AUTHENTICATED') {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required to activate plan',
          code: 'AUTH_REQUIRED',
        },
        { status: 401 }
      );
    }

    const draft = await draftService.getDraft(draftId);
    if (!draft) {
      return NextResponse.json(
        { success: false, error: 'Draft not found' },
        { status: 404 }
      );
    }

    // If draft is owned by the user, proceed.
    // If draft is owned by a guest session matching the user's cookies, auto-claim it.
    if (draft.ownerUserId !== session.userId) {
      const guestCookie = req.cookies.get(GUEST_COOKIE_NAME)?.value;

      if (guestCookie && draft.ownerUserId === guestCookie.trim()) {
        await draftService.claimDraft(draftId, guestCookie.trim(), session.userId);
      } else {
        return NextResponse.json(
          { success: false, error: 'You do not have permission to activate this draft' },
          { status: 403 }
        );
      }
    }

    const result = await draftService.activateDraft(draftId, session.userId);

    return NextResponse.json({
      success: true,
      caseId: result.caseId,
    });
  } catch (error: any) {
    console.error('Error activating draft:', error);
    const status = error.message?.includes('Unauthorized') ? 403 : 500;
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to activate plan' },
      { status }
    );
  }
}
