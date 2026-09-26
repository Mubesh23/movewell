import { NextRequest, NextResponse } from 'next/server';
import { aiOrchestrator } from '@/services/ai-orchestrator';

export async function POST(req: NextRequest) {
  try {
    const { caseId, prompt } = await req.json();
    if (!caseId || !prompt) {
      return NextResponse.json(
        { success: false, error: 'caseId and prompt required' },
        { status: 400 }
      );
    }

    const response = await aiOrchestrator.processUserIntent(caseId, prompt);
    return NextResponse.json({ success: true, data: response });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
