import { describe, it, expect } from 'vitest';
import { evidenceService } from '../services/evidence-service';
import { aiOrchestrator } from '../services/ai-orchestrator';
import { resourceService } from '../services/resource-service';
import { NextRequest } from 'next/server';
import { POST as intakePost } from '../app/api/ai/intake/route';
import { POST as casesPost } from '../app/api/cases/route';
import { BRAND_NAME } from '../lib/brand';

describe('BridgeWell Final Challenge-Aligned Build Test Suite', () => {
  describe('External Cost Evidence & Grounded Provenance', () => {
    it('prefers local Houston evidence over national benchmarks when available', () => {
      const evidence = evidenceService.getEvidenceForCategory('schedule-senior-mover', '77004');

      expect(evidence).toBeDefined();
      // Should find Houston or Texas specific observation
      expect(evidence?.geography).toMatch(/Houston|Harris County|Texas/i);
      expect(evidence?.observations.length).toBeGreaterThan(0);

      // Verifies external publisher is cited and not self-attributed
      const publishers = evidence?.sources.map((s) => s.publisher) || [];
      expect(publishers.some((p) => p.includes('Angi') || p.includes('Move.org') || p.includes('TxDMV'))).toBe(true);

      // Must never cite fake or self-invented surveys
      const sourceTitles = evidence?.sources.map((s) => s.title) || [];
      for (const title of sourceTitles) {
        expect(title).not.toContain('Regional Texas Senior Transition Cost Survey');
        expect(title).not.toContain('Curated BridgeWell Directory');
      }
    });

    it('returns honest fallback explanation for unmapped categories without breaking', () => {
      const costExplanation = evidenceService.explainCost('unknown-custom-category', '77004');
      expect(costExplanation).toBeDefined();
      expect(costExplanation.summary).toBeNull();
      expect(costExplanation.explanation).toContain('preliminary workflow planning estimate');
      expect(costExplanation.explanation).toContain('recommend requesting quotes');
    });
  });

  describe('Nora explain_cost_estimate Tool & Local Fallback', () => {
    it('answers cost queries deterministically with real external citations without Gemini', async () => {
      const result = await aiOrchestrator.processUserIntentLocal(
        'case-test-123',
        'Why is the moving estimate so high and where did it come from?'
      );

      expect(result.message).toBeDefined();
      expect(result.message.length).toBeGreaterThan(50);
      // Explains cost using external source data
      expect(result.message).toMatch(/Move\.org|Angi|tariff|Houston/i);
      // Explains difference between moving estimate and other items
      expect(result.message).toContain('$950');
      // Must not invent fake survey
      expect(result.message).not.toContain('Regional Texas Senior Transition Cost Survey');
      expect(result.toolResults?.some((tr) => tr.toolName === 'explain_cost_estimate')).toBe(true);
    });
  });

  describe('Harris County Resource Rigor & Provenance', () => {
    it('uses case ZIP 77004 and returns real Harris County resources', async () => {
      const resources = await resourceService.findResources('ALL', '77004');
      expect(resources.length).toBeGreaterThanOrEqual(4);

      // Verify legitimate public/nonprofit services exist
      const publicAgency = resources.find((r) => r.verification?.verificationStatus === 'Public agency');
      expect(publicAgency).toBeDefined();
      expect(publicAgency?.location?.city).toBe('Houston');
      expect(publicAgency?.location?.state).toBe('TX');

      const nonprofit = resources.find((r) => r.verification?.verificationStatus === 'Nonprofit');
      expect(nonprofit).toBeDefined();
      expect(nonprofit?.location?.city).toBe('Houston');
    });

    it('does NOT contain unsupported marketing claims or unvetted verification labels', async () => {
      const resources = await resourceService.findResources('ALL', '77004');

      for (const res of resources) {
        // Must not contain fake badge "Verified provider"
        expect(res.verification?.verificationStatus).not.toBe('Verified provider');
        // Must not make unsupported claims like "NASMM-certified" unless verified
        expect(res.name).not.toContain('NASMM-certified');
        expect(res.description).not.toContain('NASMM-certified');
        // Valid status should be one of our honest factual labels
        const validStatuses = ['Public agency', 'Nonprofit', 'Directory listing'];
        expect(validStatuses).toContain(res.verification?.verificationStatus);
      }
    });
  });

  describe('Intake 3-Point Starting Guidance', () => {
    it('provides immediate 3-point grounding on turn 1 before asking next question', async () => {
      const req = new NextRequest('http://localhost:3000/api/ai/intake', {
        method: 'POST',
        body: JSON.stringify({
          message: 'My mom Maria (78) fell and is in the hospital. We need help figuring out what to do.',
          history: [],
          currentDraft: {},
        }),
      });

      const res = await intakePost(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.assistantMessage).toBeDefined();
      // Contains the 3 clear starting points
      expect(json.assistantMessage).toContain("focus first on:");
      expect(json.assistantMessage).toContain("1. confirming discharge timing and destination");
      expect(json.assistantMessage).toContain("2. making sure the next location is safe");
      expect(json.assistantMessage).toContain("3. identifying who can help locally");
    });
  });

  describe('Scenario Support Boundaries', () => {
    it('accepts POST_HOSPITAL transition cases and rejects unsupported transition types', async () => {
      const validReq = new NextRequest('http://localhost:3000/api/cases', {
        method: 'POST',
        body: JSON.stringify({
          transitionType: 'POST_HOSPITAL',
          seniorName: 'Eleanor',
          zipCode: '77004',
        }),
      });

      const validRes = await casesPost(validReq);
      const validJson = await validRes.json();
      expect(validRes.status).toBe(200);
      expect(validJson.success).toBe(true);
      expect(validJson.caseId).toBeDefined();

      const invalidReq = new NextRequest('http://localhost:3000/api/cases', {
        method: 'POST',
        body: JSON.stringify({
          transitionType: 'PLANNED_DOWNSIZE',
          seniorName: 'Eleanor',
        }),
      });

      const invalidRes = await casesPost(invalidReq);
      const invalidJson = await invalidRes.json();
      expect(invalidRes.status).toBe(400);
      expect(invalidJson.success).toBe(false);
      expect(invalidJson.error).toContain('POST_HOSPITAL');
    });
  });
});
