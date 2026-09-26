import { NextRequest, NextResponse } from 'next/server';
import { taskService } from '@/services/task-service';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { caseId: string; taskId: string } }
) {
  try {
    const body = await req.json();
    const { action, assigneeId, assigneeName, actorName, note, completionNotes } = body;

    if (action === 'COMPLETE') {
      const noteToSave = note || completionNotes;
      const updated = await taskService.completeTask(params.taskId, actorName || 'Sarah', params.caseId, noteToSave);
      return NextResponse.json({ success: true, data: updated });
    }

    if (action === 'REOPEN') {
      const updated = await taskService.reopenTask(params.taskId, actorName || 'Sarah', params.caseId);
      return NextResponse.json({ success: true, data: updated });
    }

    if (action === 'ASSIGN') {
      if (!assigneeId || !assigneeName) {
        return NextResponse.json(
          { success: false, error: 'assigneeId and assigneeName required' },
          { status: 400 }
        );
      }
      const updated = await taskService.assignTask(params.taskId, assigneeId, assigneeName, params.caseId);
      return NextResponse.json({ success: true, data: updated });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
