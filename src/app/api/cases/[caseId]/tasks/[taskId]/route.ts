import { NextRequest, NextResponse } from 'next/server';
import { taskService } from '@/services/task-service';
import { caseService } from '@/services/case-service';
import { requireCaseAccess } from '@/lib/auth-guards';
import { TaskAction } from '@/types';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { caseId: string; taskId: string } }
) {
  try {
    const access = await requireCaseAccess(req, params.caseId);
    if (!access.authorized) {
      return NextResponse.json(
        { success: false, error: access.error || 'Access denied' },
        { status: access.status }
      );
    }

    const body = await req.json();
    const { note, completionNotes, assigneeId, memberId, assigneeName, dueDate } = body;
    const action = (body.action || (body.status === 'COMPLETED' ? 'COMPLETE' : body.status === 'READY' ? 'REOPEN' : undefined)) as TaskAction;
    // Resolve real actor name from authenticated member or case owner, not untrusted client payload
    const effectiveActorName = access.currentMember?.name || (access.role === 'OWNER' ? 'Sarah' : 'Care Circle Member');

    if (action === 'COMPLETE') {
      const task = await taskService.getTaskById(params.taskId);
      if (!task) {
        return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
      }

      const noteToSave = (note || completionNotes || '').trim();
      const taskAssigneeName = task.assignee?.name;
      const isAssignedToOther =
        Boolean(taskAssigneeName) &&
        taskAssigneeName !== 'Unassigned' &&
        taskAssigneeName!.toLowerCase().trim() !== effectiveActorName.toLowerCase().trim();

      if (isAssignedToOther && !noteToSave) {
        return NextResponse.json(
          {
            success: false,
            error: `This task is assigned to ${taskAssigneeName}. Add a note so the family knows what happened.`,
          },
          { status: 400 }
        );
      }

      const updated = await taskService.completeTask(params.taskId, effectiveActorName, params.caseId, noteToSave || undefined);
      return NextResponse.json({ success: true, data: updated });
    }

    if (action === 'REOPEN') {
      const updated = await taskService.reopenTask(params.taskId, effectiveActorName, params.caseId);
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
        effectiveActorName
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
