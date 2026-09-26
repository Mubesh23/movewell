import { NextRequest, NextResponse } from 'next/server';
import { caseService } from '@/services/case-service';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { caseId: string; memberId: string } }
) {
  try {
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
