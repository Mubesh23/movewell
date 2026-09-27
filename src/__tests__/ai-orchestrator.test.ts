import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { planningEngine } from '../services/planning-engine';
import { aiOrchestrator, ChatMessageTurn } from '../services/ai-orchestrator';
import { repository } from '../db/repository';
import { taskService } from '../services/task-service';
import { TransitionCase, SeniorProfile, CaseMember } from '../types';

vi.mock('@google/genai', () => {
  return {
    Type: {
      OBJECT: 'OBJECT',
      STRING: 'STRING',
      NUMBER: 'NUMBER',
    },
    GoogleGenAI: vi.fn().mockImplementation(() => ({
      models: {
        generateContent: vi.fn().mockImplementation(async (params: any) => {
          const contents = params.contents || [];
          const lastTurn = contents[contents.length - 1];
          const lastText = lastTurn?.parts?.[0]?.text || '';

          if (lastText.includes('How do I confirm?')) {
            return {
              text: "To confirm Maria's safe discharge destination, speak directly with the hospital discharge planner or social worker to verify whether short-term rehab or returning home with care is selected.",
              functionCalls: [],
            };
          }

          if (lastText.includes('Can Sarah do that instead?')) {
            return {
              text: 'Re-assigning inventory belongings to Sarah.',
              functionCalls: [
                {
                  name: 'assign_task',
                  args: { assigneeName: 'Sarah', taskTitleQuery: 'inventory' },
                },
              ],
            };
          }

          if (lastText.includes('Should I mark the discharge task complete?')) {
            return {
              text: "No need to mark it complete yet unless you've spoken with the hospital team. Once confirmed, let me know!",
              functionCalls: [],
            };
          }

          if (lastText.includes('Mark it complete')) {
            return {
              text: 'Marking discharge destination as complete.',
              functionCalls: [
                {
                  name: 'complete_task',
                  args: { taskTitleQuery: 'discharge', note: 'Social worker confirmed rehab' },
                },
              ],
            };
          }

          return {
            text: "I'm here to help coordinate Maria's transition plan.",
            functionCalls: [],
          };
        }),
      },
    })),
  };
});

describe('AI Orchestrator Multi-Turn & Integrity', () => {
  const originalEnvKey = process.env.GEMINI_API_KEY;

  beforeEach(async () => {
    await repository.resetAll();
    process.env.GEMINI_API_KEY = 'test-mock-key';
  });

  afterEach(() => {
    process.env.GEMINI_API_KEY = originalEnvKey;
  });

  it('should answer context follow-up questions without mutating or blindly dumping plan', async () => {
    const caseData: TransitionCase = {
      id: 'case-multi-followup',
      transitionType: 'POST_HOSPITAL',
      urgency: 'URGENT',
      zipCode: '77004',
      budget: 8000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const profile: SeniorProfile = {
      id: 'prof-mf',
      caseId: 'case-multi-followup',
      name: 'Maria Thompson',
      livesAlone: true,
      mobilityConstraint: true,
      stairsConstraint: true,
      immediateSafetyConcern: false,
      ownsHome: true,
    };

    await planningEngine.generatePlan(caseData, profile, []);

    const messages: ChatMessageTurn[] = [
      { role: 'user', text: "What's left to do?" },
      { role: 'assistant', text: "Your top priority is confirming Maria's safe discharge destination..." },
      { role: 'user', text: 'How do I confirm?' },
    ];

    const response = await aiOrchestrator.processConversation('case-multi-followup', messages);

    expect(response.message).toContain('hospital discharge planner or social worker');
    expect(response.toolResults).toHaveLength(0);
  });

  it('should resolve pronoun references ("that") using conversation history', async () => {
    const caseData: TransitionCase = {
      id: 'case-multi-pronoun',
      transitionType: 'POST_HOSPITAL',
      urgency: 'URGENT',
      zipCode: '77004',
      budget: 8000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const profile: SeniorProfile = {
      id: 'prof-mp',
      caseId: 'case-multi-pronoun',
      name: 'Maria Thompson',
      livesAlone: true,
      mobilityConstraint: true,
      stairsConstraint: true,
      immediateSafetyConcern: false,
      ownsHome: true,
    };

    const members: CaseMember[] = [
      { id: 'mem-sarah-p', caseId: 'case-multi-pronoun', name: 'Sarah', isLocal: false, role: 'OWNER' },
      { id: 'mem-jennifer-p', caseId: 'case-multi-pronoun', name: 'Jennifer', isLocal: true, role: 'FAMILY' },
    ];

    await planningEngine.generatePlan(caseData, profile, members);

    const messages: ChatMessageTurn[] = [
      { role: 'user', text: 'Who is handling inventory?' },
      { role: 'assistant', text: 'Jennifer is assigned to inventory belongings.' },
      { role: 'user', text: 'Can Sarah do that instead?' },
    ];

    const response = await aiOrchestrator.processConversation('case-multi-pronoun', messages);

    expect(response.toolResults.length).toBeGreaterThan(0);
    expect(response.toolResults[0].toolName).toBe('assign_task');

    const tasks = await repository.getTasksByCaseId('case-multi-pronoun');
    const inventoryTask = tasks.find((t) => t.templateId === 'inventory-belongings');
    expect(inventoryTask?.assigneeId).toBe('mem-sarah-p');
  });

  it('should NOT mutate on questions, but mutate when explicitly confirmed', async () => {
    const caseData: TransitionCase = {
      id: 'case-multi-safety',
      transitionType: 'POST_HOSPITAL',
      urgency: 'URGENT',
      zipCode: '77004',
      budget: 8000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const profile: SeniorProfile = {
      id: 'prof-ms',
      caseId: 'case-multi-safety',
      name: 'Maria Thompson',
      livesAlone: true,
      mobilityConstraint: false,
      stairsConstraint: false,
      immediateSafetyConcern: false,
      ownsHome: true,
    };

    await planningEngine.generatePlan(caseData, profile, []);

    // 1. Question turn -> No mutation
    const qMessages: ChatMessageTurn[] = [{ role: 'user', text: 'Should I mark the discharge task complete?' }];
    const qResponse = await aiOrchestrator.processConversation('case-multi-safety', qMessages);
    expect(qResponse.toolResults).toHaveLength(0);

    const tasksBefore = await repository.getTasksByCaseId('case-multi-safety');
    const dischargeBefore = tasksBefore.find((t) => t.templateId === 'confirm-discharge-destination');
    expect(dischargeBefore?.status).not.toBe('COMPLETED');

    // 2. Confirmation turn -> Execute mutation
    const cMessages: ChatMessageTurn[] = [
      ...qMessages,
      { role: 'assistant', text: qResponse.message },
      { role: 'user', text: 'The social worker confirmed rehab. Mark it complete.' },
    ];
    const cResponse = await aiOrchestrator.processConversation('case-multi-safety', cMessages);
    expect(cResponse.toolResults.length).toBeGreaterThan(0);
    expect(cResponse.toolResults[0].toolName).toBe('complete_task');

    const tasksAfter = await repository.getTasksByCaseId('case-multi-safety');
    const dischargeAfter = tasksAfter.find((t) => t.templateId === 'confirm-discharge-destination');
    expect(dischargeAfter?.status).toBe('COMPLETED');
  });

  it('should return safe non-mutating message when Gemini is unavailable', async () => {
    process.env.GEMINI_API_KEY = ''; // Disable API key

    const caseData: TransitionCase = {
      id: 'case-fallback-test',
      transitionType: 'POST_HOSPITAL',
      urgency: 'URGENT',
      zipCode: '77004',
      budget: 8000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const profile: SeniorProfile = {
      id: 'prof-fb',
      caseId: 'case-fallback-test',
      name: 'Maria Thompson',
      livesAlone: true,
      mobilityConstraint: false,
      stairsConstraint: false,
      immediateSafetyConcern: false,
      ownsHome: true,
    };

    await planningEngine.generatePlan(caseData, profile, []);

    const response = await aiOrchestrator.processConversation('case-fallback-test', [
      { role: 'user', text: 'mark discharge complete' },
    ]);

    expect(response.message).toContain("I'm having trouble processing conversational requests right now");
    expect(response.message).toContain('Your plan has not been changed');
    expect(response.toolResults).toHaveLength(0);

    // Verify ZERO tasks were mutated
    const tasks = await repository.getTasksByCaseId('case-fallback-test');
    const dischargeTask = tasks.find((t) => t.templateId === 'confirm-discharge-destination');
    expect(dischargeTask?.status).not.toBe('COMPLETED');
  });

  it('should throw error when assigning a member from a different case', async () => {
    const case1: TransitionCase = {
      id: 'case-assign-1',
      transitionType: 'POST_HOSPITAL',
      urgency: 'URGENT',
      zipCode: '77004',
      budget: 8000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const case2: TransitionCase = {
      id: 'case-assign-2',
      transitionType: 'POST_HOSPITAL',
      urgency: 'URGENT',
      zipCode: '77004',
      budget: 8000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const profile: SeniorProfile = {
      id: 'prof-a',
      caseId: 'case-assign-1',
      name: 'Maria Thompson',
      livesAlone: true,
      mobilityConstraint: false,
      stairsConstraint: false,
      immediateSafetyConcern: false,
      ownsHome: true,
    };

    const case2Members: CaseMember[] = [
      { id: 'mem-case2-bob', caseId: 'case-assign-2', name: 'Bob', isLocal: true, role: 'FAMILY' },
    ];

    await planningEngine.generatePlan(case1, profile, []);
    await planningEngine.generatePlan(case2, profile, case2Members);

    const tasks1 = await repository.getTasksByCaseId('case-assign-1');
    const members2 = await repository.getCaseMembers('case-assign-2');

    expect(members2.length).toBeGreaterThan(0);

    // Attempting to assign case 2 member to case 1 task must fail!
    await expect(
      taskService.assignTask(tasks1[0].id, members2[0].id, members2[0].name)
    ).rejects.toThrow('does not belong to case');
  });
});
