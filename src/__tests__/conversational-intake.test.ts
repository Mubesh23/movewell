import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as intakePost } from '../app/api/ai/intake/route';
import { POST as casesPost } from '../app/api/cases/route';
import { intakeReadinessService } from '../services/intake-readiness';
import { draftService } from '../services/draft-service';
import { IntakeDraft } from '../types';

describe('Conversational Intake State Machine & Deterministic Readiness', () => {
  describe('IntakeReadinessService', () => {
    it('evaluates an empty draft as not ready and asks for discharge timing if senior is noted', () => {
      const draft: IntakeDraft = { seniorName: 'Maria' };
      const res = intakeReadinessService.evaluate(draft);

      expect(res.isReady).toBe(false);
      expect(res.nextTargetField).toBe('DISCHARGE_TIMING');
      expect(res.missingRequiredFields).toContain('discharge timing');
    });

    it('prioritizes safety and mobility when discharge timing is provided', () => {
      const draft: IntakeDraft = {
        seniorName: 'Maria',
        dischargeTimelineDescription: 'Thursday',
      };
      const res = intakeReadinessService.evaluate(draft);

      expect(res.isReady).toBe(false);
      expect(res.nextTargetField).toBe('SAFETY_MOBILITY');
      expect(res.missingRequiredFields).toContain('mobility and home safety situation');
    });

    it('prioritizes location when mobility is provided', () => {
      const draft: IntakeDraft = {
        seniorName: 'Maria',
        dischargeTimelineDescription: 'Thursday',
        mobilityConstraint: true,
        stairsConstraint: true,
        livesAlone: true,
      };
      const res = intakeReadinessService.evaluate(draft);

      expect(res.isReady).toBe(false);
      expect(res.nextTargetField).toBe('LOCATION');
      expect(res.missingRequiredFields).toContain('location or ZIP code');
    });

    it('prioritizes local support when location is provided', () => {
      const draft: IntakeDraft = {
        seniorName: 'Maria',
        dischargeTimelineDescription: 'Thursday',
        mobilityConstraint: true,
        stairsConstraint: true,
        livesAlone: true,
        zipCode: '77004',
      };
      const res = intakeReadinessService.evaluate(draft);

      expect(res.isReady).toBe(false);
      expect(res.nextTargetField).toBe('LOCAL_SUPPORT');
      expect(res.missingRequiredFields).toContain('family coordinator role');
    });

    it('prioritizes budget when family coordination and location are noted', () => {
      const draft: IntakeDraft = {
        seniorName: 'Maria',
        dischargeTimelineDescription: 'Thursday',
        mobilityConstraint: true,
        stairsConstraint: true,
        livesAlone: true,
        zipCode: '77004',
        hasLocalHelper: true,
        localHelperName: 'Jennifer',
        userIsRemote: true,
      };
      const res = intakeReadinessService.evaluate(draft);

      expect(res.isReady).toBe(false);
      expect(res.nextTargetField).toBe('BUDGET');
    });

    it('marks draft ready when budget is explicitly unset (open) and location is provided', () => {
      const draft: IntakeDraft = {
        seniorName: 'Maria',
        dischargeTimelineDescription: 'Thursday',
        dischargeDays: 4,
        mobilityConstraint: true,
        stairsConstraint: true,
        livesAlone: true,
        zipCode: '77004',
        hasLocalHelper: true,
        localHelperName: 'Jennifer',
        userIsRemote: true,
        budgetStatus: 'UNSET',
      };
      const res = intakeReadinessService.evaluate(draft);

      expect(res.isReady).toBe(true);
      expect(res.nextTargetField).toBe('NONE');
      expect(res.summaryBulletPoints.some((b) => b.includes('Budget not set'))).toBe(true);
      expect(res.summaryBulletPoints.some((b) => b.includes('Thursday'))).toBe(true);
      expect(res.summaryBulletPoints.some((b) => b.includes('Jennifer available locally'))).toBe(true);
      expect(res.summaryBulletPoints.some((b) => b.includes('77004'))).toBe(true);
    });
  });

  describe('Multi-turn Conversational Intake API', () => {
    it('accumulates facts across conversation turns', async () => {
      // Turn 1: User describes initial situation
      const t1Req = new NextRequest('http://localhost:3000/api/ai/intake', {
        method: 'POST',
        body: JSON.stringify({
          message: "My mom fell and she's in the hospital. She lives alone and I'm in another state.",
          currentDraft: {},
        }),
      });
      const t1Res = await intakePost(t1Req);
      const t1Json = await t1Res.json();

      expect(t1Res.status).toBe(200);
      expect(t1Json.success).toBe(true);
      expect(t1Json.draft.seniorName).toBe('Mom');
      expect(t1Json.draft.seniorName).not.toBe('fell');
      expect(t1Json.draft.livesAlone).toBe(true);
      expect(t1Json.draft.userIsRemote).toBe(true);
      expect(t1Json.isReady).toBe(false);
      expect(t1Json.nextTargetField).toBe('DISCHARGE_TIMING');

      // Turn 2: User answers discharge timing
      const t2Req = new NextRequest('http://localhost:3000/api/ai/intake', {
        method: 'POST',
        body: JSON.stringify({
          message: 'Probably Thursday.',
          currentDraft: t1Json.draft,
        }),
      });
      const t2Res = await intakePost(t2Req);
      const t2Json = await t2Res.json();

      expect(t2Json.draft.dischargeTimelineDescription).toBe('Thursday');
      expect(t2Json.nextTargetField).toBe('SAFETY_MOBILITY');

      // Turn 3: User answers mobility
      const t3Req = new NextRequest('http://localhost:3000/api/ai/intake', {
        method: 'POST',
        body: JSON.stringify({
          message: 'She uses a walker and her bedroom is upstairs.',
          currentDraft: t2Json.draft,
        }),
      });
      const t3Res = await intakePost(t3Req);
      const t3Json = await t3Res.json();

      expect(t3Json.draft.mobilityConstraint).toBe(true);
      expect(t3Json.draft.stairsConstraint).toBe(true);
      expect(t3Json.nextTargetField).toBe('LOCATION');

      // Turn 4: User answers location
      const t4Req = new NextRequest('http://localhost:3000/api/ai/intake', {
        method: 'POST',
        body: JSON.stringify({
          message: 'Her house is in 77004.',
          currentDraft: t3Json.draft,
        }),
      });
      const t4Res = await intakePost(t4Req);
      const t4Json = await t4Res.json();

      expect(t4Json.draft.zipCode).toBe('77004');
      expect(t4Json.nextTargetField).toBe('LOCAL_SUPPORT');

      // Turn 5: User answers local helper
      const t5Req = new NextRequest('http://localhost:3000/api/ai/intake', {
        method: 'POST',
        body: JSON.stringify({
          message: 'My sister Jennifer lives nearby.',
          currentDraft: t4Json.draft,
        }),
      });
      const t5Res = await intakePost(t5Req);
      const t5Json = await t5Res.json();

      expect(t5Json.draft.localHelperName).toBe('Jennifer');
      expect(t5Json.draft.hasLocalHelper).toBe(true);
      expect(t5Json.nextTargetField).toBe('BUDGET');

      // Turn 6: User answers budget: leave it open
      const t6Req = new NextRequest('http://localhost:3000/api/ai/intake', {
        method: 'POST',
        body: JSON.stringify({
          message: 'Leave it open for now.',
          currentDraft: t5Json.draft,
        }),
      });
      const t6Res = await intakePost(t6Req);
      const t6Json = await t6Res.json();

      expect(t6Json.draft.budgetStatus).toBe('UNSET');
      expect(t6Json.draft.budget).toBeUndefined();
      expect(t6Json.isReady).toBe(true);
      expect(t6Json.nextAction).toBe('CREATE_PLAN');
    });
  });

  describe('Case Creation Integrity', () => {
    it('creates case with unset budget and location without forcing 8000 or 77004', async () => {
      const req = new NextRequest('http://localhost:3000/api/cases', {
        method: 'POST',
        body: JSON.stringify({
          seniorName: 'Robert',
          transitionType: 'POST_HOSPITAL',
          dischargeDays: 4,
          mobilityConstraint: true,
          stairsConstraint: true,
          userName: 'Michael',
          userIsRemote: true,
          // budget and zipCode left unset
        }),
      });

      const res = await casesPost(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.caseId).toBeDefined();
    });

    it('still supports the explicit Maria Thompson golden demo fixture', async () => {
      const req = new NextRequest('http://localhost:3000/api/cases', {
        method: 'POST',
        body: JSON.stringify({ preset: 'MARIA_GOLDEN_SCENARIO' }),
      });

      const res = await casesPost(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.caseId).toContain('case-maria');
    });
  });

  describe('User Transcript Bugfix: Parent, tmr, by eod, no mobility, 77063, multi-helpers, Yin, live it open', () => {
    it('accurately resolves full intake and unlocks draft plan proposal without losing context or looping', async () => {
      // Turn 1: "My parent needs to move"
      const t1Res = await intakePost(
        new NextRequest('http://localhost:3000/api/ai/intake', {
          method: 'POST',
          body: JSON.stringify({
            message: 'My parent needs to move',
            currentDraft: {},
          }),
        })
      );
      const t1 = await t1Res.json();
      expect(t1.success).toBe(true);
      expect(t1.draft.seniorName).toBe('Parent');
      expect(t1.draft.seniorRelationship).toBe('Parent');
      expect(t1.draft.coordinatorRelationship).toBe('Child');
      expect(t1.isReady).toBe(false);
      expect(t1.nextTargetField).toBe('DISCHARGE_TIMING');

      // Turn 2: "tmr"
      const t2Res = await intakePost(
        new NextRequest('http://localhost:3000/api/ai/intake', {
          method: 'POST',
          body: JSON.stringify({
            message: 'tmr',
            currentDraft: t1.draft,
          }),
        })
      );
      const t2 = await t2Res.json();
      expect(t2.success).toBe(true);
      expect(t2.draft.dischargeDays).toBe(1);
      expect(t2.draft.dischargeTimelineDescription).toBe('Tomorrow');

      // Turn 3: "by eod"
      const t3Res = await intakePost(
        new NextRequest('http://localhost:3000/api/ai/intake', {
          method: 'POST',
          body: JSON.stringify({
            message: 'by eod',
            currentDraft: t2.draft,
          }),
        })
      );
      const t3 = await t3Res.json();
      expect(t3.success).toBe(true);
      expect(t3.draft.dischargeTime).toBe('17:00');
      expect(t3.draft.dischargePrecision).toBe('EXACT');
      expect(t3.nextTargetField).toBe('SAFETY_MOBILITY');

      // Turn 4: "no"
      const t4Res = await intakePost(
        new NextRequest('http://localhost:3000/api/ai/intake', {
          method: 'POST',
          body: JSON.stringify({
            message: 'no',
            currentDraft: t3.draft,
          }),
        })
      );
      const t4 = await t4Res.json();
      expect(t4.success).toBe(true);
      expect(t4.draft.mobilityConstraint).toBe(false);
      expect(t4.draft.stairsConstraint).toBe(false);
      expect(t4.nextTargetField).toBe('LOCATION');

      // Turn 5: "77063"
      const t5Res = await intakePost(
        new NextRequest('http://localhost:3000/api/ai/intake', {
          method: 'POST',
          body: JSON.stringify({
            message: '77063',
            currentDraft: t4.draft,
          }),
        })
      );
      const t5 = await t5Res.json();
      expect(t5.success).toBe(true);
      expect(t5.draft.zipCode).toBe('77063');
      expect(t5.nextTargetField).toBe('LOCAL_SUPPORT');

      // Turn 6: "Yes, my brother Jim, my sister Kim, and my aunt Jin"
      const t6Res = await intakePost(
        new NextRequest('http://localhost:3000/api/ai/intake', {
          method: 'POST',
          body: JSON.stringify({
            message: 'Yes, my brother Jim, my sister Kim, and my aunt Jin',
            currentDraft: t5.draft,
          }),
        })
      );
      const t6 = await t6Res.json();
      expect(t6.success).toBe(true);
      // Senior name must NOT be overwritten by Jim or Kim
      expect(t6.draft.seniorName).toBe('Parent');
      expect(t6.draft.draftMembers).toBeDefined();
      expect(t6.draft.draftMembers.length).toBe(3);
      const memberNames = t6.draft.draftMembers.map((m: any) => m.name);
      expect(memberNames).toContain('Jim');
      expect(memberNames).toContain('Kim');
      expect(memberNames).toContain('Jin');
      expect(t6.nextTargetField).toBe('COORDINATOR_NAME');

      // Turn 7: "Yin"
      const t7Res = await intakePost(
        new NextRequest('http://localhost:3000/api/ai/intake', {
          method: 'POST',
          body: JSON.stringify({
            message: 'Yin',
            currentDraft: t6.draft,
          }),
        })
      );
      const t7 = await t7Res.json();
      expect(t7.success).toBe(true);
      expect(t7.draft.coordinatorName).toBe('Yin');
      expect(t7.draft.coordinatorRelationship).toBe('Child');
      expect(t7.nextTargetField).toBe('BUDGET');

      // Turn 8: "live it open" (typo for leave it open)
      const t8Res = await intakePost(
        new NextRequest('http://localhost:3000/api/ai/intake', {
          method: 'POST',
          body: JSON.stringify({
            message: 'live it open',
            currentDraft: t7.draft,
          }),
        })
      );
      const t8 = await t8Res.json();
      expect(t8.success).toBe(true);
      expect(t8.draft.budgetStatus).toBe('UNSET');
      expect(t8.draft.budget).toBeUndefined();

      // Everything required is now known!
      expect(t8.isReady).toBe(true);
      expect(t8.nextAction).toBe('CREATE_PLAN');
      expect(t8.missingRequiredFields).toHaveLength(0);

      // Verify draft plan generation produces valid proposed members
      const planDraft = await draftService.createDraftFromIntake(t8.draft, 'user-test-yin');
      expect(planDraft).toBeDefined();
      expect(planDraft.seniorProfile.name).toBe('Parent');
      expect(planDraft.budgetStatus).toBe('UNSET');
      expect(planDraft.status).toBe('DRAFT');

      const proposedMemberNames = planDraft.proposedMembers.map((m) => m.name);
      expect(proposedMemberNames).toContain('Yin');
      expect(proposedMemberNames).toContain('Jim');
      expect(proposedMemberNames).toContain('Kim');
      expect(proposedMemberNames).toContain('Jin');

      const yinMember = planDraft.proposedMembers.find((m) => m.name === 'Yin');
      expect(yinMember?.role).toBe('OWNER');
      expect(yinMember?.relationship).toBe('Child');
    });
  });
});
