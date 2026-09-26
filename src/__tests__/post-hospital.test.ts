import { describe, it, expect, beforeEach } from 'vitest';
import { planningEngine } from '../services/planning-engine';
import { caseService } from '../services/case-service';
import { repository } from '../db/repository';
import { TransitionCase, SeniorProfile, CaseMember } from '../types';

describe('Post-Hospital Workflow Generation (Maria Scenario)', () => {
  beforeEach(async () => {
    await repository.resetAll();
  });

  it('should generate a deterministic post-hospital transition plan with urgent priority', async () => {
    const caseData: TransitionCase = {
      id: 'case-maria-test',
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
      id: 'profile-maria-test',
      caseId: 'case-maria-test',
      name: 'Maria Thompson',
      ageRange: '78',
      livesAlone: true,
      mobilityConstraint: true,
      stairsConstraint: true,
      immediateSafetyConcern: false,
      homeType: 'Two-story house',
      ownsHome: true,
    };

    const members: CaseMember[] = [
      {
        id: 'mem-sarah-test',
        caseId: 'case-maria-test',
        name: 'Sarah',
        relationship: 'Daughter',
        city: 'Chicago, IL',
        isLocal: false,
        role: 'OWNER',
      },
      {
        id: 'mem-jennifer-test',
        caseId: 'case-maria-test',
        name: 'Jennifer',
        relationship: 'Sister',
        city: 'Houston, TX',
        isLocal: true,
        role: 'FAMILY',
      },
    ];

    const result = await planningEngine.generatePlan(caseData, profile, members);

    expect(result.caseData.urgency).toBe('URGENT');
    expect(result.tasks.length).toBeGreaterThan(5);

    // Verify first task is "Confirm safe discharge destination" and initial status is READY
    const dischargeTask = result.tasks.find((t) => t.templateId === 'confirm-discharge-destination');
    expect(dischargeTask).toBeDefined();
    expect(dischargeTask?.status).toBe('READY');

    // Verify dependent task "Decide temporary vs permanent housing" is initially BLOCKED
    const housingTask = result.tasks.find((t) => t.templateId === 'decide-temporary-vs-permanent');
    expect(housingTask).toBeDefined();
    expect(housingTask?.status).toBe('BLOCKED');
  });

  it('should enforce case ownership and prevent owner deletion when deleting members', async () => {
    const owner: CaseMember = {
      id: 'mem-owner-test',
      caseId: 'case-owner-1',
      name: 'Sarah',
      isLocal: false,
      role: 'OWNER',
    };
    const helper: CaseMember = {
      id: 'mem-helper-test',
      caseId: 'case-owner-1',
      name: 'John',
      isLocal: true,
      role: 'HELPER',
    };

    await repository.saveCaseMember(owner);
    await repository.saveCaseMember(helper);

    // Reject deleting primary owner
    await expect(caseService.deleteMember('case-owner-1', 'mem-owner-test')).rejects.toThrow(
      'Cannot delete primary case owner'
    );

    // Reject deleting member from wrong case ID
    await expect(caseService.deleteMember('case-wrong-id', 'mem-helper-test')).rejects.toThrow(
      'Member mem-helper-test not found in case case-wrong-id'
    );

    // Allow deleting valid helper from correct case
    const success = await caseService.deleteMember('case-owner-1', 'mem-helper-test');
    expect(success).toBe(true);
  });
});
