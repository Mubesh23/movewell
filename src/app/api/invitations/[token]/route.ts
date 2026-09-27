import { NextRequest, NextResponse } from 'next/server';
import { invitationService } from '@/services/invitation-service';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;
    const result = await invitationService.validateInvitation(token);

    if (!result.valid || !result.invitation || !result.caseData || !result.member) {
      return NextResponse.json(
        {
          success: false,
          valid: false,
          error: result.error || 'Invalid or expired invitation',
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      valid: true,
      data: {
        caseId: result.invitation.caseId,
        memberId: result.member.id,
        recipientName: result.member.name,
        role: result.member.role,
        relationship: result.member.relationship,
        seniorName: result.senior?.name || 'Loved One',
        status: result.invitation.status,
        expiresAt: result.invitation.expiresAt,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
