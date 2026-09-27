import { NextRequest, NextResponse } from 'next/server';
import { planningEngine } from '@/services/planning-engine';
import { TransitionCase, SeniorProfile, CaseMember, formatLocalDateYYYYMMDD, CasePreset } from '@/types';
import { BRAND_NAME } from '@/lib/brand';
import { resolveSession, GUEST_COOKIE_NAME } from '@/lib/auth-helper';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const session = await resolveSession(req);
    const effectiveUserId = session.kind === 'AUTHENTICATED' ? session.userId : session.guestToken;

    // Check if loading Maria's Golden Scenario preset
    if (body.preset === ('MARIA_GOLDEN_SCENARIO' as CasePreset)) {
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
        ownerUserId: effectiveUserId,
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
          userId: effectiveUserId,
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

      const response = NextResponse.json({ success: true, caseId: result.caseData.id });
      if (session.kind === 'GUEST') {
        response.cookies.set(GUEST_COOKIE_NAME, session.guestToken, {
          path: '/',
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 30, // 30 days
        });
      }
      return response;
    }

    const transitionType = body.transitionType || 'POST_HOSPITAL';
    if (transitionType !== 'POST_HOSPITAL') {
      return NextResponse.json(
        { success: false, error: `Unsupported transition type: ${transitionType}. ${BRAND_NAME} currently supports POST_HOSPITAL transitions.` },
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

    let calculatedDischarge = defaultDischarge;
    if (body.dischargeDate) {
      calculatedDischarge = body.dischargeDate;
    } else if (body.dischargeDays && typeof body.dischargeDays === 'number') {
      const d = new Date(nowCustom);
      d.setDate(d.getDate() + body.dischargeDays);
      calculatedDischarge = formatLocalDateYYYYMMDD(d);
    }

    const budgetValue =
      body.budget && !isNaN(Number(body.budget)) && Number(body.budget) > 0
        ? Number(body.budget)
        : undefined;

    const caseData: TransitionCase = {
      id: caseId,
      ownerUserId: effectiveUserId,
      seniorProfileId,
      transitionType,
      urgency: 'PLANNED',
      zipCode: body.zipCode?.trim() || undefined,
      targetDate: body.targetDate || defaultTarget,
      dischargeDate: calculatedDischarge,
      housingStatus: body.housingStatus || 'UNDECIDED',
      destinationStatus: body.destinationStatus || 'UNDECIDED',
      budget: budgetValue,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const profile: SeniorProfile = {
      id: seniorProfileId,
      caseId: caseId,
      name: body.seniorName?.trim() || 'Senior Family Member',
      ageRange: body.ageRange?.trim() || undefined,
      livesAlone: body.livesAlone === true,
      mobilityConstraint: body.mobilityConstraint === true,
      stairsConstraint: body.stairsConstraint === true,
      immediateSafetyConcern: body.immediateSafetyConcern === true,
      homeType: body.homeType?.trim() || undefined,
      ownsHome: body.ownsHome !== false,
    };

    const members: CaseMember[] = [
      {
        id: 'mem-primary-' + Math.random().toString(36).substring(2, 6),
        caseId: caseId,
        userId: effectiveUserId,
        name: body.userName?.trim() || 'Family Coordinator',
        relationship:
          body.userRelationship?.trim() ||
          (body.userIsRemote ? 'Family Member (Remote)' : 'Family Member'),
        city: body.userCity?.trim() || undefined,
        isLocal: body.isLocal !== undefined ? body.isLocal : (body.userIsRemote === true ? false : undefined),
        role: 'OWNER',
      },
    ];

    if (body.localHelperName && body.localHelperName.trim().length > 0) {
      members.push({
        id: 'mem-local-' + Math.random().toString(36).substring(2, 6),
        caseId: caseId,
        name: body.localHelperName.trim(),
        relationship: 'Local Support',
        city: body.localHelperCity?.trim() || undefined,
        isLocal: true,
        role: 'FAMILY',
      });
    }

    const result = await planningEngine.generatePlan(
      caseData,
      profile,
      members
    );

    const response = NextResponse.json({ success: true, caseId: result.caseData.id });
    if (session.kind === 'GUEST') {
      response.cookies.set(GUEST_COOKIE_NAME, session.guestToken, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
    }
    return response;
  } catch (error: any) {
    console.error('Case POST error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
