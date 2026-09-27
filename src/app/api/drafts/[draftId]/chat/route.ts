import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import { draftService } from '@/services/draft-service';
import { getSessionUserId } from '@/lib/auth-helper';
import { PlanDraft, ProposedTask, PlanChangeDiff } from '@/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface DraftChatRequestBody {
  message?: string;
  action?: 'APPLY_CHANGES';
  pendingChanges?: Array<{
    type: 'TASK_ASSIGNEE' | 'BUDGET' | 'DESTINATION' | 'MEMBER_ADD';
    taskId?: string;
    field: string;
    before: string;
    after: string;
    label: string;
  }>;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ draftId: string }> }
) {
  try {
    const { draftId } = await params;
    const body: DraftChatRequestBody = await req.json();
    const sessionUserId = await getSessionUserId(req);

    const draft = await draftService.getDraft(draftId);
    if (!draft) {
      return NextResponse.json({ success: false, error: 'Draft not found' }, { status: 404 });
    }

    const userId = (sessionUserId && !sessionUserId.startsWith('anon-')) ? sessionUserId : draft.ownerUserId;

    // Handle user confirmation of previewed changes
    if (body.action === 'APPLY_CHANGES' && body.pendingChanges && body.pendingChanges.length > 0) {
      const updatedTasks = [...draft.proposedTasks];
      let updatedBudget = draft.proposedBudget;
      let updatedBudgetStatus = draft.budgetStatus;
      const diffs: PlanChangeDiff[] = [];

      for (const change of body.pendingChanges) {
        if (change.type === 'TASK_ASSIGNEE' && change.taskId) {
          const tIdx = updatedTasks.findIndex((t) => t.id === change.taskId);
          if (tIdx >= 0) {
            updatedTasks[tIdx] = {
              ...updatedTasks[tIdx],
              assigneeName: change.after,
            };
            diffs.push({
              label: change.label,
              before: change.before,
              after: change.after,
            });
          }
        } else if (change.type === 'BUDGET') {
          const parsed = parseInt(change.after.replace(/[^0-9]/g, ''), 10);
          if (!isNaN(parsed)) {
            updatedBudget = parsed;
            updatedBudgetStatus = 'SET';
            diffs.push({
              label: 'Budget',
              before: change.before,
              after: `$${parsed.toLocaleString()}`,
            });
          }
        }
      }

      const updatedDraft = await draftService.updateDraft(
        draftId,
        {
          proposedTasks: updatedTasks,
          proposedBudget: updatedBudget,
          budgetStatus: updatedBudgetStatus,
        },
        userId
      );

      return NextResponse.json({
        success: true,
        draft: updatedDraft,
        assistantMessage: `I've updated ${diffs.length} item${diffs.length > 1 ? 's' : ''} in your proposal.`,
        whatChanged: {
          title: 'Draft updated',
          causality: "You asked Nora to update the plan. Here's what changed.",
          diffs,
        },
      });
    }

    const userMessage = (body.message || '').trim();
    if (!userMessage) {
      return NextResponse.json({ success: false, error: 'Message is required' }, { status: 400 });
    }

    const lower = userMessage.toLowerCase();
    const members = draft.proposedMembers;
    const coordinator = members.find((m) => m.role === 'OWNER') || { name: 'You' };
    const helpers = members.filter((m) => m.role !== 'OWNER');

    // 1. Budget update intent (e.g. "We actually have a $12,000 budget")
    const dollarMatch = userMessage.match(/\$(\d{1,3}(?:,\d{3})*|\d{3,6})\b/);
    const budgetWordMatch = userMessage.match(/\bbudget\s*(?:of|is|around|about)?\s*:?\s*\$?(\d{1,3}(?:,\d{3})*|\d{3,6})\b/i);
    const budgetVal = dollarMatch ? dollarMatch[1] : (budgetWordMatch ? budgetWordMatch[1] : null);

    if (budgetVal && (lower.includes('budget') || dollarMatch)) {
      const parsed = parseInt(budgetVal.replace(/,/g, ''), 10);
      const beforeStr = draft.proposedBudget ? `$${draft.proposedBudget.toLocaleString()}` : 'Not set';
      const afterStr = `$${parsed.toLocaleString()}`;

      const updatedDraft = await draftService.updateDraft(
        draftId,
        {
          proposedBudget: parsed,
          budgetStatus: 'SET',
        },
        userId
      );

      return NextResponse.json({
        success: true,
        draft: updatedDraft,
        assistantMessage: `I've updated the draft budget to ${afterStr}.`,
        whatChanged: {
          title: 'Draft updated',
          causality: "You asked Nora to update the plan. Here's what changed.",
          diffs: [{ label: 'Budget', before: beforeStr, after: afterStr }],
        },
      });
    }

    // 2. Multi-task Assignment: "Have [Helper] handle everything that needs someone local" or "local tasks"
    let targetHelper = helpers.find((h) => lower.includes(h.name.toLowerCase()));
    if (!targetHelper && helpers.length === 1 && (lower.includes('sister') || lower.includes('brother') || lower.includes('helper'))) {
      targetHelper = helpers[0];
    }

    const isLocalBulkAssign =
      targetHelper &&
      (lower.includes('local') || lower.includes('in person') || lower.includes('everything local') || lower.includes('all local'));

    if (isLocalBulkAssign && targetHelper) {
      // Find local tasks that could be assigned to helper
      const localKeywords = ['accessibility', 'prepare home', 'rehab', 'mover', 'donation', 'walkthrough'];
      const affectedTasks = draft.proposedTasks.filter((t) => {
        const titleLower = t.title.toLowerCase();
        return (
          t.assigneeName !== targetHelper!.name &&
          localKeywords.some((kw) => titleLower.includes(kw))
        );
      });

      if (affectedTasks.length > 0) {
        const pendingChanges = affectedTasks.map((t) => ({
          type: 'TASK_ASSIGNEE' as const,
          taskId: t.id,
          field: 'assigneeName',
          before: t.assigneeName || 'Unassigned',
          after: targetHelper!.name,
          label: t.title,
        }));

        const previewList = affectedTasks.map((t) => `• ${t.title}`).join('\n');
        return NextResponse.json({
          success: true,
          requiresConfirmation: true,
          assistantMessage: `I can reassign these ${affectedTasks.length} tasks to ${targetHelper.name}:\n${previewList}`,
          previewTitle: `${affectedTasks.length} assignments will change`,
          pendingChanges,
        });
      } else {
        return NextResponse.json({
          success: true,
          assistantMessage: `${targetHelper.name} is already assigned to all relevant local tasks.`,
        });
      }
    }

    // 3. Move tasks to coordinator: "Move the mover calls to me" or "Assign ... to me"
    const isAssignToMe = lower.includes('to me') || lower.includes('to myself');
    if (isAssignToMe) {
      const targetName = coordinator.name;
      const matchedTasks = draft.proposedTasks.filter((t) => {
        const titleLower = t.title.toLowerCase();
        if (lower.includes('mover') && titleLower.includes('mover')) return true;
        if (lower.includes('rehab') && titleLower.includes('rehab')) return true;
        if (lower.includes('prepare') && titleLower.includes('prepare')) return true;
        if (lower.includes('destination') && titleLower.includes('destination')) return true;
        return false;
      });

      if (matchedTasks.length > 0) {
        const diffs: PlanChangeDiff[] = [];
        const updatedTasks = draft.proposedTasks.map((t) => {
          if (matchedTasks.some((m) => m.id === t.id)) {
            diffs.push({
              label: t.title,
              before: t.assigneeName || 'Unassigned',
              after: targetName,
            });
            return { ...t, assigneeName: targetName };
          }
          return t;
        });

        const updatedDraft = await draftService.updateDraft(
          draftId,
          { proposedTasks: updatedTasks },
          userId
        );

        return NextResponse.json({
          success: true,
          draft: updatedDraft,
          assistantMessage: `I've reassigned ${diffs.length} task${diffs.length > 1 ? 's' : ''} to ${targetName}.`,
          whatChanged: {
            title: 'Draft updated',
            causality: "You asked Nora to update the plan. Here's what changed.",
            diffs,
          },
        });
      }
    }

    // 4. Single explicit task assignment: "Assign [task keyword] to [Helper]"
    if (targetHelper) {
      const matchedTasks = draft.proposedTasks.filter((t) => {
        const titleLower = t.title.toLowerCase();
        if (lower.includes('mover') && titleLower.includes('mover')) return true;
        if (lower.includes('rehab') && titleLower.includes('rehab')) return true;
        if (lower.includes('prepare') && titleLower.includes('prepare')) return true;
        if (lower.includes('accessibility') && titleLower.includes('accessibility')) return true;
        return false;
      });

      if (matchedTasks.length === 1) {
        const task = matchedTasks[0];
        const diffs: PlanChangeDiff[] = [
          {
            label: task.title,
            before: task.assigneeName || 'Unassigned',
            after: targetHelper.name,
          },
        ];
        const updatedTasks = draft.proposedTasks.map((t) =>
          t.id === task.id ? { ...t, assigneeName: targetHelper!.name } : t
        );
        const updatedDraft = await draftService.updateDraft(
          draftId,
          { proposedTasks: updatedTasks },
          userId
        );

        return NextResponse.json({
          success: true,
          draft: updatedDraft,
          assistantMessage: `I've assigned "${task.title}" to ${targetHelper.name}.`,
          whatChanged: {
            title: 'Draft updated',
            causality: "You asked Nora to update the plan. Here's what changed.",
            diffs,
          },
        });
      }
    }

    // 5. Fallback empathetic response
    return NextResponse.json({
      success: true,
      assistantMessage: `I've noted that. You can also reassign tasks directly in the action sequence or adjust members in the Family section below.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Error processing request' },
      { status: 500 }
    );
  }
}
