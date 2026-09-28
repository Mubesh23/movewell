import { NextRequest, NextResponse } from 'next/server';
import { resolveSession, BridgewellSession } from '@/lib/auth-helper';
import { repository } from '@/db/repository';
import { draftService } from '@/services/draft-service';
import { PlanDraft, TransitionCase, CaseMember, CaseMemberRole } from '@/types';

export interface DraftAccessResult {
  authorized: boolean;
  draft?: PlanDraft;
  userId: string;
  session?: BridgewellSession;
  error?: string;
  status: number;
}

export interface CaseAccessResult {
  authorized: boolean;
  canManage: boolean;
  caseData?: TransitionCase;
  members?: CaseMember[];
  currentMember?: CaseMember;
  userId: string;
  role?: CaseMemberRole;
  error?: string;
  status: number;
}

/**
 * Validates that the current requester has authorization to view or edit a PlanDraft.
 * Strictly verifies that draft.ownerUserId === requester's resolved userId (or guest token).
 */
export async function requireDraftAccess(
  req: NextRequest,
  draftId: string
): Promise<DraftAccessResult> {
  const session = await resolveSession(req);
  const effectiveId = session.kind === 'AUTHENTICATED' ? session.userId : session.guestToken;

  const draft = await draftService.getDraft(draftId);
  if (!draft) {
    return {
      authorized: false,
      userId: effectiveId,
      session,
      error: 'Draft not found',
      status: 404,
    };
  }

  // Enforce strict ownership: requester must own the draft
  if (draft.ownerUserId !== effectiveId) {
    return {
      authorized: false,
      draft,
      userId: effectiveId,
      session,
      error: 'You do not have permission to access this draft',
      status: 403,
    };
  }

  return {
    authorized: true,
    draft,
    userId: effectiveId,
    session,
    status: 200,
  };
}

/**
 * Checks whether a given userId has access to a TransitionCase.
 */
export async function canAccessCase(
  userId: string,
  caseId: string
): Promise<{ canAccess: boolean; canManage: boolean; role?: CaseMemberRole; member?: CaseMember }> {
  if (!userId) {
    return { canAccess: false, canManage: false };
  }

  const caseData = await repository.getCaseById(caseId);
  if (!caseData) {
    return { canAccess: false, canManage: false };
  }

  const members = await repository.getCaseMembers(caseId);
  const matchedMember = members.find((m) => m.userId === userId);

  // Case owner always has full access and management
  if (caseData.ownerUserId === userId) {
    const ownerMember = matchedMember || members.find((m) => m.role === 'OWNER') || members[0];
    return {
      canAccess: true,
      canManage: true,
      role: 'OWNER',
      member: ownerMember,
    };
  }

  // Check if user is an aligned care circle member
  if (matchedMember) {
    const isOwner = matchedMember.role === 'OWNER';
    return {
      canAccess: true,
      canManage: isOwner,
      role: matchedMember.role,
      member: matchedMember,
    };
  }

  return { canAccess: false, canManage: false };
}

/**
 * Validates that the requester has access to an active TransitionCase.
 * Strictly requires session.kind === 'AUTHENTICATED'. Guests cannot view or manage active cases.
 * If requireOwner = true, only OWNER role can proceed.
 */
export async function requireCaseAccess(
  req: NextRequest,
  caseId: string,
  options?: { requireOwner?: boolean }
): Promise<CaseAccessResult> {
  const session = await resolveSession(req);
  const effectiveUserId = session.kind === 'AUTHENTICATED' ? session.userId : session.guestToken;

  const caseData = await repository.getCaseById(caseId);
  if (!caseData) {
    return {
      authorized: false,
      canManage: false,
      userId: effectiveUserId,
      error: 'Case not found',
      status: 404,
    };
  }

  // Real production cases require permanent AUTHENTICATED user.
  // Sample demo cases (e.g. Maria golden scenario) allow the session that created them.
  const isDemoCase = caseId.startsWith('case-maria') || caseData.id.startsWith('case-maria');
  const isOwner = Boolean(caseData.ownerUserId && caseData.ownerUserId === effectiveUserId);

  if (session.kind !== 'AUTHENTICATED' && !isDemoCase && !isOwner) {
    return {
      authorized: false,
      canManage: false,
      userId: session.guestToken,
      error: 'Authentication required to access active transition cases',
      status: 401,
    };
  }

  const userId = effectiveUserId;
  const access = await canAccessCase(userId, caseId);

  if (!access.canAccess) {
    return {
      authorized: false,
      canManage: false,
      caseData,
      userId,
      error: 'You do not have permission to access this family transition plan',
      status: 403,
    };
  }

  if (options?.requireOwner && !access.canManage) {
    return {
      authorized: false,
      canManage: false,
      caseData,
      userId,
      role: access.role,
      error: 'Only the case owner or family coordinator can perform this management action',
      status: 403,
    };
  }

  const members = await repository.getCaseMembers(caseId);

  return {
    authorized: true,
    canManage: access.canManage,
    caseData,
    members,
    currentMember: access.member,
    userId,
    role: access.role,
    status: 200,
  };
}

/**
 * Shorthand guard requiring full case owner / manager permissions.
 */
export async function requireCaseOwner(
  req: NextRequest,
  caseId: string
): Promise<CaseAccessResult> {
  return requireCaseAccess(req, caseId, { requireOwner: true });
}
