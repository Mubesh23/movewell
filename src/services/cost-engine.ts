import { TransitionTask } from '../types';

export interface CostSummary {
  minTotal: number;
  maxTotal: number;
  userBudget: number;
  budgetGap: number; // > 0 means over budget, <= 0 means within budget
  disclaimer: string;
}

export class CostEngine {
  public static DISCLAIMER = 'Planning estimates, not vendor quotes.';

  public calculatePlanCosts(tasks: TransitionTask[], userBudget: number): CostSummary {
    let minTotal = 0;
    let maxTotal = 0;

    for (const task of tasks) {
      if (task.status !== 'SKIPPED') {
        minTotal += task.minEstimatedCost || 0;
        maxTotal += task.maxEstimatedCost || 0;
      }
    }

    const budgetGap = maxTotal - userBudget;

    return {
      minTotal,
      maxTotal,
      userBudget,
      budgetGap,
      disclaimer: CostEngine.DISCLAIMER,
    };
  }
}

export const costEngine = new CostEngine();
