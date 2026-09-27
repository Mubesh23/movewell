import { NextRequest, NextResponse } from 'next/server';
import { eventService } from '@/services/event-service';
import { requireCaseAccess } from '@/lib/auth-guards';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  req: NextRequest,
  { params }: { params: { caseId: string } }
) {
  try {
    const access = await requireCaseAccess(req, params.caseId);
    if (!access.authorized) {
      return NextResponse.json(
        { success: false, error: access.error || 'Access denied' },
        { status: access.status }
      );
    }

    const events = await eventService.getCaseEvents(params.caseId);
    return NextResponse.json(
      { success: true, events },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  } catch (error: any) {
    console.error('Error fetching case events:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch events' },
      { status: 500 }
    );
  }
}
