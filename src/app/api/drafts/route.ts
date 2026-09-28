import { NextRequest, NextResponse } from 'next/server';
import { draftService, IntakeNotReadyError } from '@/services/draft-service';
import { getSessionUserId, GUEST_COOKIE_NAME } from '@/lib/auth-helper';
import { IntakeDraft } from '@/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const intakeDraft: IntakeDraft = body.intakeDraft || body;
    const userId = await getSessionUserId(req);

    const draft = await draftService.createDraftFromIntake(intakeDraft, userId);

    const response = NextResponse.json(
      {
        success: true,
        draftId: draft.id,
        draft,
      },
      { status: 201 }
    );

    // Set only bridgewell_guest_session for guest draft ownership
    if (!req.cookies.get(GUEST_COOKIE_NAME) || req.cookies.get(GUEST_COOKIE_NAME)?.value !== userId) {
      response.cookies.set(GUEST_COOKIE_NAME, userId, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
    }

    return response;
  } catch (error: any) {
    if (error instanceof IntakeNotReadyError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          missingRequiredFields: error.missingRequiredFields,
        },
        { status: 400 }
      );
    }

    console.error('Error generating draft:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate plan proposal' },
      { status: 500 }
    );
  }
}
