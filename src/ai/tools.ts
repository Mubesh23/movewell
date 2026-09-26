import { caseService } from '../services/case-service';
import { taskService } from '../services/task-service';
import { resourceService } from '../services/resource-service';
import { repository } from '../db/repository';
import { eventService } from '../services/event-service';
import { TaskPhase } from '../types';

export interface ToolExecutionResult {
  toolName: string;
  success: boolean;
  message: string;
  data?: any;
}

export const AI_TOOLS_REGISTRY = {
  get_plan: async (args: { caseId: string }): Promise<ToolExecutionResult> => {
    const overview = await caseService.getCaseOverview(args.caseId);
    if (!overview) return { toolName: 'get_plan', success: false, message: 'Case not found' };
    return {
      toolName: 'get_plan',
      success: true,
      message: `Retrieved transition plan for ${overview.seniorProfile.name}`,
      data: overview,
    };
  },

  update_case_context: async (args: {
    caseId: string;
    budget?: number;
    targetDate?: string;
    dischargeDate?: string;
  }): Promise<ToolExecutionResult> => {
    const caseData = await repository.getCaseById(args.caseId);
    if (!caseData) return { toolName: 'update_case_context', success: false, message: 'Case not found' };

    if (args.budget !== undefined) caseData.budget = Number(args.budget);
    if (args.targetDate) caseData.targetDate = args.targetDate;
    if (args.dischargeDate) caseData.dischargeDate = args.dischargeDate;
    caseData.updatedAt = new Date().toISOString();

    await repository.saveCase(caseData);

    await eventService.recordEvent(args.caseId, 'BUDGET_UPDATED', {
      budget: caseData.budget,
      targetDate: caseData.targetDate,
      updatedBy: 'AI Assistant',
    }, 'AI');

    return {
      toolName: 'update_case_context',
      success: true,
      message: `Updated case budget to $${caseData.budget.toLocaleString()} and target dates.`,
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
    let members = await repository.getCaseMembers(args.caseId);

    let member = members.find(
      (m) => m.name.toLowerCase() === args.assigneeName.toLowerCase()
    );

    // Dynamic creation of family/helper/professional collaborator if name is not recognized
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

    if (targetTasks.length === 0) {
      targetTasks = [tasks[0]];
    }

    for (const t of targetTasks) {
      await taskService.assignTask(t.id, member.id, member.name);
    }

    return {
      toolName: 'assign_task',
      success: true,
      message: `Assigned ${targetTasks.length} task(s) (${targetTasks.map((t) => t.title).join(', ')}) to ${member.name}.`,
      data: targetTasks,
    };
  },

  complete_task: async (args: { caseId: string; taskId: string }): Promise<ToolExecutionResult> => {
    const updated = await taskService.completeTask(args.taskId, 'AI Assistant');
    return {
      toolName: 'complete_task',
      success: true,
      message: `Marked "${updated.title}" as completed. Downstream dependencies recalculated.`,
      data: updated,
    };
  },

  find_resources: async (args: { category?: string; zipCode?: string }): Promise<ToolExecutionResult> => {
    const resources = await resourceService.findResources(args.category, args.zipCode);
    return {
      toolName: 'find_resources',
      success: true,
      message: `Found ${resources.length} verified listings in Houston for ${args.category || 'all categories'}`,
      data: resources,
    };
  },
};
