import { NextRequest, NextResponse } from 'next/server';
import { draftService } from '@/services/draft-service';
import { getSessionUserId } from '@/lib/auth-helper';
import { IntakeDraft } from '@/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const intakeDraft: IntakeDraft = body.intakeDraft || body;
    const userId = await getSessionUserId(req);

    const draft = await draftService.createDraftFromIntake(intakeDraft, userId);

    const response = NextResponse.json({
      success: true,
      draftId: draft.id,
      draft,
    });

    // Set cookie if not already present
    if (!req.cookies.get('movewell_user_id')) {
      response.cookies.set('movewell_user_id', userId, {
        path: '/',
        httpOnly: false,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
    }

    return response;
  } catch (error: any) {
    console.error('Error generating draft:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate plan proposal' },
      { status: 500 }
    );
  }
}
