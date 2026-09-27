import { NextRequest, NextResponse } from 'next/server';
import { planningEngine } from '@/services/planning-engine';
import { TransitionCase, SeniorProfile, CaseMember, formatLocalDateYYYYMMDD } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Check if loading Maria's Golden Scenario preset
    if (body.preset === 'MARIA_GOLDEN_SCENARIO') {
      const randomSuffix = Math.random().toString(36).substring(2, 9);
      const caseId = `case-maria-${randomSuffix}`;
      const seniorProfileId = `profile-maria-${randomSuffix}`;

      const now = new Date();
      const dischargeDate = new Date(now);
      dischargeDate.setDate(dischargeDate.getDate() + 5);
      const dischargeDateStr = formatLocalDateYYYYMMDD(dischargeDate);

      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() + 12);
      const targetDateStr = formatLocalDateYYYYMMDD(targetDate);

      const caseData: TransitionCase = {
        id: caseId,
        seniorProfileId,
        transitionType: 'POST_HOSPITAL',
        urgency: 'URGENT',
        zipCode: '77004', // Houston, TX
        targetDate: targetDateStr,
        dischargeDate: dischargeDateStr,
        housingStatus: 'OWN',
        destinationStatus: 'UNDECIDED',
        budget: 8000,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const profile: SeniorProfile = {
        id: seniorProfileId,
        caseId: caseId,
        name: 'Maria Thompson',
        ageRange: '78',
        livesAlone: true,
        mobilityConstraint: true,
        stairsConstraint: true,
        immediateSafetyConcern: false,
        homeType: 'Two-story house',
        ownsHome: true,
      };

      const members: CaseMember[] = [
        {
          id: `mem-sarah-${randomSuffix}`,
          caseId: caseId,
          name: 'Sarah',
          relationship: 'Daughter',
          city: 'Chicago, IL',
          isLocal: false,
          availability: 'Full time remote coordination',
          role: 'OWNER',
        },
        {
          id: `mem-jennifer-${randomSuffix}`,
          caseId: caseId,
          name: 'Jennifer',
          relationship: 'Sister / Local Support',
          city: 'Houston, TX',
          isLocal: true,
          availability: 'Evenings & weekends local',
          role: 'FAMILY',
        },
      ];

      const result = await planningEngine.generatePlan(
        caseData,
        profile,
        members
      );

      return NextResponse.json({ success: true, caseId: result.caseData.id });
    }

    const transitionType = body.transitionType || 'POST_HOSPITAL';
    if (transitionType !== 'POST_HOSPITAL') {
      return NextResponse.json(
        { success: false, error: `Unsupported transition type: ${transitionType}. MoveWell currently supports POST_HOSPITAL transitions.` },
        { status: 400 }
      );
    }

    const caseId = 'case-' + Math.random().toString(36).substring(2, 9);
    const seniorProfileId = 'prof-' + Math.random().toString(36).substring(2, 9);

    const nowCustom = new Date();
    const dDischarge = new Date(nowCustom);
    dDischarge.setDate(dDischarge.getDate() + 5);
    const defaultDischarge = formatLocalDateYYYYMMDD(dDischarge);

    const dTarget = new Date(nowCustom);
    dTarget.setDate(dTarget.getDate() + 12);
    const defaultTarget = formatLocalDateYYYYMMDD(dTarget);

    const caseData: TransitionCase = {
      id: caseId,
      seniorProfileId,
      transitionType,
      urgency: 'PLANNED',
      zipCode: body.zipCode || '77004',
      targetDate: body.targetDate || defaultTarget,
      dischargeDate: body.dischargeDate || defaultDischarge,
      housingStatus: body.housingStatus || 'OWN',
      destinationStatus: body.destinationStatus || 'UNDECIDED',
      budget: Number(body.budget) || 8000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const profile: SeniorProfile = {
      id: seniorProfileId,
      caseId: caseId,
      name: body.seniorName || 'Maria Thompson',
      ageRange: body.ageRange || '78',
      livesAlone: body.livesAlone !== false,
      mobilityConstraint: body.mobilityConstraint !== false,
      stairsConstraint: body.stairsConstraint !== false,
      immediateSafetyConcern: body.immediateSafetyConcern === true,
      homeType: body.homeType || 'Two-story house',
      ownsHome: body.ownsHome !== false,
    };

    const members: CaseMember[] = [
      {
        id: 'mem-primary-' + Math.random().toString(36).substring(2, 6),
        caseId: caseId,
        name: body.userName || 'Sarah',
        relationship: 'Daughter',
        city: body.userCity || 'Chicago, IL',
        isLocal: false,
        role: 'OWNER',
      },
      {
        id: 'mem-local-' + Math.random().toString(36).substring(2, 6),
        caseId: caseId,
        name: body.localHelperName || 'Jennifer',
        relationship: 'Sister / Local Support',
        city: body.localHelperCity || 'Houston, TX',
        isLocal: true,
        role: 'FAMILY',
      },
    ];

    const result = await planningEngine.generatePlan(
      caseData,
      profile,
      members
    );

    return NextResponse.json({ success: true, caseId: result.caseData.id });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
