import { describe, it, expect, beforeEach } from 'vitest';
import { repository } from '../db/repository';
import { pulseAndChangeService } from '../services/pulse-and-change-service';
import { taskService } from '../services/task-service';
import { costEngine } from '../services/cost-engine';
import { AI_TOOLS_REGISTRY } from '../ai/tools';
import { TransitionCase, TransitionTask, CostItem, CostSummary } from '../types';

describe('Living Transition Plan: Pulse, What Changed, and Cost Lifecycle', () => {
  const caseId = 'case-pulse-test-1';

  beforeEach(async () => {
    await repository.resetAll();

    const caseData: TransitionCase = {
      id: caseId,
      transitionType: 'POST_HOSPITAL',
      urgency: 'URGENT',
      zipCode: '77004',
      budget: 8000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await repository.saveCase(caseData);

    const tasks: TransitionTask[] = [
      {
        id: 't-dest',
        caseId,
        title: 'Confirm safe discharge destination',
        phase: 'RIGHT_NOW',
        status: 'READY',
        priority: 1,
        minEstimatedCost: 0,
        maxEstimatedCost: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 't-assess',
        caseId,
        title: 'Assess home accessibility and safety',
        phase: 'RIGHT_NOW',
        status: 'BLOCKED',
        priority: 2,
        dependsOnTaskIds: ['t-dest'],
        minEstimatedCost: 800,
        maxEstimatedCost: 2500,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 't-move',
        caseId,
        title: 'Schedule senior mover',
        phase: 'NEXT',
        status: 'BLOCKED',
        priority: 3,
        dependsOnTaskIds: ['t-assess'],
        minEstimatedCost: 1200,
        maxEstimatedCost: 2400,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    for (const t of tasks) {
      await repository.saveTask(t);
    }

    await repository.saveTaskDependencies([
      {
        taskId: 't-assess',
        dependsOnTaskId: 't-dest',
      },
      {
        taskId: 't-move',
        dependsOnTaskId: 't-assess',
      },
    ]);
  });

  describe('Transition Pulse Metrics', () => {
    it('accurately computes operational pulse: decisions, this week, blocked, unassigned, and budget', async () => {
      const caseData = (await repository.getCaseById(caseId))!;
      const tasks = await repository.getTasksByCaseId(caseId);
      const costSummary = costEngine.calculatePlanCosts(tasks, caseData.budget);

      const pulse = pulseAndChangeService.calculateTransitionPulse(caseData, tasks, costSummary);

      expect(pulse.criticalDecisions.resolved).toBe(0);
      expect(pulse.criticalDecisions.total).toBeGreaterThanOrEqual(3);
      expect(pulse.criticalDecisions.label).toContain('0 /');
      expect(pulse.thisWeekTasksRemaining).toBe(1); // t-dest is READY in immediate phase
      expect(pulse.blockedCount).toBe(2); // t-assess and t-move are BLOCKED
      expect(pulse.unassignedCount).toBe(1); // t-dest is unassigned
      expect(pulse.budgetAssessment).toBe('Within planning range'); // $4,900 max <= $8,000 budget
    });

    it('flags budget overrun when max planning range exceeds available budget', async () => {
      const caseData = (await repository.getCaseById(caseId))!;
      caseData.budget = 2000; // lower budget
      await repository.saveCase(caseData);

      const tasks = await repository.getTasksByCaseId(caseId);
      const costSummary = costEngine.calculatePlanCosts(tasks, caseData.budget);

      const pulse = pulseAndChangeService.calculateTransitionPulse(caseData, tasks, costSummary);
      expect(pulse.budgetAssessment).toBe('Exceeds budget');
      expect(pulse.budgetAssessmentDetail).toContain('exceeds target');
    });
  });

  describe('What Changed: Adaptive Updates & Diffs', () => {
    it('records a PlanChangeRecord when discharge destination is confirmed', async () => {
      const res = await AI_TOOLS_REGISTRY.update_case_context({
        caseId,
        destinationStatus: 'REHAB_FIRST',
      });

      expect(res.success).toBe(true);

      const latestChange = await repository.getLatestPlanChange(caseId);
      expect(latestChange).not.toBeNull();
      expect(latestChange?.title).toBe('Plan updated');
      expect(latestChange?.summaryBullets.some((b) => b.includes('Rehab first'))).toBe(true);

      const destDiff = latestChange?.diffs.find((d) => d.label === 'Destination');
      expect(destDiff).toBeDefined();
      expect(destDiff?.before).toBe('Unknown');
      expect(destDiff?.after).toBe('Rehab first');
    });

    it('records a PlanChangeRecord when a prerequisite task completes and unlocks downstream items', async () => {
      // Complete t-dest
      await taskService.completeTask('t-dest', 'Sarah', caseId, 'Discharge team confirmed');

      const latestChange = await repository.getLatestPlanChange(caseId);
      expect(latestChange).not.toBeNull();
      expect(latestChange?.summaryBullets.some((b) => b.includes('Confirm safe discharge destination completed'))).toBe(true);
      expect(latestChange?.summaryBullets.some((b) => b.includes('now available'))).toBe(true);

      const assessTask = await repository.getTaskById('t-assess');
      expect(assessTask?.status).toBe('READY');

      const assessDiff = latestChange?.diffs.find((d) => d.label === 'Assess home accessibility and safety');
      expect(assessDiff).toBeDefined();
      expect(assessDiff?.before).toBe('Blocked by prerequisite');
      expect(assessDiff?.after).toBe('Available now');
    });
  });

  describe('Cost Lifecycle & Provenance', () => {
    it('supersedes planning estimate with actual confirmed quote without double-counting', async () => {
      const tasks = await repository.getTasksByCaseId(caseId);
      const baseCosts = costEngine.calculatePlanCosts(tasks, 8000);
      // t-assess: 800-2500, t-move: 1200-2400 -> total 2000-4900
      expect(baseCosts.minTotal).toBe(2000);
      expect(baseCosts.maxTotal).toBe(4900);

      const quoteItem: CostItem = {
        id: 'quote-caring-transitions',
        caseId,
        category: 'moving',
        description: 'Caring Transitions Moving Quote',
        source: 'QUOTE',
        amount: 2150,
        providerName: 'Caring Transitions of Houston',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const updatedCosts = costEngine.calculatePlanCosts(tasks, 8000, [quoteItem]);
      // moving estimate (1200-2400) replaced by exact quote 2150
      // home mod (800-2500) + moving quote 2150 = min 2950, max 4650
      expect(updatedCosts.minTotal).toBe(800 + 2150);
      expect(updatedCosts.maxTotal).toBe(2500 + 2150);
      expect(updatedCosts.confirmedQuotesTotal).toBe(2150);
    });
  });
});
