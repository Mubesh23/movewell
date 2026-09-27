import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { resolveTemporalExpression } from '../lib/temporal';
import { POST as intakePost } from '../app/api/ai/intake/route';
import { POST as draftChatPost } from '../app/api/drafts/[draftId]/chat/route';
import { draftService } from '../services/draft-service';
import { repository } from '../db/repository';
import { IntakeDraft } from '../types';

describe('Temporal Reasoning, Coordinator Identity & Family Network Coordination', () => {
  describe('Temporal Resolver (Deterministic Time-Awareness)', () => {
    // Reference date: Wednesday, September 30, 2026
    const refDate = new Date('2026-09-30T10:00:00Z');

    it('resolves tomorrow as exactly +1 day from reference date', () => {
      const res = resolveTemporalExpression('she is leaving tomorrow', refDate);
      expect(res).not.toBeNull();
      expect(res?.date).toBe('2026-10-01');
      expect(res?.daysFromReference).toBe(1);
      expect(res?.precision).toBe('DAY');
      expect(res?.needsClarification).toBe(false);
    });

    it('resolves Thursday as upcoming Thursday (+1 day from Wednesday)', () => {
      const res = resolveTemporalExpression('discharge is Thursday', refDate);
      expect(res).not.toBeNull();
      expect(res?.date).toBe('2026-10-01');
      expect(res?.daysFromReference).toBe(1);
    });

    it('resolves Friday as upcoming Friday (+2 days from Wednesday)', () => {
      const res = resolveTemporalExpression('discharged Friday', refDate);
      expect(res).not.toBeNull();
      expect(res?.date).toBe('2026-10-02');
      expect(res?.daysFromReference).toBe(2);
    });

    it('flags "next week" as needing clarification rather than arbitrarily guessing 7 days', () => {
      const res = resolveTemporalExpression('she will leave next week', refDate);
      expect(res).not.toBeNull();
      expect(res?.precision).toBe('RANGE');
      expect(res?.needsClarification).toBe(true);
      expect(res?.clarificationPrompt).toContain('particular day next week');
      expect(res?.rangeStart).toBeDefined();
      expect(res?.rangeEnd).toBeDefined();
    });

    it('extracts specific time when provided', () => {
      const res = resolveTemporalExpression('discharge is Friday around 2 PM', refDate);
      expect(res).not.toBeNull();
      expect(res?.date).toBe('2026-10-02');
      expect(res?.time).toBe('14:00');
      expect(res?.precision).toBe('EXACT');
    });
  });

  describe('Coordinator Identity & Care Circle in Intake', () => {
    it('captures coordinator name, relationship, and staged helper invite in intake', async () => {
      const req = new NextRequest('http://localhost:3000/api/ai/intake', {
        method: 'POST',
        body: JSON.stringify({
          message: "I'm her son Mubesh. My sister Jennifer lives nearby, her email is jennifer@example.com.",
          currentDraft: {
            seniorName: 'Maria',
            dischargeDate: '2026-10-02',
            mobilityConstraint: true,
            zipCode: '77005',
          },
        }),
      });

      const res = await intakePost(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.draft.coordinatorName).toBe('Mubesh');
      expect(json.draft.coordinatorRelationship).toBe('Son');
      expect(json.draft.localHelperName).toBe('Jennifer');
      expect(json.draft.familyMembers).toBeDefined();
      const helper = json.draft.familyMembers.find((m: any) => m.name === 'Jennifer');
      expect(helper).toBeDefined();
      expect(helper.invite).toBeDefined();
      expect(helper.invite.contact).toBe('jennifer@example.com');
      expect(helper.invite.channel).toBe('EMAIL');
    });
  });

  describe('Draft Workbench: Nora Natural Language Editing & What Changed', () => {
    it('handles budget updates and creates What Changed diffs', async () => {
      const draft = await draftService.createDraftFromIntake(
        {
          seniorName: 'Eleanor',
          userName: 'Mubesh',
          userRelationship: 'Son',
          localHelperName: 'Jennifer',
          dischargeDays: 3,
          budgetStatus: 'UNSET',
        },
        'user-test-coord-1'
      );

      const params = Promise.resolve({ draftId: draft.id });
      const req = new NextRequest(`http://localhost:3000/api/drafts/${draft.id}/chat`, {
        method: 'POST',
        body: JSON.stringify({
          message: 'We actually have a $12,000 budget.',
        }),
      });

      const res = await draftChatPost(req, { params });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.draft.proposedBudget).toBe(12000);
      expect(json.draft.budgetStatus).toBe('SET');
      expect(json.whatChanged).toBeDefined();
      expect(json.whatChanged.diffs[0].label).toBe('Budget');
      expect(json.whatChanged.diffs[0].after).toBe('$12,000');
    });

    it('previews multi-task local assignment before applying', async () => {
      const draft = await draftService.createDraftFromIntake(
        {
          seniorName: 'Eleanor',
          userName: 'Mubesh',
          userRelationship: 'Son',
          localHelperName: 'Jennifer',
          dischargeDays: 3,
        },
        'user-test-coord-2'
      );

      const params = Promise.resolve({ draftId: draft.id });
      // Ask Nora to assign local tasks to Jennifer
      const req1 = new NextRequest(`http://localhost:3000/api/drafts/${draft.id}/chat`, {
        method: 'POST',
        body: JSON.stringify({
          message: 'Have Jennifer handle everything that needs someone local.',
        }),
      });

      const res1 = await draftChatPost(req1, { params });
      const json1 = await res1.json();

      expect(res1.status).toBe(200);
      expect(json1.success).toBe(true);
      expect(json1.requiresConfirmation).toBe(true);
      expect(json1.pendingChanges.length).toBeGreaterThan(0);
      expect(json1.pendingChanges[0].after).toBe('Jennifer');

      // Now apply changes
      const req2 = new NextRequest(`http://localhost:3000/api/drafts/${draft.id}/chat`, {
        method: 'POST',
        body: JSON.stringify({
          action: 'APPLY_CHANGES',
          pendingChanges: json1.pendingChanges,
        }),
      });

      const res2 = await draftChatPost(req2, { params });
      const json2 = await res2.json();

      expect(res2.status).toBe(200);
      expect(json2.success).toBe(true);
      expect(json2.draft.proposedTasks.some((t: any) => t.assigneeName === 'Jennifer')).toBe(true);
      expect(json2.whatChanged).toBeDefined();
    });

    it('stages invitations during draft creation and transitions to PENDING upon activation', async () => {
      const draft = await draftService.createDraftFromIntake(
        {
          seniorName: 'Robert',
          coordinatorName: 'Mubesh',
          coordinatorRelationship: 'Son',
          familyMembers: [
            {
              id: 'fm-1',
              name: 'Jennifer',
              relationship: 'Daughter',
              isLocal: true,
              email: 'jennifer@example.com',
              invite: {
                channel: 'EMAIL',
                contact: 'jennifer@example.com',
              },
            },
          ],
          dischargeDays: 4,
          budgetStatus: 'UNSET',
        },
        'user-test-coord-3'
      );

      // Verify staged invitation on draft
      expect(draft.proposedMembers.length).toBe(2);
      const helper = draft.proposedMembers.find((m) => m.name === 'Jennifer');
      expect(helper?.invitation).toBeDefined();
      expect(helper?.invitation?.channel).toBe('EMAIL');

      // Activate draft
      const activation = await draftService.activateDraft(draft.id, 'user-test-coord-3');
      expect(activation.success).toBe(true);

      const members = await repository.getCaseMembers(activation.caseId);
      const activatedHelper = members.find((m) => m.name === 'Jennifer');
      expect(activatedHelper).toBeDefined();
      expect(activatedHelper?.invitationStatus).toBe('PENDING');
      expect(activatedHelper?.email).toBe('jennifer@example.com');
    });
  });
});
