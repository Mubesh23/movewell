import { NextRequest, NextResponse } from 'next/server';
import { aiOrchestrator } from '@/services/ai-orchestrator';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req: NextRequest) {
  try {
    const { caseId, prompt, messages } = await req.json();
    if (!caseId) {
      return NextResponse.json(
        { success: false, error: 'caseId is required' },
        { status: 400 }
      );
    }

    const response = await aiOrchestrator.processConversation(caseId, messages, prompt);
    return NextResponse.json({ success: true, data: response });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
