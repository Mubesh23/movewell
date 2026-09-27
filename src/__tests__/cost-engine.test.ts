import { describe, it, expect } from 'vitest';
import { costEngine } from '../services/cost-engine';
import { TransitionTask } from '../types';

describe('Cost Engine Calculations', () => {
  it('should correctly sum minimum and maximum costs and compare to user budget', () => {
    const mockTasks: Partial<TransitionTask>[] = [
      { id: '1', minEstimatedCost: 1200, maxEstimatedCost: 2400, status: 'READY' },
      { id: '2', minEstimatedCost: 600, maxEstimatedCost: 1100, status: 'BLOCKED' },
      { id: '3', minEstimatedCost: 300, maxEstimatedCost: 700, status: 'SKIPPED' }, // Should be excluded
    ];

    const summary = costEngine.calculatePlanCosts(mockTasks as TransitionTask[], 3000);

    expect(summary.minTotal).toBe(1800); // 1200 + 600
    expect(summary.maxTotal).toBe(3500); // 2400 + 1100
    expect(summary.userBudget).toBe(3000);
    expect(summary.budgetGap).toBe(500); // 3500 - 3000 = +500 over
    expect(summary.disclaimer).toBe('Planning estimates, not vendor quotes.');
  });

  it('should substitute confirmed moving quote for estimated moving range without double-counting', () => {
    const mockTasks: Partial<TransitionTask>[] = [
      { id: '1', title: 'Schedule Senior Move Manager / Mover', templateId: 'schedule-senior-mover', minEstimatedCost: 1200, maxEstimatedCost: 2400, status: 'READY' },
      { id: '2', title: 'Home Accessibility Assessment', minEstimatedCost: 600, maxEstimatedCost: 1100, status: 'READY' },
    ];

    const mockQuote = {
      id: 'cost-1',
      caseId: 'case-test',
      category: 'moving',
      description: 'Senior Move Estimate',
      source: 'QUOTE' as const,
      amount: 2150,
      providerName: 'Caring Transitions',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const initialBudget = 8000;
    const summary = costEngine.calculatePlanCosts(mockTasks as TransitionTask[], initialBudget, [mockQuote]);

    // Moving range ($1,200-$2,400) is replaced by exact quote ($2,150).
    // Home accessibility ($600-$1,100) remains estimated.
    // minTotal = 2150 + 600 = 2750
    // maxTotal = 2150 + 1100 = 3250
    expect(summary.minTotal).toBe(2750);
    expect(summary.maxTotal).toBe(3250);
    // User available budget must remain strictly $8,000 (NOT overwritten by $2,150 quote)
    expect(summary.userBudget).toBe(8000);
    expect(summary.confirmedQuotesTotal).toBe(2150);
    expect(summary.budgetGap).toBe(3250 - 8000); // -4750 (within budget)
  });

  it('should include standalone quotes that do not match existing task categories', () => {
    const mockTasks: Partial<TransitionTask>[] = [
      { id: '1', title: 'Home Assessment', minEstimatedCost: 500, maxEstimatedCost: 800, status: 'READY' },
    ];

    const standaloneQuote = {
      id: 'cost-2',
      caseId: 'case-test',
      category: 'legal_admin',
      description: 'Elder law consultation',
      source: 'QUOTE' as const,
      amount: 450,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const summary = costEngine.calculatePlanCosts(mockTasks as TransitionTask[], 5000, [standaloneQuote]);

    expect(summary.minTotal).toBe(950); // 500 + 450
    expect(summary.maxTotal).toBe(1250); // 800 + 450
    expect(summary.confirmedQuotesTotal).toBe(450);
  });
});

