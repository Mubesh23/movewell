import { NextRequest, NextResponse } from 'next/server';
import { caseService } from '@/services/case-service';

export async function GET(
  req: NextRequest,
  { params }: { params: { caseId: string } }
) {
  try {
    const overview = await caseService.getCaseOverview(params.caseId);
    if (!overview) {
      return NextResponse.json(
        { success: false, error: 'Case not found' },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: overview });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
