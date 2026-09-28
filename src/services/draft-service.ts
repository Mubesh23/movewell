import { repository } from '../db/repository';
import { planningEngine } from './planning-engine';
import { taskService } from './task-service';
import { resourceService } from './resource-service';
import { eventService } from './event-service';
import { emailService } from './email-service';
import { invitationService } from './invitation-service';
import { intakeReadinessService } from './intake-readiness';
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

export class IntakeNotReadyError extends Error {
  public missingRequiredFields: string[];
  constructor(message: string, missingRequiredFields: string[]) {
    super(message);
    this.name = 'IntakeNotReadyError';
    this.missingRequiredFields = missingRequiredFields;
  }
}

export class DraftService {
  /**
   * Generates a structured PlanDraft proposal from an intake draft.
   * Does NOT create an active TransitionCase.
   */
  public async createDraftFromIntake(
    intakeDraft: IntakeDraft,
    ownerUserId: string
  ): Promise<PlanDraft> {
    // 1. Enforce strict readiness validation
    const readiness = intakeReadinessService.evaluate(intakeDraft);
    if (!readiness.isReady) {
      throw new IntakeNotReadyError(
        `Intake is not ready to generate plan proposal: missing ${readiness.missingRequiredFields.join(', ')}`,
        readiness.missingRequiredFields
      );
    }

    const draftId = 'draft-' + Math.random().toString(36).substring(2, 9);
    const now = new Date();

    // 2. Resolve discharge date without silent artificial fallbacks
    let dischargeDateStr: string | undefined = intakeDraft.dischargeDate;
    if (!dischargeDateStr && intakeDraft.dischargeDays && intakeDraft.dischargeDays > 0) {
      const d = new Date(now);
      d.setDate(d.getDate() + intakeDraft.dischargeDays);
      dischargeDateStr = formatLocalDateYYYYMMDD(d);
    }

    const coordinatorName = intakeDraft.coordinatorName || intakeDraft.userName || 'Family Coordinator';
    const coordinatorRel = intakeDraft.coordinatorRelationship || intakeDraft.userRelationship || 'Family Support';
    const homeType = intakeDraft.homeType || (intakeDraft.stairsConstraint ? 'Two-story house' : 'Single-story house');

    // Build proposed members
    const proposedMembers: ProposedMember[] = [
      {
        id: 'pmem-coord-' + draftId,
        name: coordinatorName,
        relationship: coordinatorRel,
        city: intakeDraft.userCity,
        isLocal: intakeDraft.userIsRemote === undefined ? undefined : !intakeDraft.userIsRemote,
        role: 'OWNER',
      },
    ];

    const memberNameSet = new Set<string>([coordinatorName.toLowerCase()]);

    if (intakeDraft.draftMembers && intakeDraft.draftMembers.length > 0) {
      for (const dm of intakeDraft.draftMembers) {
        if (!memberNameSet.has(dm.name.toLowerCase())) {
          memberNameSet.add(dm.name.toLowerCase());
          proposedMembers.push({
            id: 'pmem-' + Math.random().toString(36).substring(2, 9),
            name: dm.name,
            relationship: dm.relationshipToSenior || 'Family Support',
            city: dm.city,
            isLocal: dm.isLocal,
            availability: dm.availability,
            role: dm.role || 'FAMILY',
            email: dm.email,
            phone: dm.phone,
            invitation: (dm.inviteRequested || dm.invitationRequested) && dm.email
              ? {
                  channel: 'EMAIL',
                  email: dm.email,
                  phone: dm.phone,
                  status: 'DRAFT',
                }
              : undefined,
          });
        }
      }
    }

    if (intakeDraft.familyMembers && intakeDraft.familyMembers.length > 0) {
      for (const fm of intakeDraft.familyMembers) {
        if (!memberNameSet.has(fm.name.toLowerCase())) {
          memberNameSet.add(fm.name.toLowerCase());
          proposedMembers.push({
            id: 'pmem-' + Math.random().toString(36).substring(2, 9),
            name: fm.name,
            relationship: fm.relationship || 'Local Support',
            city: fm.city,
            isLocal: fm.isLocal,
            availability: fm.availability,
            role: fm.role || 'FAMILY',
            email: fm.email,
            phone: fm.phone,
            invitation: fm.invite
              ? {
                  channel: 'EMAIL',
                  email: fm.email || fm.invite.contact,
                  status: 'DRAFT',
                }
              : undefined,
          });
        }
      }
    } else if (intakeDraft.localHelperName && !memberNameSet.has(intakeDraft.localHelperName.toLowerCase())) {
      proposedMembers.push({
        id: 'pmem-helper-' + draftId,
        name: intakeDraft.localHelperName,
        relationship: 'Local Support',
        city: intakeDraft.localHelperCity,
        isLocal: intakeDraft.hasLocalHelper === true ? true : undefined,
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
      label: intakeDraft.seniorName ? `${intakeDraft.seniorName}'s Home` : 'Primary Residence',
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
        name: intakeDraft.seniorName || 'Family Member',
        ageRange: intakeDraft.ageRange,
        livesAlone: intakeDraft.livesAlone,
        mobilityConstraint: Boolean(intakeDraft.mobilityConstraint),
        stairsConstraint: Boolean(intakeDraft.stairsConstraint),
        homeType: intakeDraft.homeType,
      },
      dischargeTiming: {
        date: dischargeDateStr,
        days: intakeDraft.dischargeDays,
        time: intakeDraft.dischargeTime,
        description: intakeDraft.dischargeTimelineDescription,
        precision: intakeDraft.dischargePrecision,
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

    // Strict ownership verification: requester must be the draft owner
    if (draft.ownerUserId !== userId) {
      throw new Error('Unauthorized to modify this draft');
    }

    return repository.updatePlanDraft(draftId, updates);
  }

  /**
   * Safely links/transfers an anonymous draft to an authenticated user,
   * requiring proof of possession of the current session token.
   */
  public async claimDraft(
    draftId: string,
    currentSessionToken: string,
    authenticatedUserId: string
  ): Promise<PlanDraft> {
    const draft = await repository.getPlanDraftById(draftId);
    if (!draft) {
      throw new Error(`Draft ${draftId} not found`);
    }

    if (draft.ownerUserId !== currentSessionToken) {
      throw new Error('Unauthorized: cannot claim draft without possessing current draft session token');
    }

    return repository.updatePlanDraft(draftId, { ownerUserId: authenticatedUserId });
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

    // 2. Strict ownership check
    if (draft.ownerUserId !== userId) {
      throw new Error('Unauthorized to activate this draft');
    }

    const now = new Date();
    const caseId = 'case-' + Math.random().toString(36).substring(2, 9);
    const seniorProfileId = 'prof-' + Math.random().toString(36).substring(2, 9);

    const homeLocation = draft.proposedLocations.find((l) => l.type === 'HOME') || draft.proposedLocations[0];
    const zipCode = homeLocation?.zipCode?.trim() || undefined;

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
        availability: pm.availability,
        role: pm.role,
        email: pm.email,
        phone: pm.phone,
        invitationStatus: pm.invitation ? 'PENDING' : 'NONE',
        invitationChannel: pm.invitation?.channel,
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
      
      let matchedAssignee: CaseMember | undefined = undefined;
      const rawAssignee = (pt.assigneeName || '').trim();
      if (rawAssignee && rawAssignee.toLowerCase() !== 'unassigned') {
        matchedAssignee = createdMembers.find(
          (m) => m.name.toLowerCase() === rawAssignee.toLowerCase()
        );
      }

      const task: TransitionTask = {
        id: taskId,
        caseId,
        templateId: pt.templateId,
        title: pt.title,
        description: pt.description,
        whyItMatters: pt.whyItMatters,
        status: 'NOT_STARTED',
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

    // Accurately recalculate statuses based on dependencies
    await taskService.recalculateDependencies(caseId);

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

    // 8b. Dispatch email invitations for staged collaborators using secure tokenized invitations
    const ownerMember = createdMembers.find((m) => m.role === 'OWNER') || createdMembers[0];
    for (const member of createdMembers) {
      if (member.invitationStatus === 'PENDING' && member.email) {
        await invitationService.createAndSendInvitation({
          caseId,
          memberId: member.id,
          email: member.email,
          recipientName: member.name,
          inviterName: ownerMember?.name || 'Family Coordinator',
          seniorName: seniorProfile.name,
          role: member.role,
          relationship: member.relationship,
        });
      }
    }

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
