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

export type TaskAction = 'COMPLETE' | 'REOPEN' | 'ASSIGN' | 'SKIP';

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
  | 'find_resources';

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
  seniorProfileId?: string;
  transitionType: TransitionType;
  urgency: Urgency;
  zipCode: string;
  targetDate?: string; // ISO date string YYYY-MM-DD
  dischargeDate?: string; // ISO date string YYYY-MM-DD for post-hospital
  housingStatus?: HousingStatus;
  destinationStatus?: DestinationStatus;
  budget: number;
  createdAt: string;
  updatedAt: string;
}

export interface SeniorProfile {
  id: string;
  caseId: string;
  name: string;
  ageRange?: string;
  livesAlone: boolean;
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
  name: string;
  relationship?: MemberRelationship;
  city?: string;
  isLocal: boolean;
  availability?: MemberAvailability;
  role: CaseMemberRole;
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

export type CaseEventType =
  | 'CASE_CREATED'
  | 'PLAN_GENERATED'
  | 'TASK_ASSIGNED'
  | 'TASK_COMPLETED'
  | 'TASK_REOPENED'
  | 'BUDGET_UPDATED'
  | 'TARGET_DATE_CHANGED'
  | 'PLAN_REGENERATED'
  | 'CASE_MEMBER_ADDED'
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
  amount?: number;
  minAmount?: number;
  maxAmount?: number;
  providerName?: string;
  documentName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CaseOverview {
  caseData: TransitionCase;
  seniorProfile: SeniorProfile;
  members: CaseMember[];
  tasks: TransitionTask[];
  events: CaseEvent[];
  costItems?: CostItem[];
  costSummary: {
    minTotal: number;
    maxTotal: number;
    userBudget: number;
    budgetGap: number;
    disclaimer: string;
    confirmedQuotesTotal?: number;
  };
  progressPercent: number;
  daysUntilDischarge?: number;
  urgentTask?: TransitionTask;
}
