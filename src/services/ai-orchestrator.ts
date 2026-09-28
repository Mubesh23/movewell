import { GoogleGenAI, Type } from '@google/genai';
import { AI_TOOLS_REGISTRY, ToolExecutionResult } from '../ai/tools';
import { caseService } from './case-service';
import { BRAND_NAME } from '../lib/brand';

export interface ChatMessageTurn {
  role: 'user' | 'assistant';
  text: string;
}

export interface AIResponse {
  message: string;
  toolResults: ToolExecutionResult[];
  suggestedNextAction?: string;
}

export interface ProcessConversationOptions {
  context?: {
    surface?: string;
    taskId?: string;
    resourceCategory?: string;
    resourceId?: string;
    costCategory?: string;
    [key: string]: any;
  };
  actorName?: string;
  userId?: string;
}

export class AIOrchestrator {
  public async processConversation(
    caseId: string,
    rawMessages?: ChatMessageTurn[],
    latestPrompt?: string,
    options?: ProcessConversationOptions
  ): Promise<AIResponse> {
    const apiKey = process.env.GEMINI_API_KEY;

    // Build normalized message list
    const messages: ChatMessageTurn[] = rawMessages ? [...rawMessages] : [];
    if (latestPrompt && (messages.length === 0 || messages[messages.length - 1].text !== latestPrompt)) {
      messages.push({ role: 'user', text: latestPrompt });
    }

    const promptText = latestPrompt || (messages.length > 0 ? messages[messages.length - 1].text : '');
    const effectiveActor = options?.actorName || 'Family Coordinator';

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

        const destStatusLabel =
          caseData?.destinationStatus === 'REHAB_FIRST'
            ? 'Confirmed Short-Term Rehab First'
            : caseData?.destinationStatus === 'RETURN_HOME'
            ? 'Confirmed Return Home'
            : caseData?.destinationStatus === 'KNOWN'
            ? 'Confirmed Destination Known'
            : caseData?.destinationStatus || 'UNDECIDED';

        const taskTitleById = new Map(tasks.map((t) => [t.id, t.title]));
        const formatPrereqs = (prereqIds?: string[]) => {
          if (!prereqIds || prereqIds.length === 0) return 'prior phase';
          return prereqIds.map((id) => `"${taskTitleById.get(id) || id}"`).join(', ');
        };

        const contextBlock = options?.context
          ? `\n=== ACTIVE PAGE CONTEXT (USER IS CURRENTLY VIEWING) ===
- Current Surface / Tab: ${options.context.surface || 'General Workspace'}
${options.context.taskId ? `- Selected Task ID: ${options.context.taskId}` : ''}
${options.context.costCategory ? `- Selected Cost Category: ${options.context.costCategory}` : ''}
${options.context.resourceCategory ? `- Selected Resource Category: ${options.context.resourceCategory}` : ''}\n`
          : '';

        const systemInstruction = `You are Nora, an empathetic senior transition coordinator for ${BRAND_NAME}.
You are helping coordinate a post-hospital senior transition plan.
${contextBlock}
=== ACTIVE CASE CONTEXT ===
- Senior Name: ${senior?.name || 'Senior'}
- Transition Type: ${caseData?.transitionType || 'POST_HOSPITAL'}
- Urgency Level: ${caseData?.urgency || 'URGENT'}
- Discharge Date: ${caseData?.dischargeDate || 'Not set'}
- Target Transition Date: ${caseData?.targetDate || 'Not set'}
- Confirmed Discharge Destination: ${destStatusLabel}
- Case Budget: ${caseData?.budget ? `$${caseData.budget.toLocaleString()}` : 'Open / not set'}
- Transition Progress: ${overview?.progressPercent || 0}% (${completedTasks.length}/${tasks.length} tasks completed)

=== CURRENT PRIORITY TASK ===
${
  urgentTask
    ? `- Title: "${urgentTask.title}"
  Phase: ${urgentTask.phase}
  Status: ${urgentTask.status}
  Assigned To: ${urgentTask.assignee ? urgentTask.assignee.name : 'Unassigned'}
  Why It Matters: ${urgentTask.whyItMatters || urgentTask.description || 'Critical path item for safe hospital discharge.'}`
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
            `- "${t.title}" (Phase: ${t.phase.replace('_', ' ')}, Blocked by incomplete prerequisites: ${formatPrereqs(t.dependsOnTaskIds)})`
        )
        .join('\n')
    : 'None'
}

=== COST & QUOTE INFORMATION ===
- Family Available Budget: ${caseData?.budget ? `$${caseData.budget.toLocaleString()}` : 'Open / not set'}
- Planning Estimate Range: $${overview?.costSummary?.minTotal.toLocaleString() || '0'} - $${overview?.costSummary?.maxTotal.toLocaleString() || '0'}
- Confirmed Vendor Quotes Total: $${overview?.costSummary?.confirmedQuotesTotal ? overview.costSummary.confirmedQuotesTotal.toLocaleString() : '0 (None applied yet)'}
${
  overview?.costItems && overview.costItems.length > 0
    ? 'Confirmed Quotes on File:\n' +
      overview.costItems
        .map((ci) => `  • ${ci.providerName || 'Vendor'}: $${ci.amount?.toLocaleString()} (${ci.category}${ci.documentName ? `, Doc: ${ci.documentName}` : ''})`)
        .join('\n')
    : 'No vendor quotes applied to plan yet.'
}

=== FAMILY MEMBERS & COLLABORATORS ===
${
  members.length > 0
    ? members.map((m) => `- ${m.name} (Role: ${m.role}, Relationship: ${m.relationship || 'Family/Helper'}, Local: ${m.isLocal === true ? 'Yes' : m.isLocal === false ? 'No' : 'Unknown'})`).join('\n')
    : 'None'
}

=== CRITICAL MUTATION & CONVERSATIONAL POLICIES ===
1. MUTATION TOOLS (complete_task, assign_task, update_case_context):
   - ONLY call mutation tools when the user explicitly instructs an action or clearly confirms a completed real-world action (e.g., "Set budget to $5,000", "Jennifer will handle packing", "Mark discharge complete", "The social worker confirmed rehab, mark that complete").
   - Update destinationStatus (via update_case_context to REHAB_FIRST or RETURN_HOME) ONLY when the user explicitly confirms a real-world decision ("The social worker confirmed she is going to short-term rehab").
   - NEVER call mutation tools when the user is:
     - Discussing hypothetically ("The doctor thinks rehab might be better", "Maybe rehab would be better", "What if I lower the budget?")
     - Asking why an action should happen ("Why would you mark that complete?", "Why is that important?")
     - Asking how to do something ("How do I confirm?", "What happens next?")
     - Questioning a suggestion ("Should I mark it complete?", "Would you mark it?")
     - Saying not to do something ("Don't change anything yet", "Not yet")
   - For questions and hypotheticals, provide a direct, warm, conversational response WITHOUT invoking mutation tools.

2. READ-ONLY & SEARCH TOOLS (find_resources, get_plan, explain_cost_estimate):
   - Call find_resources when the user asks for local resources, care options, movers, storage, housing, or support services.
   - Call get_plan when the user asks for a complete status summary or remaining task overview.

3. CONVERSATIONAL GROUNDING & FACTUAL DISCIPLINE:
   - Treat structured case context (Destination Status, Budget, Tasks, Cost & Quotes) as authoritative product truth. When asked about case state (e.g. "Where is Maria going after discharge?"), answer based on structured Destination Status ("${destStatusLabel}").
   - Distinguish between Family Available Budget and Vendor Quotes: A vendor quote (e.g. moving quote of $2,150) is an expense item for a service, NOT the family's total available transition budget (${caseData?.budget ? `$${caseData.budget.toLocaleString()}` : 'Open / not set'}). Never overwrite or confuse total family budget with an individual vendor quote.
   - NEVER invent or fabricate verification, certification, NASMM membership, partnership, phone numbers, addresses, prices, or service offerings beyond what tool results or structured case state contain.
   - NEVER use terms like "partner", "${BRAND_NAME} partner", "our providers", or "certified" unless explicitly present in tool verification data. Use neutral terms ("resource", "provider", "directory listing", "verified listing", "local service").
   - Frame operational advice (how to talk with hospital staff) as general guidance ("A common next step is...", "You may want to ask..."). Do not present general advice as hospital-specific facts unless specified in case state.`;

        // Format conversation turns for Gemini API
        const geminiContents = messages.map((m) => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.text }],
        }));

        const response = await generateContentWithRetry(ai, {
          model: 'gemini-flash-latest',
          contents: geminiContents.length > 0 ? geminiContents : [{ role: 'user', parts: [{ text: promptText }] }],
          config: {
            systemInstruction,
            tools: [
              {
                functionDeclarations: [
                  {
                    name: 'update_case_context',
                    description: 'Update the case dollar budget limit, target dates, or confirmed discharge destination status (REHAB_FIRST, RETURN_HOME, KNOWN, UNKNOWN, UNDECIDED). Call this tool ONLY when user explicitly asks to update budget/dates or clearly confirms a real-world discharge decision (e.g. "social worker confirmed rehab" -> REHAB_FIRST). DO NOT call for hypotheticals.',
                    parameters: {
                      type: Type.OBJECT,
                      properties: {
                        budget: { type: Type.NUMBER, description: 'Updated dollar budget limit (e.g. 5000)' },
                        targetDate: { type: Type.STRING, description: 'Updated target date YYYY-MM-DD' },
                        dischargeDate: { type: Type.STRING, description: 'Updated discharge date YYYY-MM-DD' },
                        destinationStatus: {
                          type: Type.STRING,
                          description: 'Confirmed discharge destination: REHAB_FIRST, RETURN_HOME, KNOWN, UNKNOWN, or UNDECIDED',
                        },
                      },
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
                    description: `Search for local senior transition services, Houston care options, housing, moving companies, storage, and community support resources in the ${BRAND_NAME} directory.`,
                    parameters: {
                      type: Type.OBJECT,
                      properties: {
                        category: { type: Type.STRING, description: 'Category: moving, storage, senior_move_management, donation, home_modification, transportation, or ALL' },
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
                    name: 'confirm_discharge_destination',
                    description: 'Confirm senior discharge destination (e.g. REHAB_FIRST or RETURN_HOME) and mark discharge decision complete in one deterministic action. Call when social worker, doctor, or family confirms rehab vs home placement.',
                    parameters: {
                      type: Type.OBJECT,
                      properties: {
                        destination: {
                          type: Type.STRING,
                          description: 'REHAB_FIRST or RETURN_HOME',
                        },
                        note: {
                          type: Type.STRING,
                          description: 'Optional confirmation note or context (e.g. "Social worker confirmed rehab first")',
                        },
                      },
                      required: ['destination'],
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
                  {
                    name: 'explain_cost_estimate',
                    description:
                      'Explain where a transition cost planning estimate comes from, citing real published external rate sheets, public tariffs, or agency benchmarks for Houston/Texas. Use when user asks why an estimate is high, where a cost came from, how recent the data is, or what sources are used.',
                    parameters: {
                      type: Type.OBJECT,
                      properties: {
                        category: {
                          type: Type.STRING,
                          description:
                            'Cost category to explain: moving, packing, home_modification, transportation, or donation',
                        },
                      },
                      required: ['category'],
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
              const rawBudget =
                args.budget ??
                args.amount ??
                args.value ??
                args.new_budget ??
                args.budget_limit ??
                Object.values(args).find((v) => typeof v === 'number' || (typeof v === 'string' && /[0-9]/.test(v)));

              let parsedBudget: number | undefined = undefined;
              if (typeof rawBudget === 'number') {
                parsedBudget = rawBudget;
              } else if (typeof rawBudget === 'string') {
                parsedBudget = parseInt(rawBudget.replace(/[^0-9]/g, ''), 10);
              }
              if (isNaN(parsedBudget as number)) parsedBudget = undefined;

              const rawDest = args.destinationStatus || args.destination_status || args.destination;
              let parsedDest: ('KNOWN' | 'UNKNOWN' | 'REHAB_FIRST' | 'RETURN_HOME' | 'UNDECIDED') | undefined = undefined;
              if (rawDest && typeof rawDest === 'string') {
                const dUpper = rawDest.toUpperCase();
                if (dUpper.includes('REHAB')) parsedDest = 'REHAB_FIRST';
                else if (dUpper.includes('HOME')) parsedDest = 'RETURN_HOME';
                else if (['KNOWN', 'UNKNOWN', 'REHAB_FIRST', 'RETURN_HOME', 'UNDECIDED'].includes(dUpper)) {
                  parsedDest = dUpper as any;
                }
              }

              if (parsedBudget !== undefined || parsedDest !== undefined || args.targetDate || args.dischargeDate) {
                toolResults.push(
                  await AI_TOOLS_REGISTRY.update_case_context({
                    caseId,
                    budget: parsedBudget,
                    destinationStatus: parsedDest,
                    targetDate: args.targetDate,
                    dischargeDate: args.dischargeDate,
                    actor: effectiveActor,
                  })
                );
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
                  zipCode: args.zipCode || (overview?.caseData.zipCode && overview.caseData.zipCode !== 'UNSET' ? overview.caseData.zipCode : undefined),
                })
              );
            } else if (call.name === 'complete_task') {
              toolResults.push(
                await AI_TOOLS_REGISTRY.complete_task({
                  caseId,
                  taskId: args.taskId,
                  taskTitleQuery: args.taskTitleQuery || args.taskTitle || args.task,
                  note: args.note || args.completionNotes,
                  actor: effectiveActor,
                })
              );
            } else if (call.name === 'confirm_discharge_destination') {
              const dest = args.destination === 'RETURN_HOME' ? 'RETURN_HOME' : 'REHAB_FIRST';
              toolResults.push(
                await AI_TOOLS_REGISTRY.confirm_discharge_destination({
                  caseId,
                  destination: dest,
                  actor: effectiveActor,
                  note: args.note || 'Confirmed by social worker',
                })
              );
            } else if (call.name === 'get_plan') {
              toolResults.push(await AI_TOOLS_REGISTRY.get_plan({ caseId }));
            } else if (call.name === 'explain_cost_estimate') {
              toolResults.push(
                await AI_TOOLS_REGISTRY.explain_cost_estimate({
                  category: args.category || 'moving',
                  caseId,
                })
              );
            }
          }
        }

        let textResponse = response.text || '';

        // Pass 2 Gemini grounded synthesis loop when tools returned results
        if (toolResults.length > 0) {
          try {
            const secondPassResponse = await generateContentWithRetry(ai, {
              model: 'gemini-flash-latest',
              contents: [
                ...geminiContents,
                {
                  role: 'user',
                  parts: [
                    {
                      text: `Tool Execution Results:\n${toolResults
                        .map((tr) => `[Tool: ${tr.toolName}, Success: ${tr.success}]\n${tr.message}`)
                        .join('\n\n')}\n\n` +
                        `PASS 2 SYNTHESIS RULES:\n` +
                        `- Treat tool results and structured case state as authoritative product truth.\n` +
                        `- Do not invent or fabricate verification, certification, NASMM status, partnership, phone numbers, addresses, prices, availability, insurance acceptance, or service capabilities.\n` +
                        `- Do NOT use words like "partner", "${BRAND_NAME} partner", "our providers", or "certified" unless explicitly stated in the tool results.\n` +
                        `- Clearly label general guidance as general guidance (e.g. "A common next step is...").\n` +
                        `- If a fact is unavailable, state neutrally what is available in the directory rather than filling it in.\n` +
                        `- Synthesize an empathetic, clear markdown response based strictly on conversation history, structured case state, and tool results.`,
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
            console.warn('[AIOrchestrator] Gemini Pass 2 synthesis failed (using tool result text):', pass2Err);
          }

          if (!textResponse) {
            textResponse = toolResults.map((tr) => tr.message).join('\n\n');
          }

          return {
            message: textResponse,
            toolResults,
            suggestedNextAction: `Focus on ${overview?.urgentTask?.title || 'next plan priority'}.`,
          };
        }

        if (textResponse) {
          return {
            message: textResponse,
            toolResults: [],
            suggestedNextAction: `Focus on ${overview?.urgentTask?.title || 'next plan priority'}.`,
          };
        }
      } catch (err: any) {
        console.warn(`[AIOrchestrator] Gemini API call failed (${err?.message || err}). Falling back to safe non-mutating fallback.`);
      }
    }

    // Safe, non-mutating fallback strictly used when GEMINI_API_KEY is absent or API call fails
    return this.processUserIntentLocal(caseId, promptText, options);
  }

  public async processUserIntent(caseId: string, prompt: string, options?: ProcessConversationOptions): Promise<AIResponse> {
    return this.processConversation(caseId, [{ role: 'user', text: prompt }], prompt, options);
  }

  public async processUserIntentLocal(caseId: string, prompt?: string, options?: ProcessConversationOptions): Promise<AIResponse> {
    const pLower = (prompt || '').toLowerCase();
    const actor = options?.actorName ? (options.actorName.includes('via Nora') ? options.actorName : `${options.actorName} via Nora`) : 'Family Coordinator via Nora';
    if (
      (pLower.includes('rehab') || pLower.includes('return home')) &&
      (pLower.includes('confirm') || pLower.includes('social worker') || pLower.includes('complete') || pLower.includes('decision'))
    ) {
      const dest = pLower.includes('rehab') ? 'REHAB_FIRST' : 'RETURN_HOME';
      const tr = await AI_TOOLS_REGISTRY.confirm_discharge_destination({
        caseId,
        destination: dest,
        actor,
        note: prompt,
      });
      return {
        message: tr.message,
        toolResults: [tr],
        suggestedNextAction: 'Review the updated transition pulse and unlocked downstream tasks.',
      };
    }

    // Deterministic cost evidence explanation fallback
    const isCostQuestion =
      pLower.includes('estimate') ||
      pLower.includes('cost') ||
      pLower.includes('high') ||
      pLower.includes('where did') ||
      pLower.includes('source') ||
      pLower.includes('recent') ||
      pLower.includes('pricing');

    if (isCostQuestion) {
      let category = 'moving';
      if (pLower.includes('pack')) category = 'packing';
      else if (pLower.includes('ramp') || pLower.includes('grab') || pLower.includes('mod') || pLower.includes('access'))
        category = 'home_modification';
      else if (pLower.includes('ride') || pLower.includes('transit') || pLower.includes('transport'))
        category = 'transportation';
      else if (pLower.includes('donat')) category = 'donation';

      const tr = await AI_TOOLS_REGISTRY.explain_cost_estimate({
        category,
        caseId,
      });

      return {
        message: tr.message,
        toolResults: [tr],
        suggestedNextAction: 'Review provider rate sheets or prepare an inquiry request.',
      };
    }

    return {
      message:
        `I'm having trouble processing conversational requests right now. Your plan has not been changed. You can still manage tasks, family members, budget, and resources directly from ${BRAND_NAME}.`,
      toolResults: [],
      suggestedNextAction: 'Review your transition plan tasks directly from the dashboard.',
    };
  }
}

async function generateContentWithRetry(ai: GoogleGenAI, params: any, retries = 2): Promise<any> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await ai.models.generateContent(params);
    } catch (err: any) {
      const isTransient =
        err?.status === 503 ||
        err?.status === 429 ||
        (err?.message && (err.message.includes('503') || err.message.includes('429') || err.message.includes('high demand')));
      if (isTransient && attempt < retries - 1) {
        await new Promise((resolve) => setTimeout(resolve, 800 * (attempt + 1)));
        continue;
      }
      throw err;
    }
  }
}

export const aiOrchestrator = new AIOrchestrator();
