import { TransitionTask, CostItem } from '../types';

export interface CostSummary {
  minTotal: number;
  maxTotal: number;
  userBudget?: number;
  budgetGap: number; // > 0 means over budget, <= 0 means within budget
  disclaimer: string;
  confirmedQuotesTotal?: number;
  costItems?: CostItem[];
}

export class CostEngine {
  public static DISCLAIMER = 'Planning estimates, not vendor quotes.';

  public calculatePlanCosts(
    tasks: TransitionTask[],
    userBudget?: number,
    costItems: CostItem[] = []
  ): CostSummary {
    let minTotal = 0;
    let maxTotal = 0;
    let confirmedQuotesTotal = 0;

    // Index confirmed quotes by category to override planning estimates without double counting
    const quotesByCategory = new Map<string, CostItem>();
    for (const item of costItems) {
      if (
        (item.source === 'QUOTE' || item.source === 'SELECTED_VENDOR' || item.source === 'ACTUAL') &&
        item.amount &&
        item.amount > 0
      ) {
        quotesByCategory.set(item.category.toLowerCase(), item);
        confirmedQuotesTotal += item.amount;
      }
    }

    const appliedQuoteCategories = new Set<string>();

    for (const task of tasks) {
      if (task.status === 'SKIPPED') continue;

      const titleLower = task.title?.toLowerCase() || '';
      const isMovingTask =
        task.templateId === 'schedule-senior-mover' ||
        titleLower.includes('mover') ||
        titleLower.includes('moving');

      if (isMovingTask && quotesByCategory.has('moving')) {
        if (!appliedQuoteCategories.has('moving')) {
          const q = quotesByCategory.get('moving')!;
          minTotal += q.amount || 0;
          maxTotal += q.amount || 0;
          appliedQuoteCategories.add('moving');
        }
        // Planning range is cleanly overridden by actual quote; avoid double-counting
      } else {
        minTotal += task.minEstimatedCost || 0;
        maxTotal += task.maxEstimatedCost || 0;
      }
    }

    // Add any quotes that don't match specific tasks
    for (const [cat, q] of quotesByCategory.entries()) {
      if (!appliedQuoteCategories.has(cat)) {
        minTotal += q.amount || 0;
        maxTotal += q.amount || 0;
        appliedQuoteCategories.add(cat);
      }
    }

    const hasBudget = typeof userBudget === 'number' && userBudget > 0;
    const budgetGap = hasBudget ? maxTotal - (userBudget as number) : 0;

    return {
      minTotal,
      maxTotal,
      userBudget: hasBudget ? userBudget : undefined,
      budgetGap,
      disclaimer: CostEngine.DISCLAIMER,
      confirmedQuotesTotal: confirmedQuotesTotal > 0 ? confirmedQuotesTotal : undefined,
      costItems,
    };
  }
}

export const costEngine = new CostEngine();
