import { NextRequest, NextResponse } from 'next/server';
import { aiOrchestrator } from '@/services/ai-orchestrator';
import { requireCaseAccess } from '@/lib/auth-guards';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req: NextRequest) {
  try {
    const { caseId, prompt, messages, context } = await req.json();
    if (!caseId) {
      return NextResponse.json(
        { success: false, error: 'caseId is required' },
        { status: 400 }
      );
    }

    const access = await requireCaseAccess(req, caseId);
    if (!access.authorized) {
      return NextResponse.json(
        { success: false, error: access.error || 'Access denied' },
        { status: access.status }
      );
    }

    const actorName = access.currentMember?.name || (access.role === 'OWNER' ? 'Family Coordinator' : 'Care Circle Member');
    const response = await aiOrchestrator.processConversation(
      caseId,
      messages,
      prompt,
      {
        context,
        actorName,
        userId: access.userId,
      }
    );
    return NextResponse.json({ success: true, data: response });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
