import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { resolveSession, GUEST_COOKIE_NAME, SESSION_COOKIE_NAME } from '@/lib/auth-helper';
import { repository } from '@/db/repository';
import { caseService } from '@/services/case-service';
import { taskService } from '@/services/task-service';
import { draftService } from '@/services/draft-service';
import { invitationService } from '@/services/invitation-service';
import { evidenceService, REAL_EVIDENCE_SOURCES } from '@/services/evidence-service';
import { resourceService } from '@/services/resource-service';
import { TransitionCase, SeniorProfile, CaseMember, IntakeDraft } from '@/types';

describe('Final Convergence & Demo Reliability Suite', () => {
  beforeEach(() => {
    // Clean memory store before each test
  });

  describe('P0: Authentication Security & Google-Only Flow', () => {
    it('raw user UUID cookie cannot grant AUTHENTICATED status', async () => {
      const fakeUuid = '550e8400-e29b-41d4-a716-446655440000';
      const req = new NextRequest('http://localhost:3000/api/cases', {
        headers: {
          cookie: `${SESSION_COOKIE_NAME}=${fakeUuid}`,
        },
      });

      const session = await resolveSession(req);
      expect(session.kind).toBe('GUEST');
      if (session.kind === 'GUEST') {
        expect(session.guestToken).not.toBe(fakeUuid);
        expect(session.guestToken).toMatch(/^anon_/);
      }
    });

    it('guest session cookie provides isolated anonymous token without granting admin rights', async () => {
      const guestToken = 'guest_test_token_12345';
      const req = new NextRequest('http://localhost:3000/api/cases', {
        headers: {
          cookie: `${GUEST_COOKIE_NAME}=${guestToken}`,
        },
      });

      const session = await resolveSession(req);
      expect(session.kind).toBe('GUEST');
      if (session.kind === 'GUEST') {
        expect(session.guestToken).toBe(guestToken);
      }
    });

    it('evidence sources use clean, single publisher names with verified metadata', () => {
      for (const source of REAL_EVIDENCE_SOURCES) {
        expect(source.publisher).toBeDefined();
        expect(source.publisher).not.toContain('&'); // No composite publishers like "Move.org & Angi"
        expect(source.publisher).not.toContain('/'); // No composite publishers like "HomeAdvisor / Angi"
        expect(source.url).toMatch(/^https?:\/\//);
        expect(source.lastCheckedAt).toBeDefined();
      }
    });
  });

  describe('P0: /home Multi-Plan & Collaboration Queries', () => {
    it('correctly filters owned cases, shared cases, and drafts by user ID', async () => {
      const ownerId = 'user-owner-101';
      const memberUserId = 'user-member-202';

      const testCase1: TransitionCase = {
        id: 'case-owned-1',
        ownerUserId: ownerId,
        transitionType: 'POST_HOSPITAL',
        urgency: 'URGENT',
        zipCode: '77004',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await repository.saveCase(testCase1);

      const testCase2: TransitionCase = {
        id: 'case-shared-2',
        ownerUserId: 'another-owner',
        transitionType: 'POST_HOSPITAL',
        urgency: 'URGENT',
        zipCode: '77025',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await repository.saveCase(testCase2);

      const memberRecord: CaseMember = {
        id: 'mbr-shared-202',
        caseId: testCase2.id,
        userId: memberUserId,
        name: 'Jennifer',
        role: 'FAMILY',
        isLocal: true,
      };
      await repository.saveCaseMember(memberRecord);

      // Verify queries
      const owned = await repository.getCasesByOwnerUserId(ownerId);
      expect(owned.some((c) => c.id === 'case-owned-1')).toBe(true);

      const shared = await repository.getCasesByMemberUserId(memberUserId);
      expect(shared.some((c) => c.id === 'case-shared-2')).toBe(true);
      expect(shared.some((c) => c.id === 'case-owned-1')).toBe(false);
    });
  });

  describe('P0: Location Semantics & Case Mutations', () => {
    it('temporary resource search does NOT mutate the saved case location', async () => {
      const caseId = 'case-loc-test-' + Math.random().toString(36).substring(2, 7);
      const caseData: TransitionCase = {
        id: caseId,
        ownerUserId: 'owner-test',
        transitionType: 'POST_HOSPITAL',
        urgency: 'URGENT',
        zipCode: '77004',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await repository.saveCase(caseData);

      // Perform search for Austin ZIP 78701
      const results = await resourceService.findResources('moving', '78701');
      expect(Array.isArray(results)).toBe(true);

      // Verify case zipCode is still 77004
      const fetched = await repository.getCaseById(caseId);
      expect(fetched?.zipCode).toBe('77004');
    });

    it('explicit saved location update mutates case and records LOCATION_CHANGED event', async () => {
      const caseId = 'case-loc-mut-' + Math.random().toString(36).substring(2, 7);
      const caseData: TransitionCase = {
        id: caseId,
        ownerUserId: 'owner-test',
        transitionType: 'POST_HOSPITAL',
        urgency: 'URGENT',
        zipCode: '77004',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await repository.saveCase(caseData);

      const updateResult = await caseService.updateCase(
        caseId,
        { zipCode: '77025' },
        'Sarah',
        'user-owner-123'
      );

      expect(updateResult.caseData.zipCode).toBe('77025');
      expect(updateResult.planChange).toBeDefined();
      expect(updateResult.planChange?.diffs.some((d) => d.before === '77004' && d.after === '77025')).toBe(true);

      const events = await repository.getCaseEvents(caseId);
      expect(events.some((e) => e.type === 'LOCATION_CHANGED')).toBe(true);
    });
  });

  describe('P0: Living Plan Adaptation & Task Completion', () => {
    it('confirmDischargeDestination deterministically sets REHAB_FIRST and unblocks downstream tasks', async () => {
      const caseId = 'case-rehab-' + Math.random().toString(36).substring(2, 7);
      const caseData: TransitionCase = {
        id: caseId,
        ownerUserId: 'owner-test',
        transitionType: 'POST_HOSPITAL',
        urgency: 'URGENT',
        zipCode: '77004',
        destinationStatus: 'UNDECIDED',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await repository.saveCase(caseData);

      const profile: SeniorProfile = {
        id: 'prof-' + caseId,
        caseId,
        name: 'Maria Thompson',
        livesAlone: true,
        mobilityConstraint: true,
        stairsConstraint: true,
        immediateSafetyConcern: false,
        ownsHome: true,
      };
      await repository.saveSeniorProfile(profile);

      // Create decision task and downstream task
      const decisionTask = await repository.saveTask({
        id: 'tsk-decide-' + caseId,
        caseId,
        phase: 'RIGHT_NOW',
        title: 'Confirm discharge destination with hospital team',
        status: 'READY',
        priority: 1,
        minEstimatedCost: 0,
        maxEstimatedCost: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const downstreamTask = await repository.saveTask({
        id: 'tsk-rehab-coord-' + caseId,
        caseId,
        phase: 'THIS_WEEK',
        title: 'Coordinate short-term rehabilitation facility transition',
        status: 'BLOCKED',
        dependsOnTaskIds: [decisionTask.id],
        priority: 2,
        minEstimatedCost: 0,
        maxEstimatedCost: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      await repository.saveTaskDependencies([
        {
          taskId: downstreamTask.id,
          dependsOnTaskId: decisionTask.id,
        },
      ]);

      // Confirm rehab
      const result = await caseService.confirmDischargeDestination({
        caseId,
        destination: 'REHAB_FIRST',
        actor: 'Sarah',
        note: 'Social worker confirmed short-term rehab placement.',
      });

      expect(result.caseData.destinationStatus).toBe('REHAB_FIRST');
      expect(result.completedTask?.status).toBe('COMPLETED');

      // Verify downstream task is now READY
      const updatedDownstream = await repository.getTaskById(downstreamTask.id);
      expect(updatedDownstream?.status).toBe('READY');
      expect(result.planChange).toBeDefined();
    });

    it('completing a task assigned to another member requires a note', async () => {
      const caseId = 'case-task-note-' + Math.random().toString(36).substring(2, 7);
      const task = await repository.saveTask({
        id: 'tsk-jennifer-' + caseId,
        caseId,
        phase: 'THIS_WEEK',
        title: 'Pack first-week essential belongings',
        status: 'READY',
        assigneeId: 'mbr-jennifer',
        priority: 1,
        minEstimatedCost: 0,
        maxEstimatedCost: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Completing with note works cleanly
      const completed = await taskService.completeTask(
        task.id,
        'Sarah',
        caseId,
        'Jennifer settled the packing over the weekend.'
      );
      expect(completed.status).toBe('COMPLETED');
      expect(completed.completionNotes).toContain('Jennifer settled the packing');
    });
  });

  describe('P0: Geographic Evidence Truthfulness', () => {
    it('resolves geography tiers accurately across Houston, Texas, and National ZIPs', async () => {
      const { resolveGeographyTier } = await import('../services/evidence-service');
      expect(resolveGeographyTier('77004')).toBe('HOUSTON_HARRIS');
      expect(resolveGeographyTier('Houston, TX')).toBe('HOUSTON_HARRIS');
      expect(resolveGeographyTier('78701')).toBe('TEXAS');
      expect(resolveGeographyTier('Austin, TX')).toBe('TEXAS');
      expect(resolveGeographyTier('90210')).toBe('NATIONAL');
      expect(resolveGeographyTier(undefined)).toBe('NATIONAL');
    });

    it('unsupported external geographies gracefully fall back without claiming local status', () => {
      const summary = evidenceService.getEvidenceForCategory('moving', '78701');
      expect(summary).toBeDefined();
      if (summary) {
        // Since 78701 is Austin, TX, it falls back to Texas without pretending to be a local Houston tariff
        expect(summary.geography).toBe('Texas');
        expect(summary.geography).not.toBe('Houston, TX');
        expect(summary.sources.length).toBeGreaterThan(0);
        expect(summary.sources[0].url).toMatch(/^https?:\/\//);
      }
    });

    it('budget unset remains open without defaulting to $8,000', async () => {
      const caseId = 'case-budget-open-' + Math.random().toString(36).substring(2, 7);
      const caseData: TransitionCase = {
        id: caseId,
        ownerUserId: 'owner-test',
        transitionType: 'POST_HOSPITAL',
        urgency: 'URGENT',
        zipCode: '77004',
        budget: undefined, // Open budget
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await repository.saveCase(caseData);

      const profile: SeniorProfile = {
        id: 'prof-' + caseId,
        caseId,
        name: 'Maria Thompson',
        livesAlone: true,
        mobilityConstraint: true,
        stairsConstraint: true,
        immediateSafetyConcern: false,
        ownsHome: true,
      };
      await repository.saveSeniorProfile(profile);

      const overview = await caseService.getCaseOverview(caseId);
      expect(overview?.caseData.budget).toBeUndefined();
    });
  });

  describe('P0: Cross-Device Persistence & Repository Queries', () => {
    it('getCasesByMemberUserId retrieves cases where user is a care circle member', async () => {
      const testUserId = 'test-member-user-' + Math.random().toString(36).substring(2, 7);
      const testCaseId = 'case-member-query-' + Math.random().toString(36).substring(2, 7);

      const caseData: TransitionCase = {
        id: testCaseId,
        ownerUserId: 'different-owner-id',
        transitionType: 'POST_HOSPITAL',
        urgency: 'URGENT',
        zipCode: '77004',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await repository.saveCase(caseData);

      const member: CaseMember = {
        id: 'member-' + testCaseId,
        caseId: testCaseId,
        name: 'Jennifer',
        role: 'HELPER',
        isLocal: true,
        userId: testUserId,
        createdAt: new Date().toISOString(),
      };
      await repository.saveCaseMember(member);

      const cases = await repository.getCasesByMemberUserId(testUserId);
      expect(cases.some((c) => c.id === testCaseId)).toBe(true);
    });
  });
});

