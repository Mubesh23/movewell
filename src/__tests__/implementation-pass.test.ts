import { describe, it, expect, beforeEach } from 'vitest';
import { caseService } from '../services/case-service';
import { taskService } from '../services/task-service';
import { draftService } from '../services/draft-service';
import { repository } from '../db/repository';
import { TransitionCase, SeniorProfile, CaseMember, TransitionTask } from '../types';

describe('BridgeWell Implementation Pass Verification', () => {
  const caseId = 'case-test-pass-001';
  const profileId = 'prof-test-pass-001';

  beforeEach(async () => {
    // Setup test case
    const testCase: TransitionCase = {
      id: caseId,
      ownerUserId: 'user-sarah-123',
      seniorProfileId: profileId,
      transitionType: 'POST_HOSPITAL',
      urgency: 'URGENT',
      zipCode: '77004',
      targetDate: '2026-10-15',
      dischargeDate: '2026-10-15',
      destinationStatus: 'UNDECIDED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await repository.saveCase(testCase);

    const profile: SeniorProfile = {
      id: profileId,
      caseId,
      name: 'Maria Hernandez',
      mobilityConstraint: true,
      stairsConstraint: true,
      immediateSafetyConcern: false,
      ownsHome: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await repository.saveSeniorProfile(profile);

    const sarah: CaseMember = {
      id: 'mbr-sarah',
      caseId,
      name: 'Sarah',
      role: 'OWNER',
      isLocal: false,
      city: 'Austin, TX',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const jennifer: CaseMember = {
      id: 'mbr-jennifer',
      caseId,
      name: 'Jennifer',
      role: 'FAMILY',
      isLocal: true,
      city: 'Houston, TX',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await repository.saveCaseMember(sarah);
    await repository.saveCaseMember(jennifer);
  });

  it('confirms discharge destination deterministically and unlocks downstream tasks', async () => {
    // 1. Create decision task and dependent downstream task
    const decisionTask: TransitionTask = {
      id: 'task-decision-dest',
      caseId,
      templateId: 'confirm-discharge-destination',
      title: 'Confirm discharge destination with hospital social worker',
      status: 'READY',
      priority: 1,
      phase: 'RIGHT_NOW',
      minEstimatedCost: 0,
      maxEstimatedCost: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const downstreamTask: TransitionTask = {
      id: 'task-eval-rehab',
      caseId,
      templateId: 'evaluate-rehab-facilities',
      title: 'Tour and compare short-term rehab facilities',
      status: 'BLOCKED',
      priority: 2,
      phase: 'RIGHT_NOW',
      minEstimatedCost: 0,
      maxEstimatedCost: 0,
      dependsOnTaskIds: ['task-decision-dest'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await repository.saveTask(decisionTask);
    await repository.saveTask(downstreamTask);
    await repository.saveTaskDependencies([
      {
        taskId: downstreamTask.id,
        dependsOnTaskId: decisionTask.id,
      },
    ]);

    // 2. Confirm destination to REHAB_FIRST
    const result = await caseService.confirmDischargeDestination({
      caseId,
      destination: 'REHAB_FIRST',
      actor: 'Sarah',
      note: 'Hospital social worker confirmed rehab placement.',
    });

    // 3. Verify destination status updated
    expect(result.caseData.destinationStatus).toBe('REHAB_FIRST');
    const updatedCase = await repository.getCaseById(caseId);
    expect(updatedCase?.destinationStatus).toBe('REHAB_FIRST');

    // 4. Verify decision task was marked complete with audit note
    const updatedDecision = await repository.getTaskById('task-decision-dest');
    expect(updatedDecision?.status).toBe('COMPLETED');
    expect(updatedDecision?.completionNotes).toContain('Hospital social worker confirmed rehab placement.');

    // 5. Verify downstream task was unblocked to READY
    const updatedDownstream = await repository.getTaskById('task-eval-rehab');
    expect(updatedDownstream?.status).toBe('READY');

    // 6. Verify plan change record was generated with diffs
    expect(result.planChange.diffs.length).toBeGreaterThan(0);
    expect(result.planChange.diffs[0].label).toBe('Discharge Destination');
    expect(result.planChange.diffs[0].after).toBe('Short-term rehab first');
  });

  it('completes task and preserves completion audit notes', async () => {
    const task: TransitionTask = {
      id: 'task-sarah-note',
      caseId,
      title: 'Pick up medical equipment',
      status: 'READY',
      priority: 3,
      phase: 'NEXT',
      minEstimatedCost: 50,
      maxEstimatedCost: 150,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await repository.saveTask(task);

    const completed = await taskService.completeTask(
      task.id,
      'Sarah',
      caseId,
      'Wheelchair and walker picked up from medical supply depot.'
    );

    expect(completed.status).toBe('COMPLETED');
    expect(completed.completionNotes).toBe('Wheelchair and walker picked up from medical supply depot.');
  });

  it('preserves unknown locality as undefined in draft service', async () => {
    const draft = await draftService.createDraftFromIntake(
      {
        seniorName: 'Maria',
        transitionType: 'POST_HOSPITAL',
        dischargeTimelineDescription: 'Friday',
        dischargeDays: 5,
        mobilityConstraint: true,
        stairsConstraint: true,
        zipCode: '77004',
        city: 'Houston, TX',
        userName: 'Michael',
        userRelationship: 'Son',
        userCity: 'Houston, TX',
        // userIsRemote is deliberately undefined
        careCircleAddressed: true,
        budgetStatus: 'UNSET',
        draftMembers: [
          {
            id: 'dm-1',
            name: 'David',
            relationshipToSenior: 'Nephew',
            city: 'Dallas, TX',
            isLocal: false,
          },
          {
            id: 'dm-2',
            name: 'Carlos',
            relationshipToSenior: 'Cousin',
            // isLocal is undefined
          },
        ],
      },
      'user-temp'
    );

    const coordMember = draft.proposedMembers.find((m) => m.role === 'OWNER');
    expect(coordMember?.isLocal).toBeUndefined();

    const remoteMember = draft.proposedMembers.find((m) => m.name === 'David');
    expect(remoteMember?.isLocal).toBe(false);

    const unknownMember = draft.proposedMembers.find((m) => m.name === 'Carlos');
    expect(unknownMember?.isLocal).toBeUndefined();
  });
});
