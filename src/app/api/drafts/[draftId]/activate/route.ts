import { NextRequest, NextResponse } from 'next/server';
import { draftService } from '@/services/draft-service';
import { getSessionUserId } from '@/lib/auth-helper';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ draftId: string }> }
) {
  try {
    const { draftId } = await params;
    const userId = await getSessionUserId(req);

    const result = await draftService.activateDraft(draftId, userId);

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
