import {
  TransitionCase,
  TransitionTask,
  CostSummary,
  TransitionPulseMetrics,
  PlanChangeRecord,
  PlanChangeDiff,
} from '../types';
import { repository } from '../db/repository';

export class PulseAndChangeService {
  /**
   * Computes the Transition Pulse operational snapshot.
   */
  public calculateTransitionPulse(
    caseData: TransitionCase,
    tasks: TransitionTask[],
    costSummary: CostSummary
  ): TransitionPulseMetrics {
    // 1. Critical decisions: decisions on destination, home safety, discharge clearance
    const decisionTasks = tasks.filter(
      (t) =>
        t.templateId === 'confirm-discharge-destination' ||
        t.title.toLowerCase().includes('destination') ||
        t.title.toLowerCase().includes('rehab') ||
        t.title.toLowerCase().includes('safety') ||
        t.title.toLowerCase().includes('accessibility')
    );
    const totalDecisions = Math.max(decisionTasks.length, 3);
    const resolvedDecisions = decisionTasks.filter((t) => t.status === 'COMPLETED').length;

    // 2. This week tasks remaining (active tasks in immediate phases or due within 7 days)
    const thisWeekTasksRemaining = tasks.filter(
      (t) =>
        (t.status === 'READY' || t.status === 'IN_PROGRESS') &&
        (t.phase === 'RIGHT_NOW' || t.phase === 'THIS_WEEK')
    ).length;

    // 3. Blocked tasks
    const blockedCount = tasks.filter((t) => t.status === 'BLOCKED').length;

    // 4. Unassigned active tasks
    const unassignedCount = tasks.filter(
      (t) => (t.status === 'READY' || t.status === 'IN_PROGRESS') && !t.assigneeId
    ).length;

    // 5. Budget assessment
    let budgetAssessment: 'Within planning range' | 'Exceeds budget' | 'Budget open' = 'Budget open';
    let budgetAssessmentDetail = 'Budget open (no numerical ceiling set)';

    if (caseData.budget && caseData.budget > 0) {
      if (costSummary.maxTotal <= caseData.budget) {
        budgetAssessment = 'Within planning range';
        budgetAssessmentDetail = `$${costSummary.minTotal.toLocaleString()}–$${costSummary.maxTotal.toLocaleString()} within $${caseData.budget.toLocaleString()} target`;
      } else {
        budgetAssessment = 'Exceeds budget';
        const gap = costSummary.maxTotal - caseData.budget;
        budgetAssessmentDetail = `Expected $${costSummary.maxTotal.toLocaleString()} exceeds target by $${gap.toLocaleString()}`;
      }
    }

    return {
      criticalDecisions: {
        resolved: resolvedDecisions,
        total: totalDecisions,
        label: `${resolvedDecisions} / ${totalDecisions} resolved`,
      },
      thisWeekTasksRemaining,
      blockedCount,
      unassignedCount,
      budgetAssessment,
      budgetAssessmentDetail,
    };
  }

  /**
   * Records a structured plan change with before/after comparison
   */
  public async recordPlanChange(
    caseId: string,
    title: string,
    summaryBullets: string[],
    diffs: PlanChangeDiff[]
  ): Promise<PlanChangeRecord> {
    const change: PlanChangeRecord = {
      id: 'pchg-' + Math.random().toString(36).substring(2, 9),
      caseId,
      timestamp: new Date().toISOString(),
      title,
      summaryBullets,
      diffs,
    };
    await repository.savePlanChange(change);
    return change;
  }
}

export const pulseAndChangeService = new PulseAndChangeService();
