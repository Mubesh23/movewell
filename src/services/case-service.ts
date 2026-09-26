import { repository } from '../db/repository';
import { costEngine } from './cost-engine';
import { taskService } from './task-service';
import { CaseOverview } from '../types';

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
    const costSummary = costEngine.calculatePlanCosts(tasks, caseData.budget);

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

    return {
      caseData,
      seniorProfile,
      members,
      tasks,
      events,
      costSummary,
      progressPercent,
      daysUntilDischarge,
      urgentTask,
    };
  }
}

export const caseService = new CaseService();
