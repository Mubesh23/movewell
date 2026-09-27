import { NextRequest, NextResponse } from 'next/server';
import { invitationService } from '@/services/invitation-service';
import { getSessionUserId } from '@/lib/auth-helper';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;
    const userId = await getSessionUserId(req);

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required to accept invitation' },
        { status: 401 }
      );
    }

    const result = await invitationService.acceptInvitation(token, userId);

    return NextResponse.json({
      success: true,
      caseId: result.caseId,
      member: result.member,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to accept invitation' },
      { status: 400 }
    );
  }
}
