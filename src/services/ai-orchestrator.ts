import { GoogleGenAI, Type } from '@google/genai';
import { AI_TOOLS_REGISTRY, ToolExecutionResult } from '../ai/tools';
import { caseService } from './case-service';

export interface AIResponse {
  message: string;
  toolResults: ToolExecutionResult[];
  suggestedNextAction?: string;
}

export class AIOrchestrator {
  public async processUserIntent(caseId: string, prompt: string): Promise<AIResponse> {
    // Restrict API key to server-side process.env.GEMINI_API_KEY
    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const overview = await caseService.getCaseOverview(caseId);

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: `System Context: You are Nora, an empathetic senior transition coordinator for MoveWell.
Case ID: ${caseId}
Senior Name: ${overview?.seniorProfile.name || 'Senior'}
Current Urgency: ${overview?.caseData.urgency || 'URGENT'}
Current Progress: ${overview?.progressPercent || 0}%
Current Budget: $${overview?.caseData.budget || 8000}

User request: ${prompt}`,
                },
              ],
            },
          ],
          config: {
            tools: [
              {
                functionDeclarations: [
                  {
                    name: 'update_case_context',
                    description: 'Update the case dollar budget or target dates. Call this tool whenever user asks to set, update, or change the budget limit.',
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
                    description: 'Assign a task in the plan to a family member or helper',
                    parameters: {
                      type: Type.OBJECT,
                      properties: {
                        assigneeName: { type: Type.STRING, description: 'Name of person to assign (e.g. Sarah, Jennifer)' },
                        taskTitleQuery: { type: Type.STRING, description: 'Query to match task title (e.g. pack, move, discharge)' },
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
                    description: 'Mark a specific transition task as completed by title query or ID with optional completion notes',
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
                    description: 'Fetch the active case transition plan overview',
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
                {
                  role: 'user',
                  parts: [
                    {
                      text: `System Context: You are Nora, an empathetic senior transition coordinator for MoveWell.
Senior Name: ${overview?.seniorProfile.name || 'Senior'}
Original User Request: ${prompt}

Tool Execution Results:
${toolResults.map((tr) => `Tool: ${tr.toolName}\nSuccess: ${tr.success}\nMessage: ${tr.message}`).join('\n\n')}

Instruction: Using the tool execution results above, synthesize an empathetic, clear, markdown-formatted response for the user. Highlight key details like resource names, verification status, contact numbers, or updated plan status. End with a helpful, context-aware next step recommendation.`,
                    },
                  ],
                },
              ],
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
      } catch (err) {
        console.warn('Gemini API function call failed, falling back to local deterministic workflow engine:', err);
      }
    }

    // Deterministic fallback strictly used when GEMINI_API_KEY is absent or API call fails
    return this.processUserIntentLocal(caseId, prompt);
  }

  public async processUserIntentLocal(caseId: string, prompt: string): Promise<AIResponse> {
    const lower = prompt.toLowerCase();
    const toolResults: ToolExecutionResult[] = [];
    const responseMessages: string[] = [];

    // Intent 1: Budget Modification
    if (lower.includes('budget') || lower.includes('$')) {
      const match = lower.match(/\$?([0-9,]+)/);
      if (match) {
        const budgetVal = parseInt(match[1].replace(/,/g, ''), 10);
        if (!isNaN(budgetVal) && budgetVal > 0) {
          const res = await AI_TOOLS_REGISTRY.update_case_context({
            caseId,
            budget: budgetVal,
          });
          toolResults.push(res);
          responseMessages.push(`Updated budget to $${budgetVal.toLocaleString()}.`);
        }
      }
    }

    // Intent 2: Task Assignment / Re-assignment
    if (
      lower.includes('assign') ||
      lower.includes('handle') ||
      lower.includes('take care')
    ) {
      let assigneeName = 'Jennifer';

      const toMatch = prompt.match(/\bto\s+([a-zA-Z]+)\b/i) || prompt.match(/\b(?:assign|for)\s+([a-zA-Z]+)\b/i);
      if (toMatch && !['packing', 'task', 'tasks', 'budget', 'the', 'me'].includes(toMatch[1].toLowerCase())) {
        assigneeName = capitalize(toMatch[1]);
      }

      let taskQuery = 'task';
      if (lower.includes('pack') || lower.includes('inventory')) {
        taskQuery = 'pack';
      } else if (lower.includes('discharge')) {
        taskQuery = 'discharge';
      } else if (lower.includes('move') || lower.includes('moving')) {
        taskQuery = 'move';
      } else if (lower.includes('clean')) {
        taskQuery = 'clean';
      } else {
        const queryWithoutAssignee = lower
          .replace(/\bassign\b/g, '')
          .replace(/\bto\s+[a-z]+\b/g, '')
          .replace(/\bfor\s+[a-z]+\b/g, '')
          .trim();
        if (queryWithoutAssignee) taskQuery = queryWithoutAssignee;
      }

      const res = await AI_TOOLS_REGISTRY.assign_task({
        caseId,
        assigneeName,
        taskTitleQuery: taskQuery,
      });
      toolResults.push(res);
      responseMessages.push(res.message);
    }

    // Intent 3: Find Resources (handles natural queries, care options, typos like 'houstn')
    const isResourceQuery =
      lower.includes('resource') ||
      lower.includes('care option') ||
      lower.includes('care options') ||
      lower.includes('houstn') ||
      lower.includes('houston care') ||
      lower.includes('housing') ||
      lower.includes('senior care') ||
      lower.includes('mover') ||
      lower.includes('moving company') ||
      lower.includes('storage') ||
      ((lower.includes('find') || lower.includes('search') || lower.includes('list') || lower.includes('option') || lower.includes('help') || lower.includes('service')) &&
        (lower.includes('care') || lower.includes('option') || lower.includes('support') || lower.includes('service') || lower.includes('mover') || lower.includes('storage') || lower.includes('pack') || lower.includes('clean') || lower.includes('houston') || lower.includes('houstn')));

    if (isResourceQuery) {
      const overview = await caseService.getCaseOverview(caseId);
      const category = lower.includes('mover') || lower.includes('moving') ? 'moving' : lower.includes('storage') ? 'storage' : 'ALL';
      const res = await AI_TOOLS_REGISTRY.find_resources({
        category,
        zipCode: overview?.caseData.zipCode || '77004',
      });
      toolResults.push(res);
      responseMessages.push(res.message);
    }

    // Intent 4: Task Completion (Strict Task Query Resolution)
    if (lower.includes('complete') || lower.includes('done') || lower.includes('finished') || lower.includes('mark')) {
      const queryCleaned = lower
        .replace(/\bmark\b/g, '')
        .replace(/\bcomplete\b/g, '')
        .replace(/\bdone\b/g, '')
        .replace(/\bfinished\b/g, '')
        .replace(/\bas\b/g, '')
        .replace(/\bthe\b/g, '')
        .trim();

      const res = await AI_TOOLS_REGISTRY.complete_task({
        caseId,
        taskTitleQuery: queryCleaned || 'discharge',
      });
      toolResults.push(res);
      if (res.success) {
        responseMessages.push(res.message);
      } else {
        responseMessages.push(res.message);
      }
    }

    // Intent 5: Phase Concept Explanations
    if (lower.includes('right now') || lower.includes('what does right now mean')) {
      const overview = await caseService.getCaseOverview(caseId);
      const seniorName = overview?.seniorProfile.name || 'Maria';
      return {
        message:
          `In MoveWell, **RIGHT NOW** represents critical path tasks that must be resolved immediately before hospital discharge or within the first 24–48 hours.\n\n` +
          `These are urgent safety & destination priorities (like confirming ${seniorName}'s safe discharge destination or assessing accessibility) that block downstream moving, packing, or care arrangements.`,
        toolResults: [],
        suggestedNextAction: `Confirming ${seniorName}'s safe discharge destination.`,
      };
    }

    // Proactive Next Step Suggestion Engine based on active case overview
    const overview = await caseService.getCaseOverview(caseId);
    const seniorName = overview?.seniorProfile.name || 'Senior';
    let proactiveSuggestion = '';

    if (overview) {
      const nextTask = overview.urgentTask || overview.tasks.find((t) => t.status === 'READY');
      if (nextTask) {
        if (nextTask.templateId === 'confirm-discharge-destination') {
          proactiveSuggestion = `\n\n👉 Next recommended step: Confirming ${seniorName}'s safe discharge destination. Would you like me to mark that complete or search Houston care options?`;
        } else if (nextTask.templateId === 'decide-temporary-vs-permanent') {
          proactiveSuggestion = `\n\n👉 Next recommended step: Decide temporary vs. permanent housing for ${seniorName}. Should we look into short-term rehab or accessible single-story residences?`;
        } else if (nextTask.templateId === 'request-moving-estimates') {
          proactiveSuggestion = `\n\n👉 Next recommended step: Request moving estimates in Houston. Shall I list verified senior moving companies?`;
        } else {
          proactiveSuggestion = `\n\n👉 Next recommended step: Focus on "${nextTask.title}". Would you like me to assign it or find local assistance?`;
        }
      } else {
        proactiveSuggestion = `\n\n👉 What would you like to work on next for ${seniorName}'s transition?`;
      }
    }

    if (toolResults.length > 0) {
      return {
        message: `Plan updated! ${responseMessages.join(' ')}${proactiveSuggestion}`,
        toolResults,
        suggestedNextAction: proactiveSuggestion.trim(),
      };
    }

    // Default overview response for queries like "what is left to do?", "status", "tasks", etc.
    const overviewRes = await AI_TOOLS_REGISTRY.get_plan({ caseId });
    toolResults.push(overviewRes);
    return {
      message: overviewRes.success
        ? `${overviewRes.message}${proactiveSuggestion}`
        : `MoveWell is managing ${seniorName}'s post-hospital plan.${proactiveSuggestion}`,
      toolResults,
      suggestedNextAction: proactiveSuggestion.trim(),
    };
  }
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

export const aiOrchestrator = new AIOrchestrator();
