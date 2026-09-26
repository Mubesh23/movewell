import { GoogleGenAI } from '@google/genai';
import { AI_TOOLS_REGISTRY, ToolExecutionResult } from '../ai/tools';
import { caseService } from './case-service';

export interface AIResponse {
  message: string;
  toolResults: ToolExecutionResult[];
  suggestedNextAction?: string;
}

export class AIOrchestrator {
  public async processUserIntent(caseId: string, prompt: string): Promise<AIResponse> {
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

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
                  text: `System Context: You are MoveWell AI, an empathetic senior transition coordinator helping a family navigate post-hospital discharge and senior moving.
Case ID: ${caseId}
Senior Name: ${overview?.seniorProfile.name || 'Senior'}
Current Urgency: ${overview?.caseData.urgency || 'URGENT'}
Current Progress: ${overview?.progressPercent || 0}%

User request: ${prompt}`,
                },
              ],
            },
          ],
        });

        const textResponse = response.text;
        if (textResponse) {
          // Process text response alongside local tool execution if matched
          const localResult = await this.processUserIntentLocal(caseId, prompt);
          return {
            message: textResponse,
            toolResults: localResult.toolResults,
            suggestedNextAction: localResult.suggestedNextAction,
          };
        }
      } catch (err) {
        console.warn('Gemini API call failed, falling back to deterministic workflow engine:', err);
      }
    }

    // Deterministic fallback when offline or no API key present
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
        const res = await AI_TOOLS_REGISTRY.update_case_context({
          caseId,
          budget: budgetVal,
        });
        toolResults.push(res);
        responseMessages.push(`Updated budget to $${budgetVal.toLocaleString()}.`);
      }
    }

    // Intent 2: Task Assignment / Re-assignment
    if (
      lower.includes('assign') ||
      lower.includes('handle') ||
      lower.includes('take care') ||
      lower.includes('will') ||
      lower.includes('can')
    ) {
      let assigneeName = 'Jennifer';

      const toMatch = prompt.match(/\bto\s+([a-zA-Z]+)\b/i) || prompt.match(/\b(?:assign|for)\s+([a-zA-Z]+)\b/i);
      if (toMatch && !['packing', 'task', 'tasks', 'budget', 'the', 'me'].includes(toMatch[1].toLowerCase())) {
        assigneeName = capitalize(toMatch[1]);
      } else {
        const nameMatch = prompt.match(/\b([A-Z][a-z]+|[a-z]+)\s+(?:will|can|is|should|handles|handle)\b/i);
        if (nameMatch && !['who', 'what', 'it', 'family'].includes(nameMatch[1].toLowerCase())) {
          assigneeName = capitalize(nameMatch[1]);
        }
      }

      const taskQuery = lower.includes('pack')
        ? 'pack'
        : lower.includes('discharge')
        ? 'discharge'
        : lower.includes('move')
        ? 'move'
        : lower.includes('clean')
        ? 'clean'
        : 'inventory';

      const res = await AI_TOOLS_REGISTRY.assign_task({
        caseId,
        assigneeName,
        taskTitleQuery: taskQuery,
      });
      toolResults.push(res);
      responseMessages.push(res.message);
    }

    // Intent 3: Find Resources
    if (
      (lower.includes('find') || lower.includes('search') || lower.includes('list')) &&
      (lower.includes('mover') || lower.includes('resource') || lower.includes('storage') || lower.includes('pack') || lower.includes('clean'))
    ) {
      const category = lower.includes('mover') ? 'moving' : lower.includes('storage') ? 'storage' : 'ALL';
      const res = await AI_TOOLS_REGISTRY.find_resources({
        category,
        zipCode: '77004',
      });
      toolResults.push(res);
      responseMessages.push(`Found ${res.data?.length || 0} local verified listings.`);
    }

    // Intent 4: Task Completion
    if (lower.includes('complete') || lower.includes('done') || lower.includes('finished')) {
      const overview = await caseService.getCaseOverview(caseId);
      const target = overview?.tasks.find((t) => t.status === 'READY') || overview?.tasks[0];
      if (target) {
        const res = await AI_TOOLS_REGISTRY.complete_task({ caseId, taskId: target.id });
        toolResults.push(res);
        responseMessages.push(`Marked "${target.title}" as completed.`);
      }
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

    // Default overview response
    const overviewRes = await AI_TOOLS_REGISTRY.get_plan({ caseId });
    toolResults.push(overviewRes);
    return {
      message: `MoveWell is managing ${seniorName}'s post-hospital plan. Current progress is ${overviewRes.data?.progressPercent}%. Today's top priority is "${overviewRes.data?.urgentTask?.title}".${proactiveSuggestion}`,
      toolResults,
      suggestedNextAction: proactiveSuggestion.trim(),
    };
  }
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

export const aiOrchestrator = new AIOrchestrator();
