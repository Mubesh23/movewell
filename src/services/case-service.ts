import { repository } from '../db/repository';
import { costEngine } from './cost-engine';
import { taskService } from './task-service';
import { eventService } from './event-service';
import { emailService } from './email-service';
import { invitationService } from './invitation-service';
import { pulseAndChangeService } from './pulse-and-change-service';
import { CaseMember, CaseOverview } from '../types';

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
}

export const caseService = new CaseService();
