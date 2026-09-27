import { repository } from '../db/repository';
import { eventService } from './event-service';
import { POST_HOSPITAL_WORKFLOW_TEMPLATES } from '../workflows/post-hospital';
import {
  TransitionCase,
  SeniorProfile,
  CaseMember,
  TransitionTask,
  TaskDependency,
  Urgency,
  TaskStatus,
  formatLocalDateYYYYMMDD,
  ProposedTask,
} from '../types';

export class PlanningEngine {
  public calculateUrgency(
    transitionType: string,
    profile: SeniorProfile,
    dischargeDate?: string
  ): Urgency {
    if (profile.immediateSafetyConcern) {
      return 'IMMEDIATE';
    }

    if (transitionType === 'POST_HOSPITAL') {
      if (dischargeDate) {
        const discharge = new Date(dischargeDate);
        const now = new Date();
        const diffDays = Math.ceil(
          (discharge.getTime() - now.getTime()) / (1000 * 3600 * 24)
        );
        if (diffDays <= 7 || profile.stairsConstraint) {
          return 'URGENT';
        }
      }
      return 'URGENT';
    }

    return 'PLANNED';
  }

  /**
   * Generates in-memory proposed tasks for a draft proposal without writing to the database.
   */
  public buildProposedTasks(
    dischargeDateStr?: string,
    ownerName: string = 'You',
    localHelperName?: string
  ): ProposedTask[] {
    const dischargeDateObj = dischargeDateStr
      ? new Date(dischargeDateStr)
      : new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);

    return POST_HOSPITAL_WORKFLOW_TEMPLATES.map((tpl, idx) => {
      let assigneeName = ownerName;
      if (tpl.suggestedAssigneeRole === 'LOCAL' && localHelperName) {
        assigneeName = localHelperName;
      }

      const daysOffset = tpl.daysOffsetFromDischarge ?? 0;
      const taskDueDate = new Date(dischargeDateObj);
      taskDueDate.setDate(taskDueDate.getDate() + daysOffset);

      return {
        id: 'ptask-' + Math.random().toString(36).substring(2, 9),
        templateId: tpl.templateId,
        title: tpl.title,
        description: tpl.description,
        whyItMatters: tpl.whyItMatters,
        phase: tpl.phase,
        priority: idx + 1,
        dueDate: formatLocalDateYYYYMMDD(taskDueDate),
        assigneeName,
        minEstimatedCost: tpl.minEstimatedCost || 0,
        maxEstimatedCost: tpl.maxEstimatedCost || 0,
        applicable: true,
      };
    });
  }

  public async generatePlan(
    caseData: TransitionCase,
    profile: SeniorProfile,
    members: CaseMember[]
  ): Promise<{
    caseData: TransitionCase;
    profile: SeniorProfile;
    members: CaseMember[];
    tasks: TransitionTask[];
  }> {
    // 1. Determine urgency
    const urgency = this.calculateUrgency(
      caseData.transitionType,
      profile,
      caseData.dischargeDate
    );
    caseData.urgency = urgency;

    // Save initial case and profile
    const savedCase = await repository.saveCase(caseData);
    profile.caseId = savedCase.id;
    const savedProfile = await repository.saveSeniorProfile(profile);

    // Save members
    const savedMembers: CaseMember[] = [];
    for (const m of members) {
      m.caseId = savedCase.id;
      savedMembers.push(await repository.saveCaseMember(m));
    }

    const ownerMember = savedMembers.find((m) => m.role === 'OWNER') || savedMembers[0];
    const localMember = savedMembers.find((m) => m.isLocal) || savedMembers[0];

    // Reference dates for calculating task due dates
    const dischargeDateObj = caseData.dischargeDate
      ? new Date(caseData.dischargeDate)
      : new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);

    // Map templateId to actual Task ID
    const templateToTaskIdMap = new Map<string, string>();
    const tasksToCreate: TransitionTask[] = [];
    const dependenciesToCreate: TaskDependency[] = [];

    // Create Task IDs first
    POST_HOSPITAL_WORKFLOW_TEMPLATES.forEach((tpl) => {
      const taskId = 'task-' + Math.random().toString(36).substring(2, 11);
      templateToTaskIdMap.set(tpl.templateId, taskId);
    });

    // Process tasks and dependencies
    POST_HOSPITAL_WORKFLOW_TEMPLATES.forEach((tpl) => {
      const taskId = templateToTaskIdMap.get(tpl.templateId)!;

      // Assignee assignment
      let assigneeId: string | undefined = undefined;
      if (tpl.suggestedAssigneeRole === 'LOCAL' && localMember) {
        assigneeId = localMember.id;
      } else if (ownerMember) {
        assigneeId = ownerMember.id;
      }

      // Calculate due date
      const daysOffset = tpl.daysOffsetFromDischarge ?? 0;
      const taskDueDate = new Date(dischargeDateObj);
      taskDueDate.setDate(taskDueDate.getDate() + daysOffset);

      // Determine initial status based on dependencies
      const dependsOnTaskIds: string[] = tpl.dependsOnTemplateIds.map(
        (tId) => templateToTaskIdMap.get(tId)!
      );

      const initialStatus: TaskStatus =
        dependsOnTaskIds.length === 0 ? 'READY' : 'BLOCKED';

      const task: TransitionTask = {
        id: taskId,
        caseId: savedCase.id,
        templateId: tpl.templateId,
        title: tpl.title,
        description: tpl.description.replace(/\{seniorName\}/g, profile.name),
        whyItMatters: tpl.whyItMatters.replace(/\{seniorName\}/g, profile.name),
        status: initialStatus,
        priority: tpl.priority,
        phase: tpl.phase,
        dueDate: formatLocalDateYYYYMMDD(taskDueDate),
        assigneeId: assigneeId,
        minEstimatedCost: tpl.minEstimatedCost,
        maxEstimatedCost: tpl.maxEstimatedCost,
        dependsOnTaskIds: dependsOnTaskIds,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      tasksToCreate.push(task);

      // Create dependency records
      dependsOnTaskIds.forEach((depId) => {
        dependenciesToCreate.push({
          taskId: taskId,
          dependsOnTaskId: depId,
        });
      });
    });

    // Save tasks and dependencies
    const savedTasks = await repository.saveTasks(tasksToCreate);
    await repository.saveTaskDependencies(dependenciesToCreate);

    // Record Case Events
    await eventService.recordEvent(savedCase.id, 'CASE_CREATED', {
      seniorName: profile.name,
      transitionType: caseData.transitionType,
      urgency: urgency,
    });

    await eventService.recordEvent(savedCase.id, 'PLAN_GENERATED', {
      taskCount: savedTasks.length,
      template: 'POST_HOSPITAL',
    });

    return {
      caseData: savedCase,
      profile: savedProfile,
      members: savedMembers,
      tasks: savedTasks,
    };
  }
}

export const planningEngine = new PlanningEngine();
