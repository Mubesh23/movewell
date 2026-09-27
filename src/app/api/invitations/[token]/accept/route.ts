import { NextRequest, NextResponse } from 'next/server';
import { invitationService } from '@/services/invitation-service';
import { resolveSession } from '@/lib/auth-helper';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;
    const session = await resolveSession(req);

    if (session.kind !== 'AUTHENTICATED') {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required to accept invitation',
          code: 'AUTH_REQUIRED',
        },
        { status: 401 }
      );
    }

    // 1. Validate token before accepting
    const validation = await invitationService.validateInvitation(token);
    if (!validation.valid || !validation.invitation) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error || 'Invalid or expired invitation',
        },
        { status: 400 }
      );
    }

    // 2. Strict recipient email matching to prevent invitation link theft
    if (session.email && validation.invitation.email) {
      const sessionEmail = session.email.trim().toLowerCase();
      const inviteEmail = validation.invitation.email.trim().toLowerCase();

      if (sessionEmail !== inviteEmail) {
        return NextResponse.json(
          {
            success: false,
            error: `This invitation was sent to ${validation.invitation.email}, but you are currently signed in as ${session.email}. Please sign in with the invited email address.`,
            code: 'EMAIL_MISMATCH',
          },
          { status: 403 }
        );
      }
    }

    const result = await invitationService.acceptInvitation(token, session.userId);

    return NextResponse.json({
      success: true,
      caseId: result.caseId,
      member: result.member,
    });
  } catch (error: any) {
    console.error('Error accepting invitation:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to accept invitation' },
      { status: 400 }
    );
  }
}
