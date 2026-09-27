import { describe, it, expect, beforeEach } from 'vitest';
import { repository } from '../db/repository';
import { memoryStore } from '../db/memory-store';
import { caseService } from '../services/case-service';
import { costEngine } from '../services/cost-engine';
import { TransitionCase, SeniorProfile, TransitionTask, CostItem } from '../types';

describe('Vendor Quote Persistence & Budget Integrity', () => {
  const caseId = 'case-quote-test';

  beforeEach(async () => {
    memoryStore.clear();
    const mockCase: TransitionCase = {
      id: caseId,
      seniorId: 'senior-quote',
      status: 'PLANNING',
      urgency: 'URGENT',
      targetDate: '2026-10-15',
      dischargeDate: '2026-10-02',
      destinationStatus: 'UNDECIDED',
      budget: 8000,
      zipCode: '77004',
      originAddress: '123 Main St',
      transitionType: 'POST_HOSPITAL',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await repository.saveCase(mockCase);

    const mockSenior: SeniorProfile = {
      id: 'senior-quote',
      caseId,
      name: 'Maria Thompson',
      age: 78,
      hospitalized: true,
      mobilityNotes: 'Needs walker',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await repository.saveSeniorProfile(mockSenior);

    const mockTask: TransitionTask = {
      id: 'task-mover',
      caseId,
      templateId: 'schedule-senior-mover',
      title: 'Schedule Senior Move Manager / Mover',
      status: 'READY',
      priority: 1,
      phase: 'THIS_WEEK',
      minEstimatedCost: 1200,
      maxEstimatedCost: 2400,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await repository.saveTask(mockTask);
  });

  it('persists a vendor quote as CostItem without mutating family case budget', async () => {
    const quote: CostItem = {
      id: 'cost-item-1',
      caseId,
      category: 'moving',
      description: 'Senior Move - 2 Bedroom Estimate',
      source: 'QUOTE',
      amount: 2150,
      providerName: 'Caring Transitions of Greater Houston',
      documentName: 'Caring_Transitions_Quote.pdf',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await repository.saveCostItem(quote);

    // Retrieve cost items
    const savedQuotes = await repository.getCostItemsByCaseId(caseId);
    expect(savedQuotes.length).toBe(1);
    expect(savedQuotes[0].amount).toBe(2150);
    expect(savedQuotes[0].providerName).toBe('Caring Transitions of Greater Houston');

    // Case overview check: caseData.budget remains $8,000!
    const overview = await caseService.getCaseOverview(caseId);
    expect(overview.caseData.budget).toBe(8000);
    expect(overview.costSummary.userBudget).toBe(8000);
    expect(overview.costSummary.confirmedQuotesTotal).toBe(2150);

    // The moving range (1200-2400) was replaced by 2150 in the cost calculations
    expect(overview.costSummary.minTotal).toBe(2150);
    expect(overview.costSummary.maxTotal).toBe(2150);
    expect(overview.costSummary.budgetGap).toBe(2150 - 8000); // -5850 (under budget)
  });
});
