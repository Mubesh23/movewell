import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as intakePost } from '../app/api/ai/intake/route';
import { POST as casesPost } from '../app/api/cases/route';
import { intakeReadinessService } from '../services/intake-readiness';
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

    it('prioritizes local support when mobility is provided', () => {
      const draft: IntakeDraft = {
        seniorName: 'Maria',
        dischargeTimelineDescription: 'Thursday',
        mobilityConstraint: true,
        stairsConstraint: true,
        livesAlone: true,
      };
      const res = intakeReadinessService.evaluate(draft);

      expect(res.isReady).toBe(false);
      expect(res.nextTargetField).toBe('LOCAL_SUPPORT');
    });

    it('prioritizes budget when family coordination is noted', () => {
      const draft: IntakeDraft = {
        seniorName: 'Maria',
        dischargeTimelineDescription: 'Thursday',
        mobilityConstraint: true,
        stairsConstraint: true,
        livesAlone: true,
        hasLocalHelper: true,
        localHelperName: 'Jennifer',
        userIsRemote: true,
      };
      const res = intakeReadinessService.evaluate(draft);

      expect(res.isReady).toBe(false);
      expect(res.nextTargetField).toBe('BUDGET');
    });

    it('marks draft ready when budget is explicitly unset (open) without forcing numerical default', () => {
      const draft: IntakeDraft = {
        seniorName: 'Maria',
        dischargeTimelineDescription: 'Thursday',
        dischargeDays: 4,
        mobilityConstraint: true,
        stairsConstraint: true,
        livesAlone: true,
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
      expect(t1Json.draft.seniorName).toBeDefined();
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

      // Turn 4: User answers local helper
      const t4Req = new NextRequest('http://localhost:3000/api/ai/intake', {
        method: 'POST',
        body: JSON.stringify({
          message: 'My sister Jennifer lives nearby.',
          currentDraft: t3Json.draft,
        }),
      });
      const t4Res = await intakePost(t4Req);
      const t4Json = await t4Res.json();

      expect(t4Json.draft.localHelperName).toBe('Jennifer');
      expect(t4Json.draft.hasLocalHelper).toBe(true);
      expect(t4Json.nextTargetField).toBe('BUDGET');

      // Turn 5: User answers budget: leave it open
      const t5Req = new NextRequest('http://localhost:3000/api/ai/intake', {
        method: 'POST',
        body: JSON.stringify({
          message: 'Leave it open for now.',
          currentDraft: t4Json.draft,
        }),
      });
      const t5Res = await intakePost(t5Req);
      const t5Json = await t5Res.json();

      expect(t5Json.draft.budgetStatus).toBe('UNSET');
      expect(t5Json.draft.budget).toBeUndefined();
      expect(t5Json.isReady).toBe(true);
      expect(t5Json.nextAction).toBe('CREATE_PLAN');
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
});
