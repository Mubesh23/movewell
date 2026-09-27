import { NextRequest, NextResponse } from 'next/server';
import { taskService } from '@/services/task-service';
import { caseService } from '@/services/case-service';
import { TaskAction } from '@/types';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { caseId: string; taskId: string } }
) {
  try {
    const body = await req.json();
    const action = body.action as TaskAction;
    const { assigneeId, memberId, assigneeName, actorName, note, completionNotes, dueDate } = body;

    if (action === 'COMPLETE') {
      const noteToSave = note || completionNotes;
      const updated = await taskService.completeTask(params.taskId, actorName || 'Family Coordinator', params.caseId, noteToSave);
      return NextResponse.json({ success: true, data: updated });
    }

    if (action === 'REOPEN') {
      const updated = await taskService.reopenTask(params.taskId, actorName || 'Family Coordinator', params.caseId);
      return NextResponse.json({ success: true, data: updated });
    }

    if (action === 'ASSIGN') {
      const resolvedAssigneeId = assigneeId || memberId;
      if (!resolvedAssigneeId) {
        return NextResponse.json(
          { success: false, error: 'assigneeId (or memberId) required' },
          { status: 400 }
        );
      }
      // Look up member name server-side so callers don't need to send it
      const overview = await caseService.getCaseOverview(params.caseId);
      const member = overview?.members?.find((m) => m.id === resolvedAssigneeId);
      const resolvedAssigneeName = assigneeName || member?.name || resolvedAssigneeId;
      const updated = await taskService.assignTask(params.taskId, resolvedAssigneeId, resolvedAssigneeName, params.caseId);
      return NextResponse.json({ success: true, data: updated });
    }

    if (action === 'SET_DUE_DATE' || dueDate !== undefined) {
      const updated = await taskService.updateDueDate(
        params.taskId,
        body.dueDate,
        params.caseId,
        actorName || 'Family Coordinator'
      );
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
