import { caseService } from '../services/case-service';
import { taskService } from '../services/task-service';
import { resourceService } from '../services/resource-service';
import { repository } from '../db/repository';
import { eventService } from '../services/event-service';
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
  }): Promise<ToolExecutionResult> => {
    const caseData = await repository.getCaseById(args.caseId);
    if (!caseData) return { toolName: 'update_case_context', success: false, message: 'Case not found' };

    if (args.budget !== undefined) caseData.budget = Number(args.budget);
    if (args.targetDate) caseData.targetDate = args.targetDate;
    if (args.dischargeDate) caseData.dischargeDate = args.dischargeDate;
    if (args.destinationStatus) {
      const allowed = ['KNOWN', 'UNKNOWN', 'REHAB_FIRST', 'RETURN_HOME', 'UNDECIDED'];
      if (allowed.includes(args.destinationStatus)) {
        caseData.destinationStatus = args.destinationStatus;
      }
    }
    caseData.updatedAt = new Date().toISOString();

    await repository.saveCase(caseData);

    if (args.budget !== undefined) {
      await eventService.recordEvent(
        args.caseId,
        'BUDGET_UPDATED',
        { budget: caseData.budget, updatedBy: 'AI Assistant' },
        'AI'
      );
    }
    if (args.destinationStatus) {
      await eventService.recordEvent(
        args.caseId,
        'DESTINATION_CONFIRMED',
        { destinationStatus: caseData.destinationStatus, updatedBy: 'AI Assistant' },
        'AI'
      );
    }
    if (args.targetDate || args.dischargeDate) {
      await eventService.recordEvent(
        args.caseId,
        'TARGET_DATE_CHANGED',
        { targetDate: caseData.targetDate, dischargeDate: caseData.dischargeDate, updatedBy: 'AI Assistant' },
        'AI'
      );
    }

    const updates: string[] = [];
    if (args.budget !== undefined) updates.push(`Updated case budget to ${caseData.budget ? `$${caseData.budget.toLocaleString()}` : 'open / unset'}.`);
    if (args.targetDate) updates.push(`Updated target date to ${caseData.targetDate}.`);
    if (args.dischargeDate) updates.push(`Updated discharge date to ${caseData.dischargeDate}.`);
    if (args.destinationStatus) {
      const destName =
        args.destinationStatus === 'REHAB_FIRST'
          ? 'short-term rehab'
          : args.destinationStatus === 'RETURN_HOME'
          ? 'return home'
          : args.destinationStatus;
      updates.push(`Updated discharge destination status to ${destName} (${args.destinationStatus}).`);
    }

    return {
      toolName: 'update_case_context',
      success: true,
      message: updates.join(' ') || `Updated case context.`,
      data: caseData,
    };
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

    const updated = await taskService.completeTask(targetTask.id, 'AI Assistant', args.caseId, args.note);
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
        message: `No verified resources found matching category "${args.category || 'all'}" near ZIP ${args.zipCode || '77004'}.`,
        data: [],
      };
    }

    const formattedList = resources
      .slice(0, 4)
      .map((r) => {
        const orgName = r.organizationName || r.name;
        const desc = r.description || 'Senior transition support service';
        const phone = r.location?.phone ? ` 📞 ${r.location.phone}` : '';
        const verified = r.verification?.verificationStatus ? ` [${r.verification.verificationStatus}]` : '';
        return `• **${orgName}**${verified}\n  ${desc}${phone}`;
      })
      .join('\n\n');

    return {
      toolName: 'find_resources',
      success: true,
      message: `**Houston Care & Transition Directory Resources:**\n\n${formattedList}`,
      data: resources,
    };
  },
};
