import { NextRequest, NextResponse } from 'next/server';
import { draftService } from '@/services/draft-service';
import { getSessionUserId } from '@/lib/auth-helper';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ draftId: string }> }
) {
  try {
    const { draftId } = await params;
    const draft = await draftService.getDraft(draftId);

    if (!draft) {
      return NextResponse.json(
        { success: false, error: 'Draft not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, draft });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch draft' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ draftId: string }> }
) {
  try {
    const { draftId } = await params;
    const body = await req.json();
    const userId = await getSessionUserId(req);

    const updated = await draftService.updateDraft(draftId, body, userId);

    return NextResponse.json({
      success: true,
      draft: updated,
    });
  } catch (error: any) {
    const status = error.message?.includes('Unauthorized') ? 403 : 500;
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update draft' },
      { status }
    );
  }
}
