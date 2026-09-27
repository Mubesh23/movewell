import { describe, it, expect, beforeEach } from 'vitest';
import { AI_TOOLS_REGISTRY } from '../ai/tools';
import { repository } from '../db/repository';
import { memoryStore } from '../db/memory-store';
import { TransitionCase, SeniorProfile } from '../types';

describe('aiTools.update_case_context Event Semantics', () => {
  const caseId = 'case-event-test';

  beforeEach(async () => {
    memoryStore.clear();
    // Set up test case in repository
    const mockCase: TransitionCase = {
      id: caseId,
      seniorProfileId: 'senior-test',
      urgency: 'URGENT',
      targetDate: '2026-10-15',
      dischargeDate: '2026-10-02',
      destinationStatus: 'UNDECIDED',
      budget: 8000,
      zipCode: '77004',
      transitionType: 'POST_HOSPITAL',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await repository.saveCase(mockCase);

    const mockSenior: SeniorProfile = {
      id: 'senior-test',
      caseId,
      name: 'Maria Thompson',
      ageRange: '75-84',
      livesAlone: true,
      mobilityConstraint: true,
      stairsConstraint: true,
      immediateSafetyConcern: true,
      ownsHome: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await repository.saveSeniorProfile(mockSenior);
  });

  it('records BUDGET_UPDATED only when budget changes', async () => {
    const res = await AI_TOOLS_REGISTRY.update_case_context({
      caseId,
      budget: 10000,
    });

    expect(res.success).toBe(true);
    expect(res.message).toContain('Updated case budget to $10,000.');
    expect(res.message).not.toContain('discharge destination');

    const events = await repository.getCaseEvents(caseId);
    const budgetEvent = events.find((e) => e.type === 'BUDGET_UPDATED');
    expect(budgetEvent).toBeDefined();
    expect(budgetEvent?.payload.budget).toBe(10000);

    const destEvent = events.find((e) => e.type === 'DESTINATION_CONFIRMED');
    expect(destEvent).toBeUndefined();
  });

  it('records DESTINATION_CONFIRMED and not BUDGET_UPDATED when destinationStatus is updated', async () => {
    const res = await AI_TOOLS_REGISTRY.update_case_context({
      caseId,
      destinationStatus: 'REHAB_FIRST',
    });

    expect(res.success).toBe(true);
    expect(res.message).toContain('Updated discharge destination status to short-term rehab (REHAB_FIRST).');
    expect(res.message).not.toContain('budget');

    const events = await repository.getCaseEvents(caseId);
    const destEvent = events.find((e) => e.type === 'DESTINATION_CONFIRMED');
    expect(destEvent).toBeDefined();
    expect(destEvent?.payload.destinationStatus).toBe('REHAB_FIRST');

    const budgetEvent = events.find((e) => e.type === 'BUDGET_UPDATED');
    expect(budgetEvent).toBeUndefined();
  });

  it('records TARGET_DATE_CHANGED when dates change', async () => {
    const res = await AI_TOOLS_REGISTRY.update_case_context({
      caseId,
      targetDate: '2026-10-20',
    });

    expect(res.success).toBe(true);
    expect(res.message).toContain('Updated target date to 2026-10-20.');

    const events = await repository.getCaseEvents(caseId);
    const dateEvent = events.find((e) => e.type === 'TARGET_DATE_CHANGED');
    expect(dateEvent).toBeDefined();
    expect(dateEvent?.payload.targetDate).toBe('2026-10-20');
  });
});
