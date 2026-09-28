export type TransitionType =
  | 'POST_HOSPITAL'
  | 'PLANNED_DOWNSIZE'
  | 'AGE_IN_PLACE'
  | 'EMERGENCY_DISPLACEMENT'
  | 'LOSS_OF_SPOUSE';

export function formatLocalDateYYYYMMDD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export type Urgency = 'PLANNED' | 'URGENT' | 'IMMEDIATE';

export type TaskStatus =
  | 'NOT_STARTED'
  | 'READY'
  | 'BLOCKED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'SKIPPED';

export type TaskAction = 'COMPLETE' | 'REOPEN' | 'ASSIGN' | 'SKIP' | 'SET_DUE_DATE';

export type TaskPhase =
  | 'RIGHT_NOW'
  | 'THIS_WEEK'
  | 'NEXT'
  | 'MOVE_WEEK'
  | 'AFTER_MOVE';

export type TaskTemplateId =
  | 'confirm-discharge-destination'
  | 'assess-home-accessibility'
  | 'decide-housing-duration'
  | 'inventory-belongings'
  | 'evaluate-rehab-facilities'
  | 'schedule-senior-mover'
  | 'arrange-transportation'
  | 'schedule-donation-pickup';

export type CaseMemberRole =
  | 'OWNER'
  | 'FAMILY'
  | 'HELPER'
  | 'PROFESSIONAL';

export type MemberRelationship =
  | 'Daughter'
  | 'Son'
  | 'Sister'
  | 'Brother'
  | 'Spouse'
  | 'Sister / Local Support'
  | 'Helper / Collaborator'
  | 'Professional Coordinator'
  | string;

export type MemberAvailability =
  | 'FULL_TIME_REMOTE'
  | 'LOCAL_EVENINGS_WEEKENDS'
  | 'FULL_TIME_LOCAL'
  | 'AS_NEEDED'
  | string;

export type HousingStatus = 'OWN' | 'RENT' | 'UNDECIDED';
export type DestinationStatus = 'KNOWN' | 'UNKNOWN' | 'REHAB_FIRST' | 'RETURN_HOME' | 'UNDECIDED';

export type HomeType =
  | 'TWO_STORY'
  | 'SINGLE_STORY'
  | 'APARTMENT_CONDO'
  | 'ASSISTED_LIVING'
  | 'OTHER';

export type ResourceCategory =
  | 'moving'
  | 'senior_move_management'
  | 'donation'
  | 'junk_removal'
  | 'home_modification'
  | 'storage'
  | 'transportation';

export type ResourceCostType =
  | 'free_public_service'
  | 'donation_pickup'
  | 'grant_funded_or_sliding_scale'
  | 'sliding_scale'
  | 'hourly_or_quote'
  | 'public_transit_fare'
  | 'custom_quote'
  | 'free_legal_aid';

export type CasePreset = 'MARIA_GOLDEN_SCENARIO';

export type AIToolName =
  | 'get_plan'
  | 'update_case_context'
  | 'assign_task'
  | 'complete_task'
  | 'find_resources'
  | 'confirm_discharge_destination'
  | 'explain_cost_estimate';

export type DocumentType =
  | 'MOVING_QUOTE'
  | 'CONTRACTOR_ESTIMATE'
  | 'REHAB_PAPERWORK'
  | 'SENIOR_LIVING_BROCHURE'
  | 'LEASE'
  | 'DISCHARGE_PAPERWORK'
  | 'RECEIPT'
  | 'OTHER';

export type CostItemSource =
  | 'ESTIMATE'
  | 'QUOTE'
  | 'SELECTED_VENDOR'
  | 'ACTUAL';

export type CostLifecycleStage =
  | 'ESTIMATED'
  | 'QUOTED'
  | 'COMMITTED'
  | 'PAID';

export interface CostProvenance {
  sourceType: 'PLANNING_RANGE' | 'VENDOR_QUOTE' | 'USER_ADJUSTED';
  updatedAt: string;
  confidence: 'High' | 'Medium' | 'Low';
  sources?: string[];
  disclaimer?: string;
  evidenceSummary?: EstimateEvidenceSummary;
}

export type TransportationNeed =
  | 'STANDARD'
  | 'ASSISTED'
  | 'WHEELCHAIR'
  | 'MEDICAL_TRANSPORT'
  | 'UNKNOWN';

export type CaseLocationType =
  | 'HOME'
  | 'HOSPITAL'
  | 'REHAB'
  | 'DESTINATION'
  | 'STORAGE'
  | 'OTHER';

export type CostCategory =
  | 'moving'
  | 'packing'
  | 'home_modification'
  | 'storage'
  | 'legal_admin';

export type CostUnit = 'flat' | 'hourly' | 'monthly' | 'per_day';

export interface TransitionCase {
  id: string;
  ownerUserId?: string;
  seniorProfileId?: string;
  transitionType: TransitionType;
  urgency: Urgency;
  zipCode?: string;
  targetDate?: string; // ISO date string YYYY-MM-DD
  dischargeDate?: string; // ISO date string YYYY-MM-DD for post-hospital
  housingStatus?: HousingStatus;
  destinationStatus?: DestinationStatus;
  budget?: number;
  createdAt: string;
  updatedAt: string;
}

export interface StagedInvitation {
  channel: 'EMAIL';
  email?: string;
  phone?: string;
  status: 'DRAFT' | 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';
}

export interface IntakeFamilyMember {
  id: string;
  name: string;
  relationship?: string;
  city?: string;
  isLocal: boolean;
  availability?: string;
  role?: CaseMemberRole;
  email?: string;
  phone?: string;
  invite?: {
    channel: 'EMAIL';
    contact: string;
  };
}

export interface DraftMember {
  id: string;
  name: string;
  relationshipToSenior?: string;
  role?: CaseMemberRole;
  city?: string;
  isLocal?: boolean;
  availability?: string;
  inviteRequested?: boolean;
  invitationRequested?: boolean;
  inviteChannel?: 'EMAIL';
  email?: string;
  phone?: string;
}

export interface PlanChangeItem {
  id: string;
  type:
    | 'TASK_REASSIGNED'
    | 'TASK_DUE_DATE'
    | 'TASK_STATUS'
    | 'MEMBER_ADDED'
    | 'BUDGET_UPDATED'
    | 'NOTE_ADDED'
    | 'TASK_MODIFIED';
  description: string;
  targetId?: string;
  oldValue?: string;
  newValue?: string;
}

export interface PlanChangeSet {
  id: string;
  summary: string;
  changes: PlanChangeItem[];
  appliedAt: string;
  appliedBy: string;
}

export interface IntakeDraft {
  seniorName?: string;
  seniorRelationship?: string;
  ageRange?: string;
  transitionType?: TransitionType;
  dischargeDate?: string;
  dischargeDays?: number;
  dischargeTimelineDescription?: string;
  dischargeTime?: string;
  dischargePrecision?: 'EXACT' | 'DAY' | 'RANGE' | 'APPROXIMATE' | 'UNKNOWN';
  timingClarificationNeeded?: boolean;
  timePreferenceChecked?: boolean;
  livesAlone?: boolean;
  mobilityConstraint?: boolean;
  stairsConstraint?: boolean;
  homeType?: string;
  city?: string;
  zipCode?: string;
  userName?: string;
  userRelationship?: string;
  coordinatorName?: string;
  coordinatorRelationship?: string;
  userCity?: string;
  userIsRemote?: boolean;
  localHelperName?: string;
  localHelperCity?: string;
  hasLocalHelper?: boolean;
  careCircleAddressed?: boolean;
  draftMembers?: DraftMember[];
  familyMembers?: IntakeFamilyMember[];
  budget?: number;
  budgetStatus?: 'SET' | 'UNSET';
  destinationStatus?: DestinationStatus;
  temporalValue?: any;
}

export type IntakeTargetField =
  | 'DISCHARGE_TIMING'
  | 'TIMING_CLARIFICATION'
  | 'SAFETY_MOBILITY'
  | 'DESTINATION_HOUSING'
  | 'LOCAL_SUPPORT'
  | 'COORDINATOR_NAME'
  | 'COORDINATOR_RELATIONSHIP'
  | 'LOCATION'
  | 'BUDGET'
  | 'NONE';

export interface IntakeReadinessResult {
  isReady: boolean;
  missingRequiredFields: string[];
  nextTargetField: IntakeTargetField;
  summaryBulletPoints: string[];
}

export interface SeniorProfile {
  id: string;
  caseId: string;
  name: string;
  ageRange?: string;
  livesAlone?: boolean;
  mobilityConstraint: boolean;
  stairsConstraint: boolean;
  immediateSafetyConcern: boolean;
  homeType?: HomeType | string;
  ownsHome: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CaseMember {
  id: string;
  caseId: string;
  userId?: string;
  name: string;
  relationship?: MemberRelationship;
  city?: string;
  isLocal?: boolean;
  availability?: MemberAvailability;
  role: CaseMemberRole;
  email?: string;
  phone?: string;
  invitationStatus?: 'NONE' | 'DRAFT' | 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';
  invitationChannel?: 'EMAIL';
  createdAt?: string;
  updatedAt?: string;
}

export interface TransitionTask {
  id: string;
  caseId: string;
  templateId?: TaskTemplateId | string;
  title: string;
  description?: string;
  whyItMatters?: string;
  completionNotes?: string;
  status: TaskStatus;
  priority: number;
  phase: TaskPhase;
  dueDate?: string; // YYYY-MM-DD
  assigneeId?: string;
  assignee?: CaseMember;
  minEstimatedCost: number;
  maxEstimatedCost: number;
  dependsOnTaskIds?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TaskDependency {
  taskId: string;
  dependsOnTaskId: string;
}

export interface CaseInvitation {
  id: string;
  caseId: string;
  memberId: string;
  email: string;
  tokenHash: string;
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED';
  expiresAt: string;
  createdAt: string;
  acceptedAt?: string;
}

export type CaseEventType =
  | 'CASE_CREATED'
  | 'PLAN_GENERATED'
  | 'TASK_ASSIGNED'
  | 'TASK_COMPLETED'
  | 'TASK_REOPENED'
  | 'BUDGET_UPDATED'
  | 'TARGET_DATE_CHANGED'
  | 'DISCHARGE_DATE_CHANGED'
  | 'LOCATION_CHANGED'
  | 'PLAN_REGENERATED'
  | 'CASE_MEMBER_ADDED'
  | 'CASE_MEMBER_INVITED'
  | 'CASE_MEMBER_ACCEPTED'
  | 'CASE_MEMBER_REMOVED'
  | 'DESTINATION_CONFIRMED'
  | 'QUOTE_EXTRACTED'
  | 'QUOTE_APPLIED';

export interface CaseEvent {
  id: string;
  caseId: string;
  type: CaseEventType;
  actorType: 'USER' | 'AI' | 'SYSTEM';
  actorId?: string;
  payload: Record<string, any>;
  createdAt: string;
}

export interface CostModel {
  id: string;
  category: CostCategory | string;
  name: string;
  minCost: number;
  maxCost: number;
  unit: CostUnit | string;
  conditions?: Record<string, any>;
}

export interface Organization {
  id: string;
  name: string;
  description: string;
  website: string;
}

export interface ServiceResource {
  id: string;
  organizationId: string;
  name: string;
  category: ResourceCategory | string;
  description: string;
  costType: ResourceCostType | string;
  organizationName?: string;
  website?: string;
  location?: Location;
  verification?: ResourceVerification;
}

export interface Location {
  id: string;
  organizationId: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
}

export interface ResourceVerification {
  id: string;
  serviceId: string;
  verificationStatus: string;
  verificationSource: string;
  lastVerifiedAt: string;
}

export interface CostItem {
  id: string;
  caseId: string;
  category: CostCategory | string;
  description: string;
  source: CostItemSource;
  stage?: CostLifecycleStage;
  provenance?: CostProvenance;
  amount?: number;
  minAmount?: number;
  maxAmount?: number;
  providerName?: string;
  documentName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CostSummary {
  minTotal: number;
  maxTotal: number;
  userBudget?: number;
  budgetGap: number;
  disclaimer: string;
  confirmedQuotesTotal?: number;
  quotesTotal?: number;
  hasQuotes?: boolean;
}

export interface CaseOverview {
  caseData: TransitionCase;
  seniorProfile: SeniorProfile;
  members: CaseMember[];
  tasks: TransitionTask[];
  events: CaseEvent[];
  costItems?: CostItem[];
  costSummary: CostSummary;
  progressPercent: number;
  daysUntilDischarge?: number;
  urgentTask?: TransitionTask;
  transitionPulse?: TransitionPulseMetrics;
  latestChange?: PlanChangeRecord;
}

// --- Auth & User Profile ---
export interface UserProfile {
  id: string;
  email?: string;
  displayName?: string;
  isAnonymous?: boolean;
}

// --- Case Locations ---
export interface CaseLocation {
  id: string;
  planDraftId?: string;
  caseId?: string;
  type: CaseLocationType;
  label: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  latitude?: number;
  longitude?: number;
  externalPlaceId?: string;
  createdAt?: string;
}

// --- Intake Draft Record ---
export interface IntakeDraftRecord {
  id: string;
  ownerUserId: string;
  data: IntakeDraft;
  status: 'IN_PROGRESS' | 'READY_FOR_PLAN';
  createdAt: string;
  updatedAt: string;
}

// --- Plan Draft Models ---
export interface ProposedTask {
  id: string;
  templateId?: string;
  title: string;
  description?: string;
  whyItMatters?: string;
  phase: TaskPhase;
  priority: number;
  dueDate?: string; // YYYY-MM-DD
  assigneeName?: string;
  minEstimatedCost: number;
  maxEstimatedCost: number;
  category?: string;
  applicable: boolean;
  notes?: string;
}

export interface ProposedMember {
  id: string;
  name: string;
  relationship?: string;
  city?: string;
  isLocal?: boolean;
  role: CaseMemberRole;
  availability?: string;
  email?: string;
  phone?: string;
  invitation?: StagedInvitation;
}

export interface ProposedResourceNeed {
  category: ResourceCategory | string;
  label: string;
  countNearby?: number;
  searchTerms: string[];
}

export interface PlanDraft {
  id: string;
  ownerUserId: string;
  intakeDraftId?: string;
  seniorProfile: {
    name: string;
    ageRange?: string;
    livesAlone?: boolean;
    mobilityConstraint: boolean;
    stairsConstraint: boolean;
    homeType?: string;
  };
  dischargeTiming?: {
    date?: string;
    days?: number;
    time?: string;
    timezone?: string;
    description?: string;
    precision?: 'EXACT' | 'DAY' | 'RANGE' | 'APPROXIMATE' | 'UNKNOWN';
  };
  proposedTasks: ProposedTask[];
  proposedMembers: ProposedMember[];
  proposedBudget?: number;
  budgetStatus: 'SET' | 'UNSET';
  proposedLocations: CaseLocation[];
  proposedResourceNeeds: ProposedResourceNeed[];
  status: 'DRAFT' | 'READY' | 'ACTIVATED';
  caseId?: string; // set once activated
  createdAt: string;
  updatedAt: string;
}

// --- Resource Search Abstraction & Provenance ---
export type ResourceTrustLabel =
  | 'Public agency'
  | 'Nonprofit'
  | 'BridgeWell-reviewed'
  | 'Bridgewell-reviewed'
  | 'Directory listing'
  | 'Nearby option'
  | 'External listing';

export interface ResourceSearchInput {
  category: ResourceCategory | string;
  zipCode?: string;
  city?: string;
  state?: string;
  limit?: number;
}

export interface ResourceCandidate {
  id: string;
  name: string;
  category: string;
  description: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  distanceMiles?: number;
  trustLabel: ResourceTrustLabel;
  costType?: string;
  website?: string;
}

export interface ResourceSearchProvider {
  searchNearby(input: ResourceSearchInput): Promise<ResourceCandidate[]>;
}

export interface PlanChangeDiff {
  label: string;
  before: string;
  after: string;
}

export interface PlanChangeRecord {
  id: string;
  caseId: string;
  timestamp: string;
  title: string;
  summaryBullets: string[];
  diffs: PlanChangeDiff[];
}

export interface TransitionPulseMetrics {
  criticalDecisions: {
    resolved: number;
    total: number;
    label: string;
  };
  thisWeekTasksRemaining: number;
  blockedCount: number;
  unassignedCount: number;
  budgetAssessment: 'Within planning range' | 'Exceeds budget' | 'Budget open';
  budgetAssessmentDetail: string;
}

// --- External Evidence Registry Types ---
export type ExtractionMethod =
  | 'MANUAL_CRAWL'
  | 'API'
  | 'PUBLIC_RATE_SHEET'
  | 'INDUSTRY_BENCHMARK'
  | 'PUBLIC_AGENCY_TARIFF';

export interface EvidenceSource {
  id: string;
  title: string;
  publisher: string;
  url: string;
  geography: string;
  publishedDate?: string;
  lastCheckedAt: string;
  extractionMethod: ExtractionMethod;
}

export interface CostEvidenceObservation {
  id: string;
  sourceId: string;
  category: string;
  amountMin: number;
  amountMax: number;
  unit: string;
  geography: string;
  observedDate: string;
  notes?: string;
}

export interface EstimateEvidenceSummary {
  category: string;
  minAmount: number;
  maxAmount: number;
  unit: string;
  geography: string;
  observationCount: number;
  newestObservedDate: string;
  confidence: 'High' | 'Medium' | 'Low';
  sources: EvidenceSource[];
  observations: CostEvidenceObservation[];
  rationale: string;
}

