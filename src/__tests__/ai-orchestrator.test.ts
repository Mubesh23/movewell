import { describe, it, expect, beforeEach } from 'vitest';
import { planningEngine } from '../services/planning-engine';
import { aiOrchestrator } from '../services/ai-orchestrator';
import { repository } from '../db/repository';
import { TransitionCase, SeniorProfile, CaseMember } from '../types';

describe('AI Orchestrator Tool Calling', () => {
  beforeEach(async () => {
    await repository.resetAll();
  });

  it('should parse prompt "Jennifer can handle packing" and invoke assign_task tool', async () => {
    const caseData: TransitionCase = {
      id: 'case-ai-test',
      transitionType: 'POST_HOSPITAL',
      urgency: 'URGENT',
      zipCode: '77004',
      budget: 8000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const profile: SeniorProfile = {
      id: 'prof-ai-test',
      caseId: 'case-ai-test',
      name: 'Maria Thompson',
      livesAlone: true,
      mobilityConstraint: true,
      stairsConstraint: true,
      immediateSafetyConcern: false,
      ownsHome: true,
    };

    const members: CaseMember[] = [
      {
        id: 'mem-sarah',
        caseId: 'case-ai-test',
        name: 'Sarah',
        isLocal: false,
        role: 'OWNER',
      },
      {
        id: 'mem-jennifer',
        caseId: 'case-ai-test',
        name: 'Jennifer',
        isLocal: true,
        role: 'FAMILY',
      },
    ];

    await planningEngine.generatePlan(caseData, profile, members);

    const response = await aiOrchestrator.processUserIntent('case-ai-test', 'Jennifer can handle packing');

    expect(response.message).toContain('Jennifer');
    expect(response.toolResults.length).toBeGreaterThan(0);
    expect(response.toolResults[0].success).toBe(true);

    // Verify task assignment in repository
    const tasks = await repository.getTasksByCaseId('case-ai-test');
    const packingTask = tasks.find((t) => t.templateId === 'inventory-belongings' || t.title.toLowerCase().includes('inventory'));
    expect(packingTask?.assigneeId).toBe('mem-jennifer');

    // Verify CaseEvent logged with actorType AI
    const events = await repository.getCaseEvents('case-ai-test');
    const assignedEvent = events.find((e) => e.type === 'TASK_ASSIGNED');
    expect(assignedEvent).toBeDefined();
  });

  it('should parse budget update prompt "Set budget to 5000" and update budget', async () => {
    const caseData: TransitionCase = {
      id: 'case-ai-budget',
      transitionType: 'POST_HOSPITAL',
      urgency: 'URGENT',
      zipCode: '77004',
      budget: 8000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const profile: SeniorProfile = {
      id: 'prof-ai-budget',
      caseId: 'case-ai-budget',
      name: 'Maria Thompson',
      livesAlone: true,
      mobilityConstraint: true,
      stairsConstraint: true,
      immediateSafetyConcern: false,
      ownsHome: true,
    };

    await planningEngine.generatePlan(caseData, profile, []);

    const response = await aiOrchestrator.processUserIntent('case-ai-budget', 'Set budget to $5,000');
    expect(response.toolResults[0].success).toBe(true);

    const updatedCase = await repository.getCaseById('case-ai-budget');
    expect(updatedCase?.budget).toBe(5000);
  });

  it('should parse multi-intent prompt "update the budget to 5,000 and re-assign packing to James"', async () => {
    const caseData: TransitionCase = {
      id: 'case-ai-multi',
      transitionType: 'POST_HOSPITAL',
      urgency: 'URGENT',
      zipCode: '77004',
      budget: 8000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const profile: SeniorProfile = {
      id: 'prof-ai-multi',
      caseId: 'case-ai-multi',
      name: 'Maria Thompson',
      livesAlone: true,
      mobilityConstraint: true,
      stairsConstraint: true,
      immediateSafetyConcern: false,
      ownsHome: true,
    };

    await planningEngine.generatePlan(caseData, profile, []);

    const response = await aiOrchestrator.processUserIntent('case-ai-multi', 'update the budget to 5,000 and re-assign packing to James');
    
    // Should execute BOTH budget update and assign_task to James!
    expect(response.toolResults.length).toBeGreaterThanOrEqual(2);
    
    const updatedCase = await repository.getCaseById('case-ai-multi');
    expect(updatedCase?.budget).toBe(5000);

    const members = await repository.getCaseMembers('case-ai-multi');
    const james = members.find((m) => m.name === 'James');
    expect(james).toBeDefined();

    const tasks = await repository.getTasksByCaseId('case-ai-multi');
    const packingTask = tasks.find((t) => t.templateId === 'inventory-belongings' || t.title.toLowerCase().includes('inventory'));
    expect(packingTask?.assigneeId).toBe(james?.id);
  });
});
