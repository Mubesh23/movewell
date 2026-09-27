import { GoogleGenAI, Type } from '@google/genai';
import { AI_TOOLS_REGISTRY, ToolExecutionResult } from '../ai/tools';
import { caseService } from './case-service';

export interface ChatMessageTurn {
  role: 'user' | 'assistant';
  text: string;
}

export interface AIResponse {
  message: string;
  toolResults: ToolExecutionResult[];
  suggestedNextAction?: string;
}

export class AIOrchestrator {
  public async processConversation(
    caseId: string,
    rawMessages?: ChatMessageTurn[],
    latestPrompt?: string
  ): Promise<AIResponse> {
    const apiKey = process.env.GEMINI_API_KEY;

    // Build normalized message list
    const messages: ChatMessageTurn[] = rawMessages ? [...rawMessages] : [];
    if (latestPrompt && (messages.length === 0 || messages[messages.length - 1].text !== latestPrompt)) {
      messages.push({ role: 'user', text: latestPrompt });
    }

    const promptText = latestPrompt || (messages.length > 0 ? messages[messages.length - 1].text : '');

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const overview = await caseService.getCaseOverview(caseId);

        const senior = overview?.seniorProfile;
        const caseData = overview?.caseData;
        const tasks = overview?.tasks || [];
        const members = overview?.members || [];

        const completedTasks = tasks.filter((t) => t.status === 'COMPLETED' || t.status === 'SKIPPED');
        const readyTasks = tasks.filter((t) => t.status === 'READY');
        const blockedTasks = tasks.filter((t) => t.status === 'BLOCKED');

        const urgentTask = overview?.urgentTask || readyTasks[0];

        const systemInstruction = `You are Nora, an empathetic senior transition coordinator for MoveWell.
You are helping coordinate a post-hospital senior transition plan.

=== ACTIVE CASE CONTEXT ===
- Senior Name: ${senior?.name || 'Senior'}
- Transition Type: ${caseData?.transitionType || 'POST_HOSPITAL'}
- Urgency Level: ${caseData?.urgency || 'URGENT'}
- Discharge Date: ${caseData?.dischargeDate || 'Not set'}
- Target Transition Date: ${caseData?.targetDate || 'Not set'}
- Destination Status: ${caseData?.destinationStatus || 'UNDECIDED'}
- Case Budget: $${caseData?.budget ? caseData.budget.toLocaleString() : '8,000'}
- Transition Progress: ${overview?.progressPercent || 0}% (${completedTasks.length}/${tasks.length} tasks completed)

=== CURRENT PRIORITY TASK ===
${
  urgentTask
    ? `- Title: "${urgentTask.title}"
  Phase: ${urgentTask.phase}
  Status: ${urgentTask.status}
  Assigned To: ${urgentTask.assignee ? urgentTask.assignee.name : 'Unassigned'}
  Why It Matters: Critical path item for safe hospital discharge.`
    : 'None'
}

=== READY TASKS (CAN BE WORKED ON NOW) ===
${
  readyTasks.length > 0
    ? readyTasks.map((t) => `- "${t.title}" (Phase: ${t.phase.replace('_', ' ')}, Assignee: ${t.assignee ? t.assignee.name : 'Unassigned'})`).join('\n')
    : 'None'
}

=== BLOCKED TASKS & DEPENDENCIES ===
${
  blockedTasks.length > 0
    ? blockedTasks
        .map(
          (t) =>
            `- "${t.title}" (Phase: ${t.phase.replace('_', ' ')}, Blocked by incomplete prerequisites: ${t.dependsOnTaskIds?.join(', ') || 'prior phase'})`
        )
        .join('\n')
    : 'None'
}

=== FAMILY MEMBERS & COLLABORATORS ===
${
  members.length > 0
    ? members.map((m) => `- ${m.name} (Role: ${m.role}, Relationship: ${m.relationship || 'Family/Helper'}, Local: ${m.isLocal ? 'Yes' : 'No'})`).join('\n')
    : 'None'
}

=== CRITICAL MUTATION & CONVERSATIONAL POLICIES ===
1. MUTATION TOOLS (complete_task, assign_task, update_case_context):
   - ONLY call mutation tools when the user explicitly instructs an action or clearly confirms a completed real-world action (e.g., "Set budget to $5,000", "Jennifer will handle packing", "Mark discharge complete", "The social worker confirmed rehab, mark that complete").
   - NEVER call mutation tools when the user is:
     - Asking why an action should happen ("Why would you mark that complete?", "Why is that important?")
     - Asking how to do something ("How do I confirm?", "What happens next?")
     - Questioning a suggestion ("Should I mark it complete?", "Would you mark it?")
     - Discussing hypothetically ("Maybe Jennifer could handle it", "What if I lower the budget?")
     - Saying not to do something ("Don't change anything yet", "Not yet")
   - For questions and hypotheticals, provide a direct, warm, conversational response WITHOUT invoking mutation tools.

2. READ-ONLY & SEARCH TOOLS (find_resources, get_plan):
   - Call find_resources when the user asks for local Houston resources, care options, movers, storage, housing, or support services.
   - Call get_plan when the user asks for a complete status summary or remaining task overview.

3. CONVERSATIONAL GROUNDING & REFERENCE RESOLUTION:
   - Use the conversation history to resolve pronouns and references ("confirm that", "assign it to Sarah", "can she do that instead?").
   - Answer follow-up questions concisely based on case context without dumping the full plan repeatedly unless requested.
   - Coordinate real-world progress empathetically.`;

        // Format conversation turns for Gemini API
        const geminiContents = messages.map((m) => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.text }],
        }));

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: geminiContents.length > 0 ? geminiContents : [{ role: 'user', parts: [{ text: promptText }] }],
          config: {
            systemInstruction,
            tools: [
              {
                functionDeclarations: [
                  {
                    name: 'update_case_context',
                    description: 'Update the case dollar budget limit or target dates. Call this tool ONLY when user explicitly asks to set, update, or change the budget limit.',
                    parameters: {
                      type: Type.OBJECT,
                      properties: {
                        budget: { type: Type.NUMBER, description: 'Updated dollar budget limit (e.g. 5000)' },
                      },
                      required: ['budget'],
                    },
                  },
                  {
                    name: 'assign_task',
                    description: 'Assign a task in the plan to a family member or helper. Call this tool ONLY when user explicitly requests or confirms an assignment.',
                    parameters: {
                      type: Type.OBJECT,
                      properties: {
                        assigneeName: { type: Type.STRING, description: 'Name of person to assign (e.g. Sarah, Jennifer)' },
                        taskTitleQuery: { type: Type.STRING, description: 'Query to match task title (e.g. pack, move, discharge, inventory)' },
                      },
                      required: ['assigneeName'],
                    },
                  },
                  {
                    name: 'find_resources',
                    description: 'Search for local verified senior transition services, Houston care options, housing, moving companies, storage, and community support resources.',
                    parameters: {
                      type: Type.OBJECT,
                      properties: {
                        category: { type: Type.STRING, description: 'Category: moving, storage, senior_move_management, donation, or ALL' },
                        zipCode: { type: Type.STRING, description: 'Local 5-digit ZIP code' },
                      },
                    },
                  },
                  {
                    name: 'complete_task',
                    description: 'Mark a specific transition task as completed by title query or ID with optional completion notes. ONLY call when user explicitly confirms completion or orders task completion in reality.',
                    parameters: {
                      type: Type.OBJECT,
                      properties: {
                        taskTitleQuery: { type: Type.STRING, description: 'Task title or keyword to mark complete (e.g. discharge destination, pack, move, housing)' },
                        taskId: { type: Type.STRING, description: 'Optional ID of the task to mark completed' },
                        note: { type: Type.STRING, description: 'Optional completion note or record of what was done (e.g. "Spoke with social worker")' },
                      },
                    },
                  },
                  {
                    name: 'get_plan',
                    description: 'Fetch the full active transition plan summary and remaining tasks.',
                    parameters: {
                      type: Type.OBJECT,
                      properties: {},
                    },
                  },
                ],
              },
            ],
          },
        });

        const toolResults: ToolExecutionResult[] = [];
        const functionCalls = response.functionCalls;

        if (functionCalls && functionCalls.length > 0) {
          for (const call of functionCalls) {
            const args = (call.args || {}) as Record<string, any>;
            if (call.name === 'update_case_context') {
              const rawBudget = args.budget ?? args.amount ?? args.value;
              let parsedBudget: number | undefined = undefined;
              if (typeof rawBudget === 'number') {
                parsedBudget = rawBudget;
              } else if (typeof rawBudget === 'string') {
                parsedBudget = parseInt(rawBudget.replace(/[^0-9]/g, ''), 10);
              }
              if (parsedBudget !== undefined && !isNaN(parsedBudget) && parsedBudget > 0) {
                toolResults.push(await AI_TOOLS_REGISTRY.update_case_context({ caseId, budget: parsedBudget }));
              }
            } else if (call.name === 'assign_task' && args.assigneeName) {
              toolResults.push(
                await AI_TOOLS_REGISTRY.assign_task({
                  caseId,
                  assigneeName: args.assigneeName,
                  taskTitleQuery: args.taskTitleQuery || args.taskTitle || args.task || 'task',
                })
              );
            } else if (call.name === 'find_resources') {
              toolResults.push(
                await AI_TOOLS_REGISTRY.find_resources({
                  category: args.category || 'ALL',
                  zipCode: args.zipCode || overview?.caseData.zipCode || '77004',
                })
              );
            } else if (call.name === 'complete_task') {
              toolResults.push(
                await AI_TOOLS_REGISTRY.complete_task({
                  caseId,
                  taskId: args.taskId,
                  taskTitleQuery: args.taskTitleQuery || args.taskTitle || args.task,
                  note: args.note || args.completionNotes,
                })
              );
            } else if (call.name === 'get_plan') {
              toolResults.push(await AI_TOOLS_REGISTRY.get_plan({ caseId }));
            }
          }
        }

        let textResponse = response.text || '';

        // Pass 2 Gemini grounded synthesis loop when tools returned results
        if (toolResults.length > 0) {
          try {
            const secondPassResponse = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: [
                ...geminiContents,
                {
                  role: 'user',
                  parts: [
                    {
                      text: `Tool Execution Results:\n${toolResults
                        .map((tr) => `[Tool: ${tr.toolName}, Success: ${tr.success}]\n${tr.message}`)
                        .join('\n\n')}\n\nInstruction: Using the conversation history and tool results above, synthesize an empathetic, clear, markdown-formatted response for the user. Highlight key details like resource names, verification status, contact numbers, or updated plan status. End with a context-aware next step recommendation.`,
                    },
                  ],
                },
              ],
              config: { systemInstruction },
            });

            if (secondPassResponse.text) {
              textResponse = secondPassResponse.text;
            }
          } catch (pass2Err) {
            console.warn('Gemini Pass 2 synthesis failed, falling back to tool result text:', pass2Err);
          }

          if (!textResponse) {
            textResponse = toolResults.map((tr) => tr.message).join('\n\n');
          }
        }

        if (textResponse || toolResults.length > 0) {
          return {
            message: textResponse || 'Plan updated successfully.',
            toolResults,
            suggestedNextAction: `Focus on ${overview?.urgentTask?.title || 'next plan priority'}.`,
          };
        }
      } catch (err: any) {
        console.warn(`[AIOrchestrator] Gemini API call failed (${err?.message || err}). Falling back to safe non-mutating fallback.`);
      }
    }

    // Safe, non-mutating fallback strictly used when GEMINI_API_KEY is absent or API call fails
    return this.processUserIntentLocal(caseId, promptText);
  }

  public async processUserIntent(caseId: string, prompt: string): Promise<AIResponse> {
    return this.processConversation(caseId, [{ role: 'user', text: prompt }], prompt);
  }

  public async processUserIntentLocal(caseId: string, prompt?: string): Promise<AIResponse> {
    return {
      message:
        "I'm having trouble processing conversational requests right now. Your plan has not been changed. You can still manage tasks, family members, budget, and resources directly from MoveWell.",
      toolResults: [],
      suggestedNextAction: 'Review your transition plan tasks directly from the dashboard.',
    };
  }
}

export const aiOrchestrator = new AIOrchestrator();
