import { NextRequest, NextResponse } from 'next/server';
import { repository } from '@/db/repository';
import { emailService } from '@/services/email-service';
import { eventService } from '@/services/event-service';

export async function POST(
  req: NextRequest,
  { params }: { params: { caseId: string; memberId: string } }
) {
  try {
    const { caseId, memberId } = params;

    const members = await repository.getCaseMembers(caseId);
    const member = members.find((m) => m.id === memberId);
    if (!member) {
      return NextResponse.json({ success: false, error: 'Member not found' }, { status: 404 });
    }

    if (!member.email) {
      return NextResponse.json({ success: false, error: 'Member does not have an email address' }, { status: 400 });
    }

    const senior = await repository.getSeniorProfileByCaseId(caseId);
    const owner = members.find((m) => m.role === 'OWNER') || { name: 'Family Coordinator' };

    await emailService.sendCareCircleInvite({
      toEmail: member.email,
      recipientName: member.name,
      inviterName: owner.name,
      seniorName: senior?.name || 'your loved one',
      caseId,
      role: member.role,
      relationship: member.relationship,
    });

    member.invitationStatus = 'PENDING';
    member.invitationChannel = 'EMAIL';
    member.updatedAt = new Date().toISOString();
    await repository.saveCaseMember(member);

    await eventService.recordEvent(caseId, 'CASE_MEMBER_INVITED', {
      memberId: member.id,
      name: member.name,
      email: member.email,
      channel: 'EMAIL',
      resent: true,
    });

    return NextResponse.json({ success: true, message: `Invite resent to ${member.email}` });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
