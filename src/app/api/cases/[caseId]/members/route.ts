import { NextRequest, NextResponse } from 'next/server';
import { caseService } from '@/services/case-service';
import { requireCaseOwner } from '@/lib/auth-guards';

export async function POST(
  req: NextRequest,
  { params }: { params: { caseId: string } }
) {
  try {
    const access = await requireCaseOwner(req, params.caseId);
    if (!access.authorized) {
      return NextResponse.json(
        { success: false, error: access.error || 'Access denied' },
        { status: access.status }
      );
    }

    const body = await req.json();
    const { name, role, relationship, city, isLocal, availability, email } = body;

    if (!name || !role) {
      return NextResponse.json(
        { success: false, error: 'Name and role are required' },
        { status: 400 }
      );
    }

    const member = await caseService.addMember(params.caseId, {
      name,
      role,
      relationship,
      city,
      isLocal: isLocal ?? true,
      availability,
      email,
    });

    return NextResponse.json(
      { success: true, data: member, invitation: (member as any).invitation },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
