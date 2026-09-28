import { caseService } from '../services/case-service';
import { taskService } from '../services/task-service';
import { resourceService } from '../services/resource-service';
import { evidenceService } from '../services/evidence-service';
import { repository } from '../db/repository';
import { eventService } from '../services/event-service';
import { pulseAndChangeService } from '../services/pulse-and-change-service';
import { AIToolName } from '../types';

export interface ToolExecutionResult {
  toolName: AIToolName | string;
  success: boolean;
  message: string;
  data?: any;
}

export const AI_TOOLS_REGISTRY = {
  get_plan: async (args: { caseId: string }): Promise<ToolExecutionResult> => {
    const overview = await caseService.getCaseOverview(args.caseId);
    if (!overview) return { toolName: 'get_plan', success: false, message: 'Case not found' };

    const remaining = overview.tasks.filter((t) => t.status !== 'COMPLETED' && t.status !== 'SKIPPED');
    const remainingList =
      remaining.length > 0
        ? remaining
            .slice(0, 5)
            .map((t) => {
              const assigneeName = t.assignee ? t.assignee.name : 'Unassigned';
              const phaseLabel = t.phase.replace('_', ' ');
              return `• **${t.title}** (${phaseLabel})\n  👤 Assigned to: *${assigneeName}*`;
            })
            .join('\n\n')
        : 'All tasks in the transition plan are completed!';

    const completedCount = overview.tasks.length - remaining.length;

    return {
      toolName: 'get_plan',
      success: true,
      message:
        `**Transition Plan Summary for ${overview.seniorProfile.name}**\n` +
        `📊 Progress: **${overview.progressPercent}%** (${completedCount}/${overview.tasks.length} tasks completed)\n\n` +
        `📋 **Remaining Tasks & Assignees:**\n${remainingList}`,
      data: overview,
    };
  },

  update_case_context: async (args: {
    caseId: string;
    budget?: number;
    targetDate?: string;
    dischargeDate?: string;
    destinationStatus?: 'KNOWN' | 'UNKNOWN' | 'REHAB_FIRST' | 'RETURN_HOME' | 'UNDECIDED';
    zipCode?: string;
    actor?: string;
  }): Promise<ToolExecutionResult> => {
    const actor = args.actor || 'Family Coordinator via Nora';

    // If confirming destination to REHAB_FIRST or RETURN_HOME, route through deterministic confirm_discharge_destination
    if (args.destinationStatus === 'REHAB_FIRST' || args.destinationStatus === 'RETURN_HOME') {
      const destResult = await AI_TOOLS_REGISTRY.confirm_discharge_destination({
        caseId: args.caseId,
        destination: args.destinationStatus,
        actor,
      });

      // If budget or dates are also being updated in the same call, process them
      if (args.budget !== undefined || args.targetDate || args.dischargeDate || args.zipCode) {
        await caseService.updateCase(
          args.caseId,
          { budget: args.budget, targetDate: args.targetDate, dischargeDate: args.dischargeDate, zipCode: args.zipCode },
          actor
        );
      }

      return destResult;
    }

    const caseData = await repository.getCaseById(args.caseId);
    if (!caseData) return { toolName: 'update_case_context', success: false, message: 'Case not found' };

    const updates: string[] = [];

    if (args.budget !== undefined || args.targetDate || args.dischargeDate || args.zipCode) {
      const result = await caseService.updateCase(
        args.caseId,
        {
          budget: args.budget,
          targetDate: args.targetDate,
          dischargeDate: args.dischargeDate,
          zipCode: args.zipCode,
        },
        actor
      );

      if (args.budget !== undefined) updates.push(`Updated case budget to ${result.caseData.budget ? `$${result.caseData.budget.toLocaleString()}` : 'open / unset'}.`);
      if (args.targetDate) updates.push(`Updated target date to ${result.caseData.targetDate}.`);
      if (args.dischargeDate) updates.push(`Updated discharge date to ${result.caseData.dischargeDate}.`);
      if (args.zipCode) updates.push(`Updated zip code to ${result.caseData.zipCode}.`);

      return {
        toolName: 'update_case_context',
        success: true,
        message: updates.join(' ') || `Updated case context.`,
        data: result.caseData,
      };
    }

    return {
      toolName: 'update_case_context',
      success: true,
      message: `No changes applied.`,
      data: caseData,
    };
  },

  confirm_discharge_destination: async (args: {
    caseId: string;
    destination: 'REHAB_FIRST' | 'RETURN_HOME';
    actor?: string;
    note?: string;
  }): Promise<ToolExecutionResult> => {
    try {
      const result = await caseService.confirmDischargeDestination({
        caseId: args.caseId,
        destination: args.destination,
        actor: args.actor || 'Family Coordinator via Nora',
        note: args.note,
      });

      const destLabel =
        args.destination === 'REHAB_FIRST' ? 'Short-term rehab first' : 'Direct return home';

      return {
        toolName: 'confirm_discharge_destination',
        success: true,
        message:
          `Discharge destination confirmed as **${destLabel}**.\n\n` +
          (result.completedTask ? `✓ Marked decision task **"${result.completedTask.title}"** complete.\n` : '') +
          (result.newlyReadyTasks.length > 0
            ? `✓ Unlocked ${result.newlyReadyTasks.length} downstream ${result.newlyReadyTasks.length === 1 ? 'task' : 'tasks'}: ${result.newlyReadyTasks.map((t) => `*${t.title}*`).join(', ')}.\n`
            : '') +
          `✓ Transition Pulse updated: **${result.pulse.criticalDecisions.label}** (${result.pulse.budgetAssessment}).\n` +
          `✓ Plan change recorded in family activity history.`,
        data: result,
      };
    } catch (err: any) {
      return {
        toolName: 'confirm_discharge_destination',
        success: false,
        message: err.message || 'Failed to confirm discharge destination',
      };
    }
  },

  assign_task: async (args: {
    caseId: string;
    taskId?: string;
    taskTitleQuery?: string;
    assigneeName: string;
  }): Promise<ToolExecutionResult> => {
    const tasks = await repository.getTasksByCaseId(args.caseId);
    let targetTasks: typeof tasks = [];

    if (args.taskId) {
      const found = tasks.find((t) => t.id === args.taskId);
      if (found) targetTasks.push(found);
    } else if (args.taskTitleQuery) {
      const q = args.taskTitleQuery.toLowerCase();
      targetTasks = tasks.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.phase.toLowerCase().includes(q) ||
          (q.includes('pack') && (t.templateId?.includes('inventory') || t.title.toLowerCase().includes('inventory')))
      );
    }

    // Fail early without mutating member state if target task cannot be resolved
    if (targetTasks.length === 0) {
      return {
        toolName: 'assign_task',
        success: false,
        message: `Could not find a task matching "${args.taskTitleQuery || 'your request'}". Please specify the task title to assign.`,
      };
    }

    // Resolve or dynamically create member ONLY after task target is validated
    let members = await repository.getCaseMembers(args.caseId);
    let member = members.find(
      (m) => m.name.toLowerCase() === args.assigneeName.toLowerCase()
    );

    if (!member) {
      member = await repository.saveCaseMember({
        id: 'mem-' + Math.random().toString(36).substring(2, 7),
        caseId: args.caseId,
        name: args.assigneeName,
        relationship: 'Helper / Collaborator',
        isLocal: true,
        role: 'HELPER',
      });
    }

    for (const t of targetTasks) {
      await taskService.assignTask(t.id, member.id, member.name, args.caseId);
    }

    return {
      toolName: 'assign_task',
      success: true,
      message: `Assigned ${targetTasks.length} task(s) (${targetTasks.map((t) => t.title).join(', ')}) to ${member.name}.`,
      data: targetTasks,
    };
  },

  complete_task: async (args: {
    caseId: string;
    taskId?: string;
    taskTitleQuery?: string;
    note?: string;
    actor?: string;
  }): Promise<ToolExecutionResult> => {
    const tasks = await repository.getTasksByCaseId(args.caseId);
    let targetTask: typeof tasks[0] | undefined = undefined;

    if (args.taskId) {
      targetTask = tasks.find((t) => t.id === args.taskId);
    }

    if (!targetTask && args.taskTitleQuery) {
      const q = args.taskTitleQuery.toLowerCase();
      targetTask = tasks.find(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.phase.toLowerCase().includes(q) ||
          (q.includes('discharge') && (t.templateId?.includes('discharge') || t.title.toLowerCase().includes('discharge'))) ||
          (q.includes('pack') && (t.templateId?.includes('inventory') || t.title.toLowerCase().includes('inventory'))) ||
          (q.includes('move') && (t.templateId?.includes('moving') || t.title.toLowerCase().includes('move')))
      );
    }

    if (!targetTask) {
      return {
        toolName: 'complete_task',
        success: false,
        message: `Could not find a task matching "${args.taskTitleQuery || args.taskId || 'your request'}".`,
      };
    }

    const actorName = args.actor ? (args.actor.includes('via Nora') ? args.actor : `${args.actor} via Nora`) : 'Family Coordinator via Nora';
    const updated = await taskService.completeTask(targetTask.id, actorName, args.caseId, args.note);
    return {
      toolName: 'complete_task',
      success: true,
      message: `Marked "${updated.title}" as completed${args.note ? ` (Note: "${args.note}")` : ''}. Downstream dependencies recalculated.`,
      data: updated,
    };
  },

  find_resources: async (args: { category?: string; zipCode?: string }): Promise<ToolExecutionResult> => {
    const resources = await resourceService.findResources(args.category, args.zipCode);

    if (resources.length === 0) {
      return {
        toolName: 'find_resources',
        success: true,
        message: `No matching resources found matching category "${args.category || 'all'}" near ZIP ${args.zipCode || 'your area'}.`,
        data: [],
      };
    }

    const formattedList = resources
      .slice(0, 4)
      .map((r) => {
        const orgName = r.organizationName || r.name;
        const desc = r.description || 'Senior transition support service';
        const phone = r.location?.phone ? ` 📞 ${r.location.phone}` : '';
        return `• **${orgName}**\n  ${desc}${phone}`;
      })
      .join('\n\n');

    return {
      toolName: 'find_resources',
      success: true,
      message: args.zipCode
        ? `**Local resources near ZIP ${args.zipCode}:**\n\n${formattedList}`
        : `**Available resources:**\n\n${formattedList}`,
      data: resources,
    };
  },

  explain_cost_estimate: async (args: { category: string; caseId?: string }): Promise<ToolExecutionResult> => {
    let zipCode: string | undefined = undefined;
    if (args.caseId) {
      const caseData = await repository.getCaseById(args.caseId);
      if (caseData?.zipCode && caseData.zipCode !== 'UNSET') {
        zipCode = caseData.zipCode;
      }
    }

    const result = evidenceService.explainCost(args.category, zipCode);
    return {
      toolName: 'explain_cost_estimate',
      success: true,
      message: result.explanation,
      data: result.summary,
    };
  },
};
