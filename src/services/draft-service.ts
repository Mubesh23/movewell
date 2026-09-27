import { repository } from '../db/repository';
import { planningEngine } from './planning-engine';
import { resourceService } from './resource-service';
import { eventService } from './event-service';
import {
  IntakeDraft,
  PlanDraft,
  ProposedTask,
  ProposedMember,
  ProposedResourceNeed,
  CaseLocation,
  TransitionCase,
  SeniorProfile,
  CaseMember,
  TransitionTask,
  TaskDependency,
  formatLocalDateYYYYMMDD,
} from '../types';

export class DraftService {
  /**
   * Generates a structured PlanDraft proposal from an intake draft.
   * Does NOT create an active TransitionCase.
   */
  public async createDraftFromIntake(
    intakeDraft: IntakeDraft,
    ownerUserId: string
  ): Promise<PlanDraft> {
    const draftId = 'draft-' + Math.random().toString(36).substring(2, 9);
    const now = new Date();

    // Calculate discharge date
    let dischargeDateStr: string;
    if (intakeDraft.dischargeDate) {
      dischargeDateStr = intakeDraft.dischargeDate;
    } else {
      const days = intakeDraft.dischargeDays && intakeDraft.dischargeDays > 0 ? intakeDraft.dischargeDays : 5;
      const d = new Date(now);
      d.setDate(d.getDate() + days);
      dischargeDateStr = formatLocalDateYYYYMMDD(d);
    }

    const targetDate = new Date(now);
    targetDate.setDate(targetDate.getDate() + 12);
    const targetDateStr = formatLocalDateYYYYMMDD(targetDate);

    const coordinatorName = intakeDraft.userName || 'You';
    const homeType = intakeDraft.homeType || (intakeDraft.stairsConstraint ? 'Two-story house' : 'Single-story house');

    // Build proposed members
    const proposedMembers: ProposedMember[] = [
      {
        id: 'pmem-coord-' + draftId,
        name: coordinatorName,
        relationship: intakeDraft.userRelationship || 'Family Coordinator',
        city: intakeDraft.userCity,
        isLocal: !intakeDraft.userIsRemote,
        role: 'OWNER',
      },
    ];

    if (intakeDraft.localHelperName) {
      proposedMembers.push({
        id: 'pmem-helper-' + draftId,
        name: intakeDraft.localHelperName,
        relationship: 'Sister / Local Support',
        city: intakeDraft.localHelperCity,
        isLocal: true,
        role: 'FAMILY',
      });
    }

    // Run in-memory proposed tasks generation
    const proposedTasks = planningEngine.buildProposedTasks(
      dischargeDateStr,
      coordinatorName,
      intakeDraft.localHelperName
    );

    // Proposed locations
    const homeLocation: CaseLocation = {
      id: 'loc-' + Math.random().toString(36).substring(2, 9),
      planDraftId: draftId,
      type: 'HOME',
      label: `${intakeDraft.seniorName || 'Mom'}'s Home`,
      city: intakeDraft.city,
      zipCode: intakeDraft.zipCode && intakeDraft.zipCode !== 'UNSET' ? intakeDraft.zipCode : undefined,
      createdAt: now.toISOString(),
    };

    // Task resource intents
    const resourceNeedsMap = new Map<string, ProposedResourceNeed>();
    for (const t of proposedTasks) {
      const intent = resourceService.getIntentForTask(t.templateId, t.title);
      if (intent && !resourceNeedsMap.has(intent.category)) {
        resourceNeedsMap.set(intent.category, intent);
      }
    }
    const proposedResourceNeeds = Array.from(resourceNeedsMap.values());

    const planDraft: PlanDraft = {
      id: draftId,
      ownerUserId,
      seniorProfile: {
        name: intakeDraft.seniorName || 'Mom',
        ageRange: intakeDraft.ageRange,
        livesAlone: intakeDraft.livesAlone ?? true,
        mobilityConstraint: Boolean(intakeDraft.mobilityConstraint),
        stairsConstraint: Boolean(intakeDraft.stairsConstraint),
        homeType: intakeDraft.homeType,
      },
      dischargeTiming: {
        date: dischargeDateStr,
        days: intakeDraft.dischargeDays,
        description: intakeDraft.dischargeTimelineDescription,
      },
      proposedTasks,
      proposedMembers,
      proposedBudget: intakeDraft.budget,
      budgetStatus: intakeDraft.budgetStatus || (intakeDraft.budget ? 'SET' : 'UNSET'),
      proposedLocations: [homeLocation],
      proposedResourceNeeds,
      status: 'DRAFT',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    await repository.savePlanDraft(planDraft);
    await repository.saveCaseLocation(homeLocation);

    return planDraft;
  }

  /**
   * Retrieves a draft by ID.
   */
  public async getDraft(draftId: string): Promise<PlanDraft | null> {
    return repository.getPlanDraftById(draftId);
  }

  /**
   * Updates an existing draft before activation.
   * Does NOT trigger active case events.
   */
  public async updateDraft(
    draftId: string,
    updates: Partial<PlanDraft>,
    userId: string
  ): Promise<PlanDraft> {
    const draft = await repository.getPlanDraftById(draftId);
    if (!draft) {
      throw new Error(`Draft ${draftId} not found`);
    }

    // Allow owner or linking if updating
    if (draft.ownerUserId !== userId) {
      // If user was anonymous and is now claiming the draft, allow reassigning owner
      if (draft.ownerUserId.startsWith('anon-') || draft.ownerUserId === 'anonymous') {
        updates.ownerUserId = userId;
      } else {
        throw new Error('Unauthorized to modify this draft');
      }
    }

    return repository.updatePlanDraft(draftId, updates);
  }

  /**
   * Idempotently activates a draft into an active TransitionCase.
   * Retrying this request returns the already activated case.
   */
  public async activateDraft(
    draftId: string,
    userId: string
  ): Promise<{ success: boolean; caseId: string }> {
    const draft = await repository.getPlanDraftById(draftId);
    if (!draft) {
      throw new Error(`Draft ${draftId} not found`);
    }

    // 1. Idempotency check: if already activated, return existing case
    if (draft.status === 'ACTIVATED' && draft.caseId) {
      return { success: true, caseId: draft.caseId };
    }

    // 2. Ownership check or claim
    if (draft.ownerUserId !== userId) {
      if (draft.ownerUserId.startsWith('anon-') || draft.ownerUserId === 'anonymous') {
        draft.ownerUserId = userId;
      } else {
        throw new Error('Unauthorized to activate this draft');
      }
    }

    const now = new Date();
    const caseId = 'case-' + Math.random().toString(36).substring(2, 9);
    const seniorProfileId = 'prof-' + Math.random().toString(36).substring(2, 9);

    const homeLocation = draft.proposedLocations.find((l) => l.type === 'HOME') || draft.proposedLocations[0];
    const zipCode = homeLocation?.zipCode?.trim() || 'UNSET';

    // 3. Create TransitionCase
    const caseData: TransitionCase = {
      id: caseId,
      ownerUserId: userId,
      seniorProfileId,
      transitionType: 'POST_HOSPITAL',
      urgency: 'URGENT',
      zipCode,
      targetDate: draft.dischargeTiming?.date,
      dischargeDate: draft.dischargeTiming?.date,
      housingStatus: 'OWN',
      destinationStatus: 'UNDECIDED',
      budget: draft.budgetStatus === 'SET' && draft.proposedBudget ? draft.proposedBudget : undefined,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
    await repository.saveCase(caseData);

    // 4. Create SeniorProfile
    const seniorProfile: SeniorProfile = {
      id: seniorProfileId,
      caseId,
      name: draft.seniorProfile.name,
      ageRange: draft.seniorProfile.ageRange,
      livesAlone: draft.seniorProfile.livesAlone,
      mobilityConstraint: draft.seniorProfile.mobilityConstraint,
      stairsConstraint: draft.seniorProfile.stairsConstraint,
      immediateSafetyConcern: false,
      homeType: draft.seniorProfile.homeType,
      ownsHome: true,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
    await repository.saveSeniorProfile(seniorProfile);

    // 5. Create CaseMembers
    const createdMembers: CaseMember[] = [];
    for (const pm of draft.proposedMembers) {
      const memberId = 'mbr-' + Math.random().toString(36).substring(2, 9);
      const isOwner = pm.role === 'OWNER';
      const member: CaseMember = {
        id: memberId,
        caseId,
        userId: isOwner ? userId : undefined,
        name: pm.name,
        relationship: pm.relationship,
        city: pm.city,
        isLocal: pm.isLocal,
        role: pm.role,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      };
      await repository.saveCaseMember(member);
      createdMembers.push(member);
    }

    // 6. Create TransitionTasks & dependencies
    const createdTasks: TransitionTask[] = [];
    const applicableTasks = draft.proposedTasks.filter((t) => t.applicable !== false);

    for (let i = 0; i < applicableTasks.length; i++) {
      const pt = applicableTasks[i];
      const taskId = 'tsk-' + Math.random().toString(36).substring(2, 9);
      const matchedAssignee = createdMembers.find(
        (m) => m.name.toLowerCase() === (pt.assigneeName || '').toLowerCase()
      ) || createdMembers[0];

      const task: TransitionTask = {
        id: taskId,
        caseId,
        templateId: pt.templateId,
        title: pt.title,
        description: pt.description,
        whyItMatters: pt.whyItMatters,
        status: i === 0 ? 'READY' : 'NOT_STARTED',
        priority: pt.priority || i + 1,
        phase: pt.phase,
        dueDate: pt.dueDate,
        assigneeId: matchedAssignee?.id,
        minEstimatedCost: pt.minEstimatedCost || 0,
        maxEstimatedCost: pt.maxEstimatedCost || 0,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      };

      await repository.saveTask(task);
      createdTasks.push(task);
    }

    // Build task dependencies
    const taskByTemplate = new Map(createdTasks.map((t) => [t.templateId, t.id]));
    const defaultDeps = [
      { child: 'assess-home-accessibility', parent: 'confirm-discharge-destination' },
      { child: 'decide-housing-duration', parent: 'confirm-discharge-destination' },
      { child: 'inventory-belongings', parent: 'decide-housing-duration' },
      { child: 'schedule-senior-mover', parent: 'inventory-belongings' },
      { child: 'schedule-donation-pickup', parent: 'inventory-belongings' },
      { child: 'arrange-transportation', parent: 'confirm-discharge-destination' },
    ];

    const dependenciesToSave: TaskDependency[] = [];
    for (const dep of defaultDeps) {
      const childId = taskByTemplate.get(dep.child);
      const parentId = taskByTemplate.get(dep.parent);
      if (childId && parentId) {
        dependenciesToSave.push({ taskId: childId, dependsOnTaskId: parentId });
      }
    }
    if (dependenciesToSave.length > 0) {
      await repository.saveTaskDependencies(dependenciesToSave);
    }

    // 7. Save case locations
    for (const loc of draft.proposedLocations) {
      await repository.saveCaseLocation({
        ...loc,
        id: 'loc-' + Math.random().toString(36).substring(2, 9),
        caseId,
        planDraftId: draftId,
      });
    }

    // 8. Record audit events
    await eventService.recordEvent(caseId, 'CASE_CREATED', {
      planDraftId: draftId,
      seniorName: seniorProfile.name,
      urgency: caseData.urgency,
      ownerUserId: userId,
    });
    await eventService.recordEvent(caseId, 'PLAN_GENERATED', {
      tasksCount: createdTasks.length,
      membersCount: createdMembers.length,
      budget: caseData.budget,
    });

    // 9. Mark draft as ACTIVATED
    await repository.updatePlanDraft(draftId, {
      status: 'ACTIVATED',
      caseId,
      ownerUserId: userId,
    });

    return { success: true, caseId };
  }
}

export const draftService = new DraftService();
