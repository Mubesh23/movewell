import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { planningEngine } from '../services/planning-engine';
import { aiOrchestrator, ChatMessageTurn } from '../services/ai-orchestrator';
import { repository } from '../db/repository';
import { taskService } from '../services/task-service';
import { resourceService } from '../services/resource-service';
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

          if (lastText.includes('The social worker confirmed rehab. Mark that complete.')) {
            return {
              text: 'Updating destination to short-term rehab and completing discharge task.',
              functionCalls: [
                {
                  name: 'update_case_context',
                  args: { destinationStatus: 'REHAB_FIRST' },
                },
                {
                  name: 'complete_task',
                  args: { taskTitleQuery: 'discharge', note: 'Social worker confirmed rehab' },
                },
              ],
            };
          }

          if (lastText.includes('Maybe rehab would be better.')) {
            return {
              text: 'Rehab can be a helpful step. Have you discussed this option with the hospital social worker yet?',
              functionCalls: [],
            };
          }

          if (lastText.includes('Where is Maria going after discharge?')) {
            const sysInst = params?.config?.systemInstruction || '';
            const isRehabConfirmed = sysInst.includes('REHAB_FIRST') || sysInst.includes('Confirmed Short-Term Rehab First');
            return {
              text: isRehabConfirmed
                ? 'Maria is expected to transfer to short-term rehab after discharge.'
                : 'The discharge destination is currently undecided.',
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

  it('should update structured state (destinationStatus = REHAB_FIRST) and complete task when confirmed', async () => {
    const caseData: TransitionCase = {
      id: 'case-confirm-rehab',
      transitionType: 'POST_HOSPITAL',
      urgency: 'URGENT',
      zipCode: '77004',
      budget: 8000,
      destinationStatus: 'UNDECIDED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const profile: SeniorProfile = {
      id: 'prof-cr',
      caseId: 'case-confirm-rehab',
      name: 'Maria Thompson',
      livesAlone: true,
      mobilityConstraint: true,
      stairsConstraint: true,
      immediateSafetyConcern: false,
      ownsHome: true,
    };

    await planningEngine.generatePlan(caseData, profile, []);

    const messages: ChatMessageTurn[] = [
      { role: 'user', text: 'The social worker confirmed rehab. Mark that complete.' },
    ];

    const response = await aiOrchestrator.processConversation('case-confirm-rehab', messages);

    expect(response.toolResults.length).toBeGreaterThanOrEqual(1);
    const destTool = response.toolResults.find(
      (r) => r.toolName === 'confirm_discharge_destination' || r.toolName === 'update_case_context'
    );

    expect(destTool?.success).toBe(true);

    // Verify structured case state is updated in repository
    const updatedCase = await repository.getCaseById('case-confirm-rehab');
    expect(updatedCase?.destinationStatus).toBe('REHAB_FIRST');

    // Verify task completion
    const tasks = await repository.getTasksByCaseId('case-confirm-rehab');
    const dischargeTask = tasks.find((t) => t.templateId === 'confirm-discharge-destination');
    expect(dischargeTask?.status).toBe('COMPLETED');

    // Verify case event recorded
    const events = await repository.getCaseEvents('case-confirm-rehab');
    const destEvent = events.find((e) => e.payload?.destinationStatus === 'REHAB_FIRST');
    expect(destEvent).toBeDefined();
  });

  it('should NOT mutate case state on hypothetical discussion ("Maybe rehab would be better")', async () => {
    const caseData: TransitionCase = {
      id: 'case-hypothetical',
      transitionType: 'POST_HOSPITAL',
      urgency: 'URGENT',
      zipCode: '77004',
      budget: 8000,
      destinationStatus: 'UNDECIDED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const profile: SeniorProfile = {
      id: 'prof-hypo',
      caseId: 'case-hypothetical',
      name: 'Maria Thompson',
      livesAlone: true,
      mobilityConstraint: false,
      stairsConstraint: false,
      immediateSafetyConcern: false,
      ownsHome: true,
    };

    await planningEngine.generatePlan(caseData, profile, []);

    const messages: ChatMessageTurn[] = [{ role: 'user', text: 'Maybe rehab would be better.' }];
    const response = await aiOrchestrator.processConversation('case-hypothetical', messages);

    expect(response.toolResults).toHaveLength(0);

    const checkCase = await repository.getCaseById('case-hypothetical');
    expect(checkCase?.destinationStatus).toBe('UNDECIDED');

    const tasks = await repository.getTasksByCaseId('case-hypothetical');
    const dischargeTask = tasks.find((t) => t.templateId === 'confirm-discharge-destination');
    expect(dischargeTask?.status).not.toBe('COMPLETED');
  });

  it('should answer questions using persisted structured case state even after conversation truncation', async () => {
    const caseData: TransitionCase = {
      id: 'case-truncation-test',
      transitionType: 'POST_HOSPITAL',
      urgency: 'URGENT',
      zipCode: '77004',
      budget: 8000,
      destinationStatus: 'REHAB_FIRST', // Already persisted in database truth!
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const profile: SeniorProfile = {
      id: 'prof-trunc',
      caseId: 'case-truncation-test',
      name: 'Maria Thompson',
      livesAlone: true,
      mobilityConstraint: true,
      stairsConstraint: true,
      immediateSafetyConcern: false,
      ownsHome: true,
    };

    await planningEngine.generatePlan(caseData, profile, []);

    // Simulate truncated conversation history where original confirmation turn is missing
    const truncatedMessages: ChatMessageTurn[] = [
      { role: 'user', text: 'Where is Maria going after discharge?' },
    ];

    const response = await aiOrchestrator.processConversation('case-truncation-test', truncatedMessages);

    expect(response.message).toContain('Maria is expected to transfer to short-term rehab after discharge');
  });

  it('should enforce moving-company category accuracy and exclude paratransit/transportation', async () => {
    const movingResources = await resourceService.findResources('moving', '77004');
    const names = movingResources.map((r) => r.name);

    expect(names.some((n) => n.includes('Senior Move Management') || n.includes('Movers'))).toBe(true);
    expect(names.some((n) => n.includes('METROLift'))).toBe(false);
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

    const tasks = await repository.getTasksByCaseId('case-fallback-test');
    const dischargeTask = tasks.find((t) => t.templateId === 'confirm-discharge-destination');
    expect(dischargeTask?.status).not.toBe('COMPLETED');
  });
});
