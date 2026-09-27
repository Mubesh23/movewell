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

export type TaskPhase =
  | 'RIGHT_NOW'
  | 'THIS_WEEK'
  | 'NEXT'
  | 'MOVE_WEEK'
  | 'AFTER_MOVE';

export type CaseMemberRole =
  | 'OWNER'
  | 'FAMILY'
  | 'HELPER'
  | 'PROFESSIONAL';

export type HousingStatus = 'OWN' | 'RENT' | 'UNDECIDED';
export type DestinationStatus = 'KNOWN' | 'UNKNOWN' | 'REHAB_FIRST' | 'RETURN_HOME' | 'UNDECIDED';
export type HomeType =
  | 'TWO_STORY'
  | 'SINGLE_STORY'
  | 'APARTMENT_CONDO'
  | 'ASSISTED_LIVING'
  | 'OTHER';

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
  homeType?: string;
  ownsHome: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CaseMember {
  id: string;
  caseId: string;
  name: string;
  relationship?: string;
  city?: string;
  isLocal: boolean;
  availability?: string;
  role: CaseMemberRole;
  createdAt?: string;
  updatedAt?: string;
}

export interface TransitionTask {
  id: string;
  caseId: string;
  templateId?: string;
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
  | 'CASE_MEMBER_REMOVED';

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
  category: string;
  name: string;
  minCost: number;
  maxCost: number;
  unit: string;
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
  category: string; // moving, senior_move_management, donation, junk_removal, home_modification, storage
  description: string;
  costType: string;
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
  verificationStatus: string; // e.g. "Verified listing"
  verificationSource: string;
  lastVerifiedAt: string;
}

export interface CaseOverview {
  caseData: TransitionCase;
  seniorProfile: SeniorProfile;
  members: CaseMember[];
  tasks: TransitionTask[];
  events: CaseEvent[];
  costSummary: {
    minTotal: number;
    maxTotal: number;
    userBudget: number;
    budgetGap: number; // positive means over budget, negative or zero means under/within
    disclaimer: string;
  };
  progressPercent: number;
  daysUntilDischarge?: number;
  urgentTask?: TransitionTask;
}
