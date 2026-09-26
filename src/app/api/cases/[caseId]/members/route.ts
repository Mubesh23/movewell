import { NextRequest, NextResponse } from 'next/server';
import { caseService } from '@/services/case-service';

export async function POST(
  req: NextRequest,
  { params }: { params: { caseId: string } }
) {
  try {
    const body = await req.json();
    const { name, role, relationship, city, isLocal, availability } = body;

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
    });

    return NextResponse.json({ success: true, data: member }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
