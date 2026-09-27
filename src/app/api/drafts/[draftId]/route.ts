import { NextRequest, NextResponse } from 'next/server';
import { draftService } from '@/services/draft-service';
import { requireDraftAccess } from '@/lib/auth-guards';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ draftId: string }> }
) {
  try {
    const { draftId } = await params;
    const access = await requireDraftAccess(req, draftId);

    if (!access.authorized || !access.draft) {
      return NextResponse.json(
        { success: false, error: access.error || 'Access denied' },
        { status: access.status }
      );
    }

    return NextResponse.json({ success: true, draft: access.draft });
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
    const access = await requireDraftAccess(req, draftId);

    if (!access.authorized) {
      return NextResponse.json(
        { success: false, error: access.error || 'Access denied' },
        { status: access.status }
      );
    }

    const body = await req.json();
    const updated = await draftService.updateDraft(draftId, body, access.userId);

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
