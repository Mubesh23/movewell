import { NextRequest, NextResponse } from 'next/server';
import { eventService } from '@/services/event-service';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  req: NextRequest,
  { params }: { params: { caseId: string } }
) {
  try {
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
