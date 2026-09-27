import { NextRequest, NextResponse } from 'next/server';
import { caseService } from '@/services/case-service';
import { requireCaseOwner } from '@/lib/auth-guards';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { caseId: string; memberId: string } }
) {
  try {
    const access = await requireCaseOwner(req, params.caseId);
    if (!access.authorized) {
      return NextResponse.json(
        { success: false, error: access.error || 'Access denied' },
        { status: access.status }
      );
    }

    const success = await caseService.deleteMember(params.caseId, params.memberId);
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Member not found or deletion failed' },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
