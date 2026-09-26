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
});
