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

  it('should respond with structured plan summary when asked "what is left to do?"', async () => {
    const caseData: TransitionCase = {
      id: 'case-ai-query',
      transitionType: 'POST_HOSPITAL',
      urgency: 'URGENT',
      zipCode: '77004',
      budget: 8000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const profile: SeniorProfile = {
      id: 'prof-ai-query',
      caseId: 'case-ai-query',
      name: 'Maria Thompson',
      livesAlone: true,
      mobilityConstraint: true,
      stairsConstraint: true,
      immediateSafetyConcern: false,
      ownsHome: true,
    };

    await planningEngine.generatePlan(caseData, profile, []);

    const response = await aiOrchestrator.processUserIntent('case-ai-query', 'what is left to do?');

    expect(response.message).toContain('Maria Thompson');
    expect(response.message).toContain('Remaining Tasks');
    expect(response.toolResults.length).toBeGreaterThan(0);
  });

  it('should complete task by title query without requiring raw database taskId', async () => {
    const caseData: TransitionCase = {
      id: 'case-ai-complete-query',
      transitionType: 'POST_HOSPITAL',
      urgency: 'URGENT',
      zipCode: '77004',
      budget: 8000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const profile: SeniorProfile = {
      id: 'prof-ai-cq',
      caseId: 'case-ai-complete-query',
      name: 'Maria Thompson',
      livesAlone: true,
      mobilityConstraint: false,
      stairsConstraint: false,
      immediateSafetyConcern: false,
      ownsHome: true,
    };

    await planningEngine.generatePlan(caseData, profile, []);

    const response = await aiOrchestrator.processUserIntent(
      'case-ai-complete-query',
      'Mark confirm safe discharge destination complete. Spoke with social worker.'
    );

    expect(response.toolResults[0].success).toBe(true);
    expect(response.toolResults[0].message).toContain('Confirm');

    const tasks = await repository.getTasksByCaseId('case-ai-complete-query');
    const dischargeTask = tasks.find((t) => t.templateId === 'confirm-discharge-destination');
    expect(dischargeTask?.status).toBe('COMPLETED');
  });

  it('should not create member side-effect if assign_task target task is not found', async () => {
    const caseData: TransitionCase = {
      id: 'case-ai-no-sideeffect',
      transitionType: 'POST_HOSPITAL',
      urgency: 'URGENT',
      zipCode: '77004',
      budget: 8000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const profile: SeniorProfile = {
      id: 'prof-ai-ns',
      caseId: 'case-ai-no-sideeffect',
      name: 'Maria Thompson',
      livesAlone: true,
      mobilityConstraint: false,
      stairsConstraint: false,
      immediateSafetyConcern: false,
      ownsHome: true,
    };

    await planningEngine.generatePlan(caseData, profile, []);

    const initialMembers = await repository.getCaseMembers('case-ai-no-sideeffect');

    const response = await aiOrchestrator.processUserIntent(
      'case-ai-no-sideeffect',
      'Assign non-existent astronaut flying task to Bob'
    );

    const finalMembers = await repository.getCaseMembers('case-ai-no-sideeffect');
    expect(finalMembers.length).toBe(initialMembers.length);
    expect(finalMembers.find((m) => m.name === 'Bob')).toBeUndefined();
  });

  it('should return failure and change zero task statuses when completing a non-existent task', async () => {
    const caseData: TransitionCase = {
      id: 'case-ai-strict-complete',
      transitionType: 'POST_HOSPITAL',
      urgency: 'URGENT',
      zipCode: '77004',
      budget: 8000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const profile: SeniorProfile = {
      id: 'prof-ai-sc',
      caseId: 'case-ai-strict-complete',
      name: 'Maria Thompson',
      livesAlone: true,
      mobilityConstraint: false,
      stairsConstraint: false,
      immediateSafetyConcern: false,
      ownsHome: true,
    };

    await planningEngine.generatePlan(caseData, profile, []);

    const initialTasks = await repository.getTasksByCaseId('case-ai-strict-complete');
    const initialCompletedCount = initialTasks.filter((t) => t.status === 'COMPLETED').length;

    const response = await aiOrchestrator.processUserIntent(
      'case-ai-strict-complete',
      'Complete the astronaut paperwork task'
    );

    expect(response.toolResults[0].success).toBe(false);
    expect(response.toolResults[0].message).toContain('Could not find a task matching');

    const finalTasks = await repository.getTasksByCaseId('case-ai-strict-complete');
    const finalCompletedCount = finalTasks.filter((t) => t.status === 'COMPLETED').length;
    expect(finalCompletedCount).toBe(initialCompletedCount);
  });

  it('should search resources when user types natural search prompt like "search houstn care options"', async () => {
    const caseData: TransitionCase = {
      id: 'case-ai-resources',
      transitionType: 'POST_HOSPITAL',
      urgency: 'URGENT',
      zipCode: '77004',
      budget: 8000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const profile: SeniorProfile = {
      id: 'prof-ai-res',
      caseId: 'case-ai-resources',
      name: 'Maria Thompson',
      livesAlone: true,
      mobilityConstraint: false,
      stairsConstraint: false,
      immediateSafetyConcern: false,
      ownsHome: true,
    };

    await planningEngine.generatePlan(caseData, profile, []);

    const response = await aiOrchestrator.processUserIntent(
      'case-ai-resources',
      'search houstn care options'
    );

    expect(response.toolResults.length).toBeGreaterThan(0);
    expect(response.toolResults[0].toolName).toBe('find_resources');
    expect(response.toolResults[0].success).toBe(true);
    expect(response.message).toContain('Verified Houston Care & Transition Resources');
  });
});
