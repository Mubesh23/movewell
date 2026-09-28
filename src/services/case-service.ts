import { repository } from '../db/repository';
import { costEngine } from './cost-engine';
import { taskService } from './task-service';
import { eventService } from './event-service';
import { emailService } from './email-service';
import { invitationService } from './invitation-service';
import { pulseAndChangeService } from './pulse-and-change-service';
import {
  CaseMember,
  CaseOverview,
  TransitionCase,
  TransitionTask,
  PlanChangeRecord,
  PlanChangeDiff,
  TransitionPulseMetrics,
} from '../types';

export class CaseService {
  public async getCaseOverview(caseId: string): Promise<CaseOverview | null> {
    const caseData = await repository.getCaseById(caseId);
    if (!caseData) return null;

    const seniorProfile = await repository.getSeniorProfileByCaseId(caseId);
    if (!seniorProfile) return null;

    const members = await repository.getCaseMembers(caseId);
    const memberMap = new Map(members.map((m) => [m.id, m]));

    // Ensure dependencies are correctly calculated before returning tasks
    const tasks = await taskService.recalculateDependencies(caseId);

    // Hydrate tasks with assignee objects
    tasks.forEach((t) => {
      if (t.assigneeId) {
        t.assignee = memberMap.get(t.assigneeId);
      }
    });

    const events = await repository.getCaseEvents(caseId);
    const costItems = await repository.getCostItemsByCaseId(caseId);
    const costSummary = costEngine.calculatePlanCosts(tasks, caseData.budget, costItems);

    // Progress calculation
    const completedCount = tasks.filter(
      (t) => t.status === 'COMPLETED' || t.status === 'SKIPPED'
    ).length;
    const progressPercent =
      tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

    // Days until discharge
    let daysUntilDischarge: number | undefined = undefined;
    if (caseData.dischargeDate) {
      const discharge = new Date(caseData.dischargeDate);
      const today = new Date();
      const diffMs = discharge.getTime() - today.getTime();
      daysUntilDischarge = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    }

    // Top Urgent/Priority task needing attention today
    const urgentTask =
      tasks.find((t) => t.status === 'READY' || t.status === 'IN_PROGRESS') ||
      tasks[0];

    const transitionPulse = pulseAndChangeService.calculateTransitionPulse(
      caseData,
      tasks,
      costSummary
    );
    const latestChange = await repository.getLatestPlanChange(caseId);

    return {
      caseData,
      seniorProfile,
      members,
      tasks,
      events,
      costItems,
      costSummary,
      progressPercent,
      daysUntilDischarge,
      urgentTask,
      transitionPulse,
      latestChange: latestChange || undefined,
    };
  }

  public async addMember(
    caseId: string,
    data: {
      name: string;
      relationship?: string;
      city?: string;
      isLocal: boolean;
      availability?: string;
      role: CaseMember['role'];
      email?: string;
    }
  ): Promise<CaseMember> {
    const emailClean = data.email?.trim() || undefined;
    const member: CaseMember = {
      id: 'mbr-' + Math.random().toString(36).substring(2, 9),
      caseId,
      name: data.name,
      relationship: data.relationship || undefined,
      city: data.city || undefined,
      isLocal: data.isLocal,
      availability: data.availability || undefined,
      role: data.role,
      email: emailClean,
      invitationStatus: emailClean ? 'PENDING' : 'NONE',
      invitationChannel: emailClean ? 'EMAIL' : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const saved = await repository.saveCaseMember(member);
    await eventService.recordEvent(caseId, 'CASE_MEMBER_ADDED', {
      memberId: saved.id,
      name: saved.name,
      role: saved.role,
      email: saved.email,
    });
    if (saved.email) {
      await eventService.recordEvent(caseId, 'CASE_MEMBER_INVITED', {
        memberId: saved.id,
        name: saved.name,
        email: saved.email,
        channel: 'EMAIL',
      });

      const senior = await repository.getSeniorProfileByCaseId(caseId);
      const allMembers = await repository.getCaseMembers(caseId);
      const owner = allMembers.find((m) => m.role === 'OWNER') || { name: 'Family Coordinator' };

      const invRes = await invitationService.createAndSendInvitation({
        caseId,
        memberId: saved.id,
        email: saved.email,
        recipientName: saved.name,
        inviterName: owner.name,
        seniorName: senior?.name || 'your loved one',
        role: saved.role,
        relationship: saved.relationship,
      });

      return {
        ...saved,
        invitation: {
          rawToken: invRes.rawToken,
          inviteUrl: invRes.inviteUrl,
        },
      } as any;
    }
    return saved;
  }

  public async deleteMember(caseId: string, memberId: string): Promise<boolean> {
    const members = await repository.getCaseMembers(caseId);
    const targetMember = members.find((m) => m.id === memberId);
    if (!targetMember) {
      throw new Error(`Member ${memberId} not found in case ${caseId}`);
    }
    if (targetMember.role === 'OWNER') {
      throw new Error('Cannot delete primary case owner');
    }

    const tasks = await repository.getTasksByCaseId(caseId);
    for (const task of tasks) {
      if (task.assigneeId === memberId) {
        task.assigneeId = undefined;
        await repository.saveTask(task);
      }
    }

    const success = await repository.deleteCaseMember(memberId, caseId);
    if (success) {
      await eventService.recordEvent(caseId, 'CASE_MEMBER_REMOVED', {
        memberId,
      });
    }
    return success;
  }

  /**
   * P0 Signature Deterministic Transition Operation:
   * Confirms discharge destination, completes relevant decision task with audit notes,
   * reevaluates dependencies, updates Transition Pulse, and records real before/after diffs.
   */
  public async confirmDischargeDestination(params: {
    caseId: string;
    destination: 'REHAB_FIRST' | 'RETURN_HOME';
    actor?: string;
    note?: string;
  }): Promise<{
    caseData: TransitionCase;
    completedTask?: TransitionTask;
    newlyReadyTasks: TransitionTask[];
    planChange: PlanChangeRecord;
    pulse: TransitionPulseMetrics;
  }> {
    const caseData = await repository.getCaseById(params.caseId);
    if (!caseData) {
      throw new Error(`Case ${params.caseId} not found`);
    }

    const actor = params.actor || 'Sarah';
    const previousDest = caseData.destinationStatus || 'UNDECIDED';

    // 1. Snapshot BEFORE state
    const beforeTasks = await repository.getTasksByCaseId(params.caseId);
    const beforeBlockedIds = new Set(
      beforeTasks.filter((t) => t.status === 'BLOCKED').map((t) => t.id)
    );

    // 2. Persist destinationStatus
    caseData.destinationStatus = params.destination;
    caseData.updatedAt = new Date().toISOString();
    await repository.saveCase(caseData);

    await eventService.recordEvent(
      params.caseId,
      'DESTINATION_CONFIRMED',
      {
        destinationStatus: params.destination,
        confirmedBy: `${actor} via Nora`,
        previousStatus: previousDest,
        note: params.note || null,
      },
      'AI'
    );

    // 3. Find and complete the relevant destination-decision task if not completed
    let completedDecisionTask: TransitionTask | undefined = undefined;
    const decisionTask = beforeTasks.find(
      (t) =>
        (t.templateId === 'confirm-discharge-destination' ||
          t.title.toLowerCase().includes('destination') ||
          t.title.toLowerCase().includes('rehab')) &&
        t.status !== 'COMPLETED'
    );

    if (decisionTask) {
      const completionNote =
        params.note ||
        (params.destination === 'REHAB_FIRST'
          ? 'Social worker confirmed short-term rehabilitation facility placement.'
          : 'Confirmed direct discharge to home.');

      completedDecisionTask = await taskService.completeTask(
        decisionTask.id,
        `${actor} via Nora`,
        params.caseId,
        completionNote
      );
    }

    // 4. Recalculate downstream task dependencies
    const afterTasks = await taskService.recalculateDependencies(params.caseId);
    const newlyReadyTasks = afterTasks.filter(
      (at) => at.status === 'READY' && beforeBlockedIds.has(at.id)
    );

    // 5. Recalculate Transition Pulse & next milestone
    const costItems = await repository.getCostItemsByCaseId(params.caseId);
    const costSummary = costEngine.calculatePlanCosts(afterTasks, caseData.budget, costItems);
    const pulse = pulseAndChangeService.calculateTransitionPulse(caseData, afterTasks, costSummary);

    // 6. Generate PlanChangeRecord from actual before/after diffs
    const destLabel =
      params.destination === 'REHAB_FIRST' ? 'Short-term rehab first' : 'Direct return home';
    const diffItems: string[] = [
      `✓ Destination confirmed: ${destLabel}`,
    ];

    if (completedDecisionTask) {
      diffItems.push(`✓ Completed decision: "${completedDecisionTask.title}"`);
    }

    if (newlyReadyTasks.length > 0) {
      diffItems.push(
        `✓ ${newlyReadyTasks.length} downstream ${
          newlyReadyTasks.length === 1 ? 'task' : 'tasks'
        } unlocked: ${newlyReadyTasks.map((t) => `"${t.title}"`).join(', ')}`
      );
    }

    diffItems.push(`✓ Transition Pulse updated: ${pulse.criticalDecisions.label}`);

    const diffs: PlanChangeDiff[] = [
      {
        label: 'Discharge Destination',
        before:
          previousDest === 'REHAB_FIRST'
            ? 'Short-term rehab first'
            : previousDest === 'RETURN_HOME'
            ? 'Direct return home'
            : 'Undecided',
        after: destLabel,
      },
    ];

    const planChange = await pulseAndChangeService.recordPlanChange(
      params.caseId,
      'Discharge destination confirmed',
      diffItems,
      diffs
    );

    return {
      caseData,
      completedTask: completedDecisionTask,
      newlyReadyTasks,
      planChange,
      pulse,
    };
  }
}

export const caseService = new CaseService();
