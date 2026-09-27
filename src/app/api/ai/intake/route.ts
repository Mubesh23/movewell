import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import { IntakeDraft, IntakeTargetField } from '@/types';
import { intakeReadinessService } from '@/services/intake-readiness';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface IntakeRequestBody {
  message?: string;
  prompt?: string;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  currentDraft?: IntakeDraft;
}

const NON_NAME_WORDS = new Set([
  'fell', 'had', 'is', 'was', 'has', 'went', 'broke', 'needs', 'lives', 'called', 'got',
  'suffered', 'taken', 'admitted', 'just', 'recently', 'currently', 'and', 'or', 'who',
  'that', 'can', 'cannot', 'could', 'doesn', 'does', 'will', 'may', 'might', 'in', 'at',
  'to', 'from', 'with', 'on', 'about', 'over', 'under', 'between', 'out', 'up', 'down',
  'a', 'an', 'the', 'she', 'he', 'they', 'we', 'i', 'it', 'her', 'his', 'their', 'our',
  'my', 'its', 'not', 'no', 'never', 'also', 'too', 'very', 'really', 'still', 'always',
  'suddenly', 'unfortunately', 'now', 'today', 'yesterday', 'tomorrow', 'this', 'that',
  'there', 'here', 'when', 'where', 'why', 'how', 'which', 'what', 'whom', 'whose',
  'hospital', 'home', 'rehab', 'facility', 'stairs', 'walker', 'wheelchair', 'bed', 'house'
]);

/**
 * Deterministic regex & keyword extractor used as fallback or baseline
 */
function deterministicExtract(text: string, currentDraft: IntakeDraft = {}): Partial<IntakeDraft> {
  const updates: Partial<IntakeDraft> = {};
  const lower = text.toLowerCase();

  // Senior name / reference
  if (!currentDraft.seniorName || NON_NAME_WORDS.has(currentDraft.seniorName.toLowerCase())) {
    const namedMatch = text.match(/\b(?:named|name is)\s+([A-Z][a-z]+)/i);
    const momNamedMatch = text.match(/\b(?:my mom|my mother)[,\s]+([A-Z][a-z]+)\b/i);
    const dadNamedMatch = text.match(/\b(?:my dad|my father)[,\s]+([A-Z][a-z]+)\b/i);

    if (namedMatch && !NON_NAME_WORDS.has(namedMatch[1].toLowerCase())) {
      updates.seniorName = namedMatch[1];
    } else if (momNamedMatch && !NON_NAME_WORDS.has(momNamedMatch[1].toLowerCase())) {
      updates.seniorName = momNamedMatch[1];
    } else if (dadNamedMatch && !NON_NAME_WORDS.has(dadNamedMatch[1].toLowerCase())) {
      updates.seniorName = dadNamedMatch[1];
    } else {
      const parentMatch = text.match(/\b(my mom|my dad|my mother|my father|mom|dad)\b/i);
      if (parentMatch) {
        const ref = parentMatch[1].toLowerCase();
        if (ref.includes('dad') || ref.includes('father')) {
          updates.seniorName = 'Dad';
        } else {
          updates.seniorName = 'Mom';
        }
      }
    }
  }

  // Age
  const ageMatch = text.match(/\b(is\s+)?(\d{2})\s*(years old)?\b/);
  if (ageMatch && parseInt(ageMatch[2], 10) >= 50 && parseInt(ageMatch[2], 10) <= 105) {
    updates.ageRange = ageMatch[2];
  }

  // Discharge timing
  if (lower.includes('thursday')) {
    updates.dischargeTimelineDescription = 'Thursday';
    updates.dischargeDays = 4;
  } else if (lower.includes('friday')) {
    updates.dischargeTimelineDescription = 'Friday';
    updates.dischargeDays = 5;
  } else if (lower.includes('tomorrow')) {
    updates.dischargeTimelineDescription = 'tomorrow';
    updates.dischargeDays = 1;
  } else if (lower.includes('this week')) {
    updates.dischargeTimelineDescription = 'this week';
    updates.dischargeDays = 5;
  } else {
    const daysMatch = text.match(/in\s+(\d+)\s+days/i);
    if (daysMatch) {
      const days = parseInt(daysMatch[1], 10);
      updates.dischargeDays = days;
      updates.dischargeTimelineDescription = `in ${days} days`;
    }
  }

  // Transition context
  if (lower.includes('hospital') || lower.includes('rehab') || lower.includes('fall') || lower.includes('fell')) {
    updates.transitionType = 'POST_HOSPITAL';
  }

  // Mobility & safety limitations
  if (
    lower.includes('walker') ||
    lower.includes('wheelchair') ||
    lower.includes('cane') ||
    lower.includes('trouble walking') ||
    lower.includes('cannot walk') ||
    lower.includes("can't walk") ||
    lower.includes('mobility') ||
    lower.includes('getting around')
  ) {
    updates.mobilityConstraint = true;
  }
  if (lower.includes('stair') || lower.includes('upstairs') || lower.includes('two-story') || lower.includes('second floor')) {
    updates.stairsConstraint = true;
    updates.homeType = 'Two-story house';
  }
  if (lower.includes('single-story') || lower.includes('single story') || lower.includes('ranch') || lower.includes('one level')) {
    updates.stairsConstraint = false;
    updates.homeType = 'Single-story house';
  }
  if (lower.includes('lives alone') || lower.includes('by herself') || lower.includes('by himself') || lower.includes('on her own')) {
    updates.livesAlone = true;
  }

  // Local helper & remote coordinator
  if (lower.includes('sister jennifer')) {
    updates.localHelperName = 'Jennifer';
    updates.hasLocalHelper = true;
  } else {
    const sisterMatch = text.match(/sister\s+([A-Z][a-z]+)/i);
    const brotherMatch = text.match(/brother\s+([A-Z][a-z]+)/i);
    if (sisterMatch) {
      updates.localHelperName = sisterMatch[1];
      updates.hasLocalHelper = true;
    } else if (brotherMatch) {
      updates.localHelperName = brotherMatch[1];
      updates.hasLocalHelper = true;
    }
  }

  if (lower.includes('no one') || lower.includes('on my own') || lower.includes('nobody nearby') || lower.includes('no family nearby')) {
    updates.hasLocalHelper = false;
  }

  if (lower.includes('another state') || lower.includes('out of state') || lower.includes('remotely') || lower.includes('from chicago') || lower.includes('live in chicago')) {
    updates.userIsRemote = true;
  }

  // Location / ZIP / City
  let extractedZip: string | undefined;
  const zipMatch = text.match(/\b(\d{5})\b/);
  if (zipMatch && !zipMatch[1].startsWith('000')) {
    extractedZip = zipMatch[1];
    updates.zipCode = extractedZip;
  }
  const cityStateMatch = text.match(/\b(?:in|at|near)\s+([A-Z][a-zA-Z\s]+?),\s*([A-Z]{2})\b/);
  if (cityStateMatch) {
    updates.city = `${cityStateMatch[1].trim()}, ${cityStateMatch[2]}`;
  } else {
    const commonCities: Record<string, string> = {
      houston: 'Houston, TX',
      dallas: 'Dallas, TX',
      austin: 'Austin, TX',
      chicago: 'Chicago, IL',
      denver: 'Denver, CO',
      atlanta: 'Atlanta, GA',
      seattle: 'Seattle, WA',
      phoenix: 'Phoenix, AZ',
      miami: 'Miami, FL',
      boston: 'Boston, MA',
    };
    for (const [key, val] of Object.entries(commonCities)) {
      if (lower.includes(key)) {
        updates.city = val;
        break;
      }
    }
  }

  // Budget
  if (
    lower.includes('leave it open') ||
    lower.includes('leave open') ||
    lower.includes('not set') ||
    lower.includes('no budget') ||
    lower.includes('not sure') ||
    lower.includes('open for now')
  ) {
    updates.budgetStatus = 'UNSET';
    updates.budget = undefined;
  } else {
    // Only extract budget if there is an explicit $ sign or the word 'budget'
    const dollarMatch = text.match(/\$(\d{1,3}(?:,\d{3})*|\d{3,6})\b/);
    const budgetWordMatch = text.match(/\bbudget\s*(?:of|is|around|about)?\s*:?\s*\$?(\d{1,3}(?:,\d{3})*|\d{3,6})\b/i);

    const budgetCandidate = dollarMatch ? dollarMatch[1] : (budgetWordMatch ? budgetWordMatch[1] : null);
    if (budgetCandidate) {
      const parsed = parseInt(budgetCandidate.replace(/,/g, ''), 10);
      if (parsed >= 100 && String(parsed) !== extractedZip) {
        updates.budget = parsed;
        updates.budgetStatus = 'SET';
      }
    }
  }

  return updates;
}

export async function POST(req: NextRequest) {
  try {
    const body: IntakeRequestBody = await req.json();
    const userMessage = (body.message || body.prompt || '').trim();

    if (!userMessage) {
      return NextResponse.json(
        { success: false, error: 'A situation description is required.' },
        { status: 400 }
      );
    }

    const currentDraft: IntakeDraft = body.currentDraft || {};
    const history = body.history || [];

    // Evaluate current state before this turn to see what was expected
    const initialEvaluation = intakeReadinessService.evaluate(currentDraft);

    let extractedUpdates: Partial<IntakeDraft> = {};
    let conversationalReply = '';

    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const systemPrompt = `You are Nora, MoveWell's empathetic, calm transition coordinator.
You guide families caring for aging parents through hospital discharge and housing transitions.
Your job is to talk with the family naturally while quietly gathering minimum viable planning facts.
The user should NEVER feel like they are filling out a form one field at a time.
Ask only ONE focused follow-up question per turn, focusing on the highest-priority missing fact.

CURRENT INTAKE DRAFT SO FAR:
${JSON.stringify(currentDraft, null, 2)}

NEXT HIGHEST-VALUE FIELD NEEDED:
${initialEvaluation.nextTargetField}

RECENT CONVERSATION HISTORY:
${history.map((h) => `${h.role === 'user' ? 'User' : 'Nora'}: ${h.content}`).join('\n')}

LATEST USER MESSAGE:
"${userMessage}"

RULES FOR EXTRACTION:
- Extract ONLY facts explicitly stated or strongly implied by the user.
- seniorName: extract the senior's actual name (e.g. "Maria", "Robert"). If the user refers to them as "my mom" without an explicit personal name, output "Mom". NEVER output an event/action verb like "fell", "had", "broke", or "is" as a senior's name!
- If the user says "leave it open", "not sure", or "no budget", set budgetStatus: "UNSET" and budget: null.
- If the user provides a ZIP code or city/state, extract zipCode and/or city.
- If the user says "no one nearby" or "I'm on my own", set hasLocalHelper: false.
- If the user gives a day of the week (e.g. "Thursday"), set dischargeTimelineDescription: "Thursday" and estimate dischargeDays.
- DO NOT invent fictional names, locations, or details.
- DO NOT default missing values to Houston or $8,000. Leave missing fields null.

RULES FOR CONVERSATIONAL REPLY:
- If all required information is now known (senior name, discharge timeline, mobility/safety constraint, location, coordinator/support, and budget addressed):
  Acknowledge warmly, provide a concise recap of what you've gathered, state the immediate first priority (e.g. confirming a safe discharge destination), and confirm you have enough to build their transition plan.
- If more information is still needed:
  Warmly acknowledge what the user just said in 1 brief sentence, then ask ONE natural, gentle follow-up question for the next highest-value needed fact (${initialEvaluation.nextTargetField}).
  If asking for LOCATION: "What address or ZIP code should I use when looking for nearby help? You can give me just the ZIP if you'd rather not share the exact address yet."
  If asking for BUDGET: "Do you already have a budget in mind, or should we leave that open for now?"
  NEVER ask multiple questions in the same turn.`;

        const response = await ai.models.generateContent({
          model: 'gemini-flash-latest',
          contents: [
            {
              role: 'user',
              parts: [{ text: systemPrompt }],
            },
          ],
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                extractedUpdates: {
                  type: Type.OBJECT,
                  properties: {
                    seniorName: { type: Type.STRING },
                    ageRange: { type: Type.STRING },
                    transitionType: { type: Type.STRING },
                    dischargeDays: { type: Type.NUMBER },
                    dischargeTimelineDescription: { type: Type.STRING },
                    dischargeDate: { type: Type.STRING },
                    livesAlone: { type: Type.BOOLEAN },
                    mobilityConstraint: { type: Type.BOOLEAN },
                    stairsConstraint: { type: Type.BOOLEAN },
                    homeType: { type: Type.STRING },
                    zipCode: { type: Type.STRING },
                    city: { type: Type.STRING },
                    userName: { type: Type.STRING },
                    userCity: { type: Type.STRING },
                    userRelationship: { type: Type.STRING },
                    userIsRemote: { type: Type.BOOLEAN },
                    localHelperName: { type: Type.STRING },
                    localHelperCity: { type: Type.STRING },
                    hasLocalHelper: { type: Type.BOOLEAN },
                    budget: { type: Type.NUMBER },
                    budgetStatus: { type: Type.STRING },
                    destinationStatus: { type: Type.STRING },
                  },
                },
                conversationalReply: { type: Type.STRING },
              },
              required: ['conversationalReply'],
            },
          },
        });

        if (response.text) {
          const parsed = JSON.parse(response.text);
          if (parsed.extractedUpdates) {
            extractedUpdates = parsed.extractedUpdates;
          }
          if (parsed.conversationalReply) {
            conversationalReply = parsed.conversationalReply;
          }
        }
      } catch (geminiErr) {
        console.warn('[IntakeAPI] Gemini call error, falling back to deterministic extraction:', geminiErr);
      }
    }

    // Merge deterministic extraction to guarantee robustness
    const fallbackExtracted = deterministicExtract(userMessage, currentDraft);
    const combinedExtracted: Partial<IntakeDraft> = {
      ...fallbackExtracted,
      ...extractedUpdates,
    };

    // Construct updated draft
    const updatedDraft: IntakeDraft = {
      ...currentDraft,
    };

    for (const [k, v] of Object.entries(combinedExtracted)) {
      if (v !== null && v !== undefined) {
        (updatedDraft as any)[k] = v;
      }
    }

    // Sanitize seniorName to never be a verb or invalid stopword
    if (updatedDraft.seniorName && NON_NAME_WORDS.has(updatedDraft.seniorName.trim().toLowerCase())) {
      updatedDraft.seniorName = 'Mom';
    }

    // Always preserve POST_HOSPITAL default transitionType unless specified
    if (!updatedDraft.transitionType) {
      updatedDraft.transitionType = 'POST_HOSPITAL';
    }

    // Deterministic readiness evaluation
    const readiness = intakeReadinessService.evaluate(updatedDraft);

    // If Gemini reply wasn't generated or was blank, build deterministic reply
    if (!conversationalReply) {
      if (readiness.isReady) {
        conversationalReply = `Understood. I have enough details to build your family's initial transition plan.\n\nHere is what I've noted:\n• ${readiness.summaryBulletPoints.join('\n• ')}\n\nThe immediate priority will be confirming a safe discharge destination.`;
      } else {
        const question = intakeReadinessService.getFallbackQuestion(
          readiness.nextTargetField,
          updatedDraft.seniorName
        );
        conversationalReply = `I can help with this. ${question}`;
      }
    }

    return NextResponse.json({
      success: true,
      draft: updatedDraft,
      assistantMessage: conversationalReply,
      isReady: readiness.isReady,
      missingRequiredFields: readiness.missingRequiredFields,
      nextTargetField: readiness.nextTargetField,
      summaryBulletPoints: readiness.summaryBulletPoints,
      nextAction: readiness.isReady ? 'CREATE_PLAN' : 'ASK_QUESTION',
      // Backwards compatibility with previous response format
      data: {
        ...updatedDraft,
        summaryText: conversationalReply,
      },
      missingFields: readiness.missingRequiredFields,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
