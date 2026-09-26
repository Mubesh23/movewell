import { describe, it, expect, beforeEach } from 'vitest';
import { planningEngine } from '../services/planning-engine';
import { taskService } from '../services/task-service';
import { repository } from '../db/repository';
import { TransitionCase, SeniorProfile, CaseMember } from '../types';

describe('Task Dependency Recalculation', () => {
  beforeEach(async () => {
    await repository.resetAll();
  });

  it('should unlock downstream blocked tasks when blocking task is completed', async () => {
    const caseData: TransitionCase = {
      id: 'case-dep-test',
      transitionType: 'POST_HOSPITAL',
      urgency: 'URGENT',
      zipCode: '77004',
      targetDate: '2026-11-07',
      dischargeDate: '2026-11-01',
      budget: 8000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const profile: SeniorProfile = {
      id: 'prof-dep-test',
      caseId: 'case-dep-test',
      name: 'Maria Thompson',
      livesAlone: true,
      mobilityConstraint: true,
      stairsConstraint: true,
      immediateSafetyConcern: false,
      ownsHome: true,
    };

    const members: CaseMember[] = [
      {
        id: 'mem-1',
        caseId: 'case-dep-test',
        name: 'Sarah',
        isLocal: false,
        role: 'OWNER',
      },
    ];

    const plan = await planningEngine.generatePlan(caseData, profile, members);

    const dischargeTask = plan.tasks.find((t) => t.templateId === 'confirm-discharge-destination')!;
    const housingTask = plan.tasks.find((t) => t.templateId === 'decide-temporary-vs-permanent')!;

    // Initial status: discharge task is READY, housing task is BLOCKED
    expect(dischargeTask.status).toBe('READY');
    expect(housingTask.status).toBe('BLOCKED');

    // Complete the discharge task
    await taskService.completeTask(dischargeTask.id, 'Sarah');

    // Fetch updated housing task
    const updatedHousingTask = await repository.getTaskById(housingTask.id);
    expect(updatedHousingTask?.status).toBe('READY');

    // Reopen discharge task
    await taskService.reopenTask(dischargeTask.id, 'Sarah');

    // Housing task should revert back to BLOCKED
    const revertedHousingTask = await repository.getTaskById(housingTask.id);
    expect(revertedHousingTask?.status).toBe('BLOCKED');
  });
});
