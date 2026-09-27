import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as draftsPost } from '../app/api/drafts/route';
import { GET as draftGet, PATCH as draftPatch } from '../app/api/drafts/[draftId]/route';
import { POST as activatePost } from '../app/api/drafts/[draftId]/activate/route';
import { draftService } from '../services/draft-service';
import { resourceService } from '../services/resource-service';
import { repository } from '../db/repository';
import { IntakeDraft } from '../types';

describe('Draft Proposal, Idempotent Activation & Auth Boundaries', () => {
  beforeEach(async () => {
    await repository.resetAll();
  });

  describe('Draft Creation & Isolation', () => {
    it('creates a PlanDraft proposal rather than an active TransitionCase', async () => {
      const intakeDraft: IntakeDraft = {
        seniorName: 'Robert',
        transitionType: 'POST_HOSPITAL',
        dischargeTimelineDescription: 'Friday',
        dischargeDays: 5,
        mobilityConstraint: true,
        stairsConstraint: true,
        zipCode: '77004',
        city: 'Houston, TX',
        userName: 'Michael',
        userRelationship: 'Son',
        userIsRemote: true,
        budgetStatus: 'UNSET',
      };

      const req = new NextRequest('http://localhost:3000/api/drafts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'usr-michael-123',
        },
        body: JSON.stringify({ intakeDraft }),
      });

      const res = await draftsPost(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.draftId).toBeDefined();
      expect(json.draft.status).toBe('DRAFT');
      expect(json.draft.seniorProfile.name).toBe('Robert');
      expect(json.draft.proposedTasks.length).toBeGreaterThanOrEqual(4);

      // Verify no active TransitionCase was created
      const allCases = await repository.listCases();
      expect(allCases.length).toBe(0);

      // Verify no active case events were emitted
      const tempCaseEvents = await repository.getCaseEvents('temp-case-' + json.draftId);
      expect(tempCaseEvents.length).toBe(0);
    });

    it('allows editing draft values before activation and retains changes', async () => {
      const draft = await draftService.createDraftFromIntake(
        {
          seniorName: 'Robert',
          dischargeDays: 5,
          mobilityConstraint: true,
          zipCode: '77004',
          userName: 'Michael',
          budgetStatus: 'UNSET',
        },
        'usr-michael-123'
      );

      // Edit the draft via PATCH endpoint
      const patchReq = new NextRequest(`http://localhost:3000/api/drafts/${draft.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'usr-michael-123',
        },
        body: JSON.stringify({
          seniorProfile: {
            ...draft.seniorProfile,
            name: 'Robert Jr.',
          },
          budgetStatus: 'SET',
          proposedBudget: 6500,
        }),
      });

      const patchRes = await draftPatch(patchReq, {
        params: Promise.resolve({ draftId: draft.id }),
      });
      const patchJson = await patchRes.json();

      expect(patchRes.status).toBe(200);
      expect(patchJson.success).toBe(true);
      expect(patchJson.draft.seniorProfile.name).toBe('Robert Jr.');
      expect(patchJson.draft.budgetStatus).toBe('SET');
      expect(patchJson.draft.proposedBudget).toBe(6500);
    });
  });

  describe('Idempotent Activation', () => {
    it('activates draft into TransitionCase with edited values and prevents duplicates on retry', async () => {
      const draft = await draftService.createDraftFromIntake(
        {
          seniorName: 'Eleanor',
          dischargeDays: 3,
          mobilityConstraint: true,
          stairsConstraint: true,
          zipCode: '77004',
          userName: 'David',
          budget: 5000,
          budgetStatus: 'SET',
        },
        'usr-david-456'
      );

      // 1st Activation
      const act1Req = new NextRequest(`http://localhost:3000/api/drafts/${draft.id}/activate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'usr-david-456',
        },
      });

      const act1Res = await activatePost(act1Req, {
        params: Promise.resolve({ draftId: draft.id }),
      });
      const act1Json = await act1Res.json();

      expect(act1Res.status).toBe(200);
      expect(act1Json.success).toBe(true);
      expect(act1Json.caseId).toBeDefined();

      const activeCase = await repository.getCaseById(act1Json.caseId);
      expect(activeCase).toBeDefined();
      expect(activeCase?.ownerUserId).toBe('usr-david-456');
      expect(activeCase?.budget).toBe(5000);

      // Verify events recorded
      const events = await repository.getCaseEvents(act1Json.caseId);
      expect(events.some((e) => e.type === 'CASE_CREATED')).toBe(true);
      expect(events.some((e) => e.type === 'PLAN_GENERATED')).toBe(true);

      // 2nd Activation Retry (Idempotency)
      const act2Req = new NextRequest(`http://localhost:3000/api/drafts/${draft.id}/activate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'usr-david-456',
        },
      });

      const act2Res = await activatePost(act2Req, {
        params: Promise.resolve({ draftId: draft.id }),
      });
      const act2Json = await act2Res.json();

      expect(act2Res.status).toBe(200);
      expect(act2Json.success).toBe(true);
      // Must return the exact same caseId without creating a duplicate
      expect(act2Json.caseId).toBe(act1Json.caseId);

      const allCases = await repository.listCases();
      expect(allCases.length).toBe(1);
    });
  });

  describe('Authorization & Access Boundaries', () => {
    it('blocks unrelated users from modifying or activating someone else’s draft', async () => {
      const draft = await draftService.createDraftFromIntake(
        {
          seniorName: 'Arthur',
          dischargeDays: 4,
          mobilityConstraint: false,
          zipCode: '77004',
          userName: 'Alice',
          budgetStatus: 'UNSET',
        },
        'usr-alice-real-owner'
      );

      // Attempt edit by unrelated attacker
      const patchReq = new NextRequest(`http://localhost:3000/api/drafts/${draft.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'usr-mallory-intruder',
        },
        body: JSON.stringify({
          seniorProfile: { ...draft.seniorProfile, name: 'Hacked' },
        }),
      });

      const patchRes = await draftPatch(patchReq, {
        params: Promise.resolve({ draftId: draft.id }),
      });
      expect(patchRes.status).toBe(403);

      // Attempt activate by unrelated attacker
      const actReq = new NextRequest(`http://localhost:3000/api/drafts/${draft.id}/activate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'usr-mallory-intruder',
        },
      });

      const actRes = await activatePost(actReq, {
        params: Promise.resolve({ draftId: draft.id }),
      });
      expect(actRes.status).toBe(403);
    });

    it('enforces case-level access control on active cases', async () => {
      const draft = await draftService.createDraftFromIntake(
        {
          seniorName: 'Arthur',
          dischargeDays: 4,
          mobilityConstraint: false,
          zipCode: '77004',
          userName: 'Alice',
          budgetStatus: 'UNSET',
        },
        'usr-alice-real-owner'
      );

      const actResult = await draftService.activateDraft(draft.id, 'usr-alice-real-owner');

      // Verify access checks
      const hasAliceAccess = await repository.checkCaseAccess(actResult.caseId, 'usr-alice-real-owner');
      expect(hasAliceAccess).toBe(true);

      const hasStrangerAccess = await repository.checkCaseAccess(actResult.caseId, 'usr-stranger');
      expect(hasStrangerAccess).toBe(false);
    });
  });

  describe('Resource Search Abstraction & Task Intents', () => {
    it('maps task intents only for tasks requiring outside professionals', () => {
      const moverIntent = resourceService.getIntentForTask(
        'schedule-senior-mover',
        'Request moving estimates'
      );
      expect(moverIntent).toBeDefined();
      expect(moverIntent?.category).toBe('moving');

      const safetyIntent = resourceService.getIntentForTask(
        'assess-home-accessibility',
        'Assess stair safety and home accessibility'
      );
      expect(safetyIntent).toBeDefined();
      expect(safetyIntent?.category).toBe('home_modification');

      // Decision-only task should not search local businesses
      const decisionIntent = resourceService.getIntentForTask(
        'confirm-discharge-destination',
        'Confirm safe discharge destination with physician'
      );
      expect(decisionIntent).toBeNull();
    });

    it('provides honest provenance trust labels without inflated claims', async () => {
      const candidates = await resourceService.searchNearby({
        category: 'moving',
        zipCode: '77004',
      });

      expect(candidates.length).toBeGreaterThan(0);
      candidates.forEach((c) => {
        expect(['MoveWell-reviewed', 'Public agency', 'Directory listing', 'Nearby option']).toContain(
          c.trustLabel
        );
        expect(c.trustLabel).not.toBe('Certified');
        expect(c.trustLabel).not.toBe('Vetted');
      });
    });
  });
});
