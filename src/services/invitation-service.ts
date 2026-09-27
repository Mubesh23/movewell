import crypto from 'crypto';
import { repository } from '@/db/repository';
import { emailService } from './email-service';
import { eventService } from './event-service';
import { CaseInvitation, CaseMember, TransitionCase, SeniorProfile } from '@/types';

export class InvitationService {
  /**
   * Generates a secure, high-entropy single-use invitation token,
   * stores only the SHA-256 hash in the database, and dispatches the invite email.
   */
  public async createAndSendInvitation(params: {
    caseId: string;
    memberId: string;
    email: string;
    recipientName: string;
    inviterName: string;
    seniorName: string;
    role: CaseMember['role'];
    relationship?: string;
  }): Promise<{ invitation: CaseInvitation; rawToken: string; inviteUrl: string }> {
    const { caseId, memberId, email, recipientName, inviterName, seniorName, role, relationship } = params;

    // 1. Invalidate any existing pending invitations for this member
    const existing = await repository.getInvitationsByMemberId(memberId);
    for (const inv of existing) {
      if (inv.status === 'PENDING') {
        inv.status = 'REVOKED';
        await repository.saveCaseInvitation(inv);
      }
    }

    // 2. Generate 32-byte cryptographic token and SHA-256 hash
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    // 3. Expiration: 7 days
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const invitation: CaseInvitation = {
      id: 'inv-' + crypto.randomBytes(8).toString('hex'),
      caseId,
      memberId,
      email,
      tokenHash,
      status: 'PENDING',
      expiresAt,
      createdAt: new Date().toISOString(),
    };

    await repository.saveCaseInvitation(invitation);

    // 4. Construct invitation URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000';
    const inviteUrl = `${baseUrl}/invite/${rawToken}`;

    // 5. Send secure transactional email
    await emailService.sendCareCircleInvite({
      toEmail: email,
      recipientName,
      inviterName,
      seniorName,
      caseId,
      role,
      relationship,
      inviteUrl,
    });

    return { invitation, rawToken, inviteUrl };
  }

  /**
   * Validates an invitation token without mutating state.
   */
  public async validateInvitation(rawToken: string): Promise<{
    valid: boolean;
    error?: string;
    invitation?: CaseInvitation;
    caseData?: TransitionCase;
    member?: CaseMember;
    senior?: SeniorProfile | null;
  }> {
    if (!rawToken || rawToken.trim().length === 0) {
      return { valid: false, error: 'Invitation token is missing' };
    }

    const tokenHash = crypto.createHash('sha256').update(rawToken.trim()).digest('hex');
    const invitation = await repository.getInvitationByTokenHash(tokenHash);

    if (!invitation) {
      return { valid: false, error: 'Invalid or unknown invitation token' };
    }

    if (invitation.status === 'ACCEPTED') {
      return { valid: false, error: 'This invitation has already been accepted' };
    }

    if (invitation.status === 'REVOKED') {
      return { valid: false, error: 'This invitation has been revoked or replaced by a newer invitation' };
    }

    if (invitation.status === 'EXPIRED' || new Date(invitation.expiresAt) <= new Date()) {
      return { valid: false, error: 'This invitation has expired' };
    }

    const caseData = await repository.getCaseById(invitation.caseId);
    if (!caseData) {
      return { valid: false, error: 'Transition case no longer exists' };
    }

    const members = await repository.getCaseMembers(invitation.caseId);
    const member = members.find((m) => m.id === invitation.memberId);
    if (!member) {
      return { valid: false, error: 'Associated care circle member record not found' };
    }

    const senior = await repository.getSeniorProfileByCaseId(invitation.caseId);

    return {
      valid: true,
      invitation,
      caseData,
      member,
      senior,
    };
  }

  /**
   * Accepts the invitation, links the authenticated userId to the CaseMember record,
   * updates the member invitation status to ACCEPTED, marks the token as used,
   * and records a CASE_MEMBER_ACCEPTED event.
   */
  public async acceptInvitation(
    rawToken: string,
    authenticatedUserId: string
  ): Promise<{ success: boolean; caseId: string; member: CaseMember }> {
    const validation = await this.validateInvitation(rawToken);
    if (!validation.valid || !validation.invitation || !validation.member) {
      throw new Error(validation.error || 'Cannot accept invalid invitation');
    }

    const { invitation, member, caseData } = validation;

    // 1. Link CaseMember to authenticated user
    member.userId = authenticatedUserId;
    member.invitationStatus = 'ACCEPTED';
    member.updatedAt = new Date().toISOString();
    await repository.saveCaseMember(member);

    // 2. Mark invitation record as ACCEPTED
    invitation.status = 'ACCEPTED';
    invitation.acceptedAt = new Date().toISOString();
    await repository.saveCaseInvitation(invitation);

    // 3. Record CASE_MEMBER_ACCEPTED event
    await eventService.recordEvent(
      invitation.caseId,
      'CASE_MEMBER_ACCEPTED',
      {
        memberId: member.id,
        name: member.name,
        email: member.email,
        role: member.role,
      },
      'USER',
      authenticatedUserId
    );

    return {
      success: true,
      caseId: invitation.caseId,
      member,
    };
  }
}

export const invitationService = new InvitationService();
