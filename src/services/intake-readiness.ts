import { IntakeDraft, IntakeTargetField, IntakeReadinessResult } from '../types';

export class IntakeReadinessService {
  /**
   * Deterministically evaluates if an intake draft contains minimum viable case data
   * to generate a safe, actionable transition plan without forcing artificial defaults.
   */
  public evaluate(draft: IntakeDraft): IntakeReadinessResult {
    const missingRequiredFields: string[] = [];

    const hasSenior = Boolean(draft.seniorName && draft.seniorName.trim().length > 0);
    const hasDischarge = Boolean(
      draft.dischargeDate ||
      (draft.dischargeDays !== undefined && draft.dischargeDays > 0) ||
      (draft.dischargeTimelineDescription && draft.dischargeTimelineDescription.trim().length > 0)
    );
    const hasMobilityOrSafety =
      draft.mobilityConstraint !== undefined ||
      draft.stairsConstraint !== undefined;
    
    const hasLocation = Boolean(
      (draft.zipCode && draft.zipCode.trim().length > 0 && draft.zipCode !== 'UNSET') ||
      (draft.city && draft.city.trim().length > 0)
    );

    const hasCoordinator = Boolean(
      draft.userName ||
      draft.userIsRemote !== undefined ||
      draft.userRelationship ||
      draft.hasLocalHelper !== undefined ||
      draft.localHelperName
    );

    const hasBudgetStatus = draft.budget !== undefined || draft.budgetStatus === 'UNSET';

    if (!hasSenior) missingRequiredFields.push('senior reference or name');
    if (!hasDischarge) missingRequiredFields.push('discharge timing');
    if (!hasMobilityOrSafety) missingRequiredFields.push('mobility and home safety situation');
    if (!hasLocation) missingRequiredFields.push('location or ZIP code');
    if (!hasCoordinator) missingRequiredFields.push('family coordinator role');
    if (!hasBudgetStatus) missingRequiredFields.push('budget preference');

    // Determine the single highest-value question to ask next in priority sequence:
    // Timing → Mobility/Safety → Location → Coordinator/Local Support → Budget
    let nextTargetField: IntakeTargetField = 'NONE';
    if (!hasDischarge) {
      nextTargetField = 'DISCHARGE_TIMING';
    } else if (!hasMobilityOrSafety) {
      nextTargetField = 'SAFETY_MOBILITY';
    } else if (!hasLocation) {
      nextTargetField = 'LOCATION';
    } else if (draft.hasLocalHelper === undefined && !draft.localHelperName) {
      nextTargetField = 'LOCAL_SUPPORT';
    } else if (!hasBudgetStatus) {
      nextTargetField = 'BUDGET';
    } else {
      nextTargetField = 'NONE';
    }

    // Minimum viable threshold: senior, discharge, mobility, location, coordinator, and budget (set or unset)
    const isReady =
      hasSenior &&
      hasDischarge &&
      hasMobilityOrSafety &&
      hasLocation &&
      hasCoordinator &&
      hasBudgetStatus;

    // Build concise, human confirmation bullet points
    const INVALID_NAMES = new Set([
      'fell', 'had', 'is', 'was', 'has', 'went', 'broke', 'needs', 'lives', 'called', 'got', 'suffered'
    ]);
    if (draft.seniorName && INVALID_NAMES.has(draft.seniorName.trim().toLowerCase())) {
      draft.seniorName = 'Mom';
    }

    const summaryBulletPoints: string[] = [];
    const seniorLabel = draft.seniorName || 'Family member';
    summaryBulletPoints.push(
      `${seniorLabel}${draft.ageRange ? `, ${draft.ageRange}` : ''} · Post-hospital transition`
    );

    if (draft.dischargeTimelineDescription) {
      summaryBulletPoints.push(`Discharge ${draft.dischargeTimelineDescription}`);
    } else if (draft.dischargeDays) {
      summaryBulletPoints.push(`Discharge in ~${draft.dischargeDays} days`);
    } else if (draft.dischargeDate) {
      summaryBulletPoints.push(`Discharge target: ${draft.dischargeDate}`);
    }

    const mobilityNotes: string[] = [];
    if (draft.livesAlone) mobilityNotes.push('Lives alone');
    if (draft.mobilityConstraint) mobilityNotes.push('Uses walker / mobility limitations');
    if (draft.stairsConstraint) mobilityNotes.push('Bedroom upstairs / stairs hazard');
    if (mobilityNotes.length > 0) {
      summaryBulletPoints.push(mobilityNotes.join(' · '));
    }

    const coordNotes: string[] = [];
    if (draft.localHelperName) {
      coordNotes.push(`${draft.localHelperName} available locally`);
    } else if (draft.hasLocalHelper === false) {
      coordNotes.push('No local helper known');
    }
    if (draft.userIsRemote) {
      coordNotes.push('You coordinating remotely');
    } else if (draft.userName) {
      coordNotes.push(`${draft.userName} coordinating`);
    }
    if (coordNotes.length > 0) {
      summaryBulletPoints.push(coordNotes.join(' · '));
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
      case 'SAFETY_MOBILITY':
        return `Does ${sName} have any mobility limitations right now — for example stairs, a walker, or needing help getting around?`;
      case 'DESTINATION_HOUSING':
        return `Is the immediate plan for ${sName} to return home, or is temporary rehab or another care setting being considered?`;
      case 'LOCAL_SUPPORT':
        return `Is there anyone nearby who can help ${sName} in person, or are you coordinating mostly from a distance?`;
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
