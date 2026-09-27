import { IntakeDraft, IntakeTargetField, IntakeReadinessResult } from '../types';

export class IntakeReadinessService {
  /**
   * Deterministically evaluates if an intake draft contains minimum viable case data
   * to generate a safe, actionable transition plan without forcing artificial defaults.
   */
  public evaluate(draft: IntakeDraft): IntakeReadinessResult {
    const missingRequiredFields: string[] = [];

    // Do not invent or accept invalid verbs as senior names
    const INVALID_NAMES = new Set([
      'fell', 'had', 'is', 'was', 'has', 'went', 'broke', 'needs', 'lives', 'called', 'got', 'suffered'
    ]);
    if (draft.seniorName && INVALID_NAMES.has(draft.seniorName.trim().toLowerCase())) {
      draft.seniorName = undefined;
    }

    const hasSenior = Boolean(draft.seniorName && draft.seniorName.trim().length > 0);
    const hasDischarge = Boolean(
      draft.dischargeDate ||
      (draft.dischargeDays !== undefined && draft.dischargeDays > 0) ||
      (draft.dischargeTimelineDescription && draft.dischargeTimelineDescription.trim().length > 0)
    );
    const needsTimingClarification = Boolean(
      draft.timingClarificationNeeded ||
      (draft.dischargeTimelineDescription?.toLowerCase().includes('next week') &&
        !draft.dischargeDate &&
        draft.dischargeDays === undefined)
    );

    const hasMobilityOrSafety =
      draft.mobilityConstraint !== undefined ||
      draft.stairsConstraint !== undefined;
    
    const hasLocation = Boolean(
      (draft.zipCode && draft.zipCode.trim().length > 0 && draft.zipCode !== 'UNSET') ||
      (draft.city && draft.city.trim().length > 0)
    );

    const hasCoordinatorIdentity = Boolean(
      (draft.coordinatorName && draft.coordinatorName.trim().length > 0) ||
      (draft.userName && draft.userName.trim().length > 0)
    );

    const hasCoordinatorRelationship = Boolean(
      (draft.coordinatorRelationship && draft.coordinatorRelationship.trim().length > 0) ||
      (draft.userRelationship && draft.userRelationship.trim().length > 0)
    );

    const hasCoordinator = hasCoordinatorIdentity && hasCoordinatorRelationship;

    const hasCareCircle = Boolean(
      draft.careCircleAddressed ||
      (draft.draftMembers && draft.draftMembers.length > 0) ||
      (draft.familyMembers && draft.familyMembers.length > 0) ||
      draft.hasLocalHelper !== undefined ||
      draft.localHelperName
    );

    const hasBudgetStatus = draft.budget !== undefined || draft.budgetStatus === 'UNSET' || draft.budgetStatus === 'SET';

    if (!hasSenior) missingRequiredFields.push('senior reference or name');
    if (!hasDischarge) missingRequiredFields.push('discharge timing');
    if (needsTimingClarification) missingRequiredFields.push('clarification on discharge timing');
    if (!hasMobilityOrSafety) missingRequiredFields.push('mobility and home safety situation');
    if (!hasLocation) missingRequiredFields.push('location or ZIP code');
    if (!hasCareCircle) missingRequiredFields.push('care circle or local support');
    if (!hasCoordinator) missingRequiredFields.push('family coordinator role');
    if (!hasCoordinatorIdentity) missingRequiredFields.push('coordinator name');
    if (!hasCoordinatorRelationship) missingRequiredFields.push('coordinator relationship');
    if (!hasBudgetStatus) missingRequiredFields.push('budget preference');

    // Sequence: Timing → Timing Clarification → Mobility/Safety → Location → Care Circle → Coordinator Identity → Coordinator Relationship → Budget
    let nextTargetField: IntakeTargetField = 'NONE';
    if (!hasDischarge) {
      nextTargetField = 'DISCHARGE_TIMING';
    } else if (needsTimingClarification) {
      nextTargetField = 'TIMING_CLARIFICATION';
    } else if (!hasMobilityOrSafety) {
      nextTargetField = 'SAFETY_MOBILITY';
    } else if (!hasLocation) {
      nextTargetField = 'LOCATION';
    } else if (!hasCareCircle) {
      nextTargetField = 'LOCAL_SUPPORT';
    } else if (!hasCoordinatorIdentity) {
      nextTargetField = 'COORDINATOR_NAME';
    } else if (!hasCoordinatorRelationship) {
      nextTargetField = 'COORDINATOR_RELATIONSHIP';
    } else if (!hasBudgetStatus) {
      nextTargetField = 'BUDGET';
    } else {
      nextTargetField = 'NONE';
    }

    // Minimum viable threshold: senior, discharge, mobility, location, care circle, coordinator (identity + relationship), and budget
    const isReady =
      hasSenior &&
      hasDischarge &&
      !needsTimingClarification &&
      hasMobilityOrSafety &&
      hasLocation &&
      hasCareCircle &&
      hasCoordinator &&
      hasBudgetStatus;

    const summaryBulletPoints: string[] = [];
    const seniorLabel = draft.seniorName || 'Family member';
    summaryBulletPoints.push(
      `${seniorLabel}${draft.ageRange ? `, ${draft.ageRange}` : ''} · Post-hospital transition`
    );

    if (draft.dischargeTimelineDescription) {
      summaryBulletPoints.push(
        `Discharge ${draft.dischargeTimelineDescription}${draft.dischargeTime ? ` at ${draft.dischargeTime}` : ''}`
      );
    } else if (draft.dischargeDays) {
      summaryBulletPoints.push(`Discharge in ~${draft.dischargeDays} days`);
    } else if (draft.dischargeDate) {
      summaryBulletPoints.push(`Discharge target: ${draft.dischargeDate}`);
    }

    const mobilityNotes: string[] = [];
    if (draft.livesAlone) mobilityNotes.push('Lives alone');
    if (draft.mobilityConstraint) mobilityNotes.push('Uses walker / mobility limitations');
    if (draft.stairsConstraint) mobilityNotes.push('Bedroom upstairs / stairs hazard');
    if (draft.mobilityConstraint === false && draft.stairsConstraint === false) {
      mobilityNotes.push('Independent mobility (no stairs hazard)');
    }
    if (mobilityNotes.length > 0) {
      summaryBulletPoints.push(mobilityNotes.join(' · '));
    }

    const coordNotes: string[] = [];
    if (draft.draftMembers && draft.draftMembers.length > 0) {
      const helperList = draft.draftMembers
        .map((m) => `${m.name}${m.relationshipToSenior ? ` (${m.relationshipToSenior})` : ''}`)
        .join(', ');
      coordNotes.push(`Care circle: ${helperList}`);
    } else if (draft.localHelperName) {
      coordNotes.push(`${draft.localHelperName} available locally`);
    } else if (draft.hasLocalHelper === false) {
      coordNotes.push('No local helper known');
    }
    const coordinatorDisplay = draft.coordinatorName || draft.userName;
    const relDisplay = draft.coordinatorRelationship || draft.userRelationship;
    if (coordinatorDisplay) {
      coordNotes.push(`${coordinatorDisplay}${relDisplay ? ` (${relDisplay})` : ''} coordinating`);
    } else if (draft.userIsRemote) {
      coordNotes.push('You coordinating remotely');
    }
    if (coordNotes.length > 0) {
      summaryBulletPoints.push(coordNotes.join(' · '));
    }

    if (draft.familyMembers && draft.familyMembers.length > 0) {
      const inviteStaged = draft.familyMembers.filter((m) => m.invite);
      if (inviteStaged.length > 0) {
        summaryBulletPoints.push(
          `Invitations staged for ${inviteStaged.map((m) => m.name).join(', ')}`
        );
      }
    }

    if (draft.budget && draft.budget > 0) {
      summaryBulletPoints.push(`Budget: $${draft.budget.toLocaleString()}`);
    } else {
      summaryBulletPoints.push('Budget not set (open)');
    }

    if (draft.city || draft.zipCode) {
      summaryBulletPoints.push(`Location: ${draft.city || ''}${draft.zipCode ? ` (${draft.zipCode})` : ''}`.trim());
    }

    return {
      isReady,
      missingRequiredFields,
      nextTargetField,
      summaryBulletPoints,
    };
  }

  /**
   * Deterministic fallback questions when LLM is unavailable or for testing
   */
  public getFallbackQuestion(targetField: IntakeTargetField, seniorName?: string): string {
    const sName = seniorName && seniorName.trim().length > 0 ? seniorName : 'your family member';
    switch (targetField) {
      case 'DISCHARGE_TIMING':
        return `About when do they expect ${sName} to leave the hospital?`;
      case 'TIMING_CLARIFICATION':
        return `Is there a particular day next week you're expecting, or is the timing still flexible?`;
      case 'SAFETY_MOBILITY':
        return `Does ${sName} have any mobility limitations right now — for example stairs, a walker, or needing help getting around?`;
      case 'DESTINATION_HOUSING':
        return `Is the immediate plan for ${sName} to return home, or is temporary rehab or another care setting being considered?`;
      case 'LOCAL_SUPPORT':
        return `Is there anyone nearby who can help ${sName} in person, or are you coordinating mostly from a distance?`;
      case 'COORDINATOR_NAME':
        return `And before we build the plan, what should I call you, and what is your relationship to ${sName}?`;
      case 'COORDINATOR_RELATIONSHIP':
        return `What is your relationship to ${sName}?`;
      case 'LOCATION':
        return `What address or ZIP code should I use when looking for nearby help? You can give me just the ZIP if you'd rather not share the exact address yet.`;
      case 'BUDGET':
        return `Do you already have a budget in mind, or should we leave that open for now?`;
      default:
        return 'Is there anything else I should know about the situation before we build the plan?';
    }
  }
}

export const intakeReadinessService = new IntakeReadinessService();
