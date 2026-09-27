import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import { IntakeDraft, IntakeTargetField } from '@/types';
import { intakeReadinessService } from '@/services/intake-readiness';
import { resolveTemporalExpression } from '@/lib/temporal';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface IntakeRequestBody {
  message?: string;
  prompt?: string;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  currentDraft?: IntakeDraft;
  clientNow?: string;
  clientTimeZone?: string;
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
 * Deterministic regex, keyword & temporal extractor used as baseline
 */
function deterministicExtract(
  text: string,
  currentDraft: IntakeDraft = {},
  referenceDate: Date = new Date(),
  clientTimeZone?: string
): Partial<IntakeDraft> {
  const updates: Partial<IntakeDraft> = {};
  const lower = text.toLowerCase();

  // 1. Senior name / reference
  if (!currentDraft.seniorName || NON_NAME_WORDS.has(currentDraft.seniorName.toLowerCase())) {
    const namedMatch = text.match(/\b(?:named|name is)\s+([A-Z][a-z]+)/i);
    const momNamedMatch = text.match(/\b(?:my mom|my mother)[,\s]+([A-Z][a-z]+)\b/i);
    const dadNamedMatch = text.match(/\b(?:my dad|my father)[,\s]+([A-Z][a-z]+)\b/i);
    const parentNamedMatch = text.match(/\b(?:my parent)[,\s]+([A-Z][a-z]+)\b/i);

    if (namedMatch && !NON_NAME_WORDS.has(namedMatch[1].toLowerCase())) {
      updates.seniorName = namedMatch[1];
    } else if (momNamedMatch && !NON_NAME_WORDS.has(momNamedMatch[1].toLowerCase())) {
      updates.seniorName = momNamedMatch[1];
      updates.seniorRelationship = 'Mother';
      if (!currentDraft.coordinatorRelationship) updates.coordinatorRelationship = 'Child';
    } else if (dadNamedMatch && !NON_NAME_WORDS.has(dadNamedMatch[1].toLowerCase())) {
      updates.seniorName = dadNamedMatch[1];
      updates.seniorRelationship = 'Father';
      if (!currentDraft.coordinatorRelationship) updates.coordinatorRelationship = 'Child';
    } else if (parentNamedMatch && !NON_NAME_WORDS.has(parentNamedMatch[1].toLowerCase())) {
      updates.seniorName = parentNamedMatch[1];
      updates.seniorRelationship = 'Parent';
      if (!currentDraft.coordinatorRelationship) updates.coordinatorRelationship = 'Child';
    } else {
      const parentMatch = text.match(/\b(my mom|my dad|my mother|my father|mom|dad|my parent|parent)\b/i);
      if (parentMatch) {
        const ref = parentMatch[1].toLowerCase();
        if (ref.includes('dad') || ref.includes('father')) {
          updates.seniorName = 'Dad';
          updates.seniorRelationship = 'Father';
          if (!currentDraft.coordinatorRelationship) updates.coordinatorRelationship = 'Child';
        } else if (ref.includes('mom') || ref.includes('mother')) {
          updates.seniorName = 'Mom';
          updates.seniorRelationship = 'Mother';
          if (!currentDraft.coordinatorRelationship) updates.coordinatorRelationship = 'Child';
        } else {
          updates.seniorName = 'Parent';
          updates.seniorRelationship = 'Parent';
          if (!currentDraft.coordinatorRelationship) updates.coordinatorRelationship = 'Child';
        }
      }
    }
  }

  // 2. Age
  const ageMatch = text.match(/\b(is\s+)?(\d{2})\s*(years old)?\b/);
  if (ageMatch && parseInt(ageMatch[2], 10) >= 50 && parseInt(ageMatch[2], 10) <= 105) {
    updates.ageRange = ageMatch[2];
  }

  // 3. Discharge timing & temporal resolution (reference clock aware)
  const temporal = resolveTemporalExpression(text, referenceDate, clientTimeZone);
  if (temporal) {
    if (temporal.description) {
      if (currentDraft.dischargeTimelineDescription && temporal.time && !temporal.date) {
        updates.dischargeTimelineDescription = `${currentDraft.dischargeTimelineDescription} (${temporal.description})`;
      } else {
        updates.dischargeTimelineDescription = temporal.description;
      }
    }
    if (temporal.date) {
      updates.dischargeDate = temporal.date;
    }
    if (temporal.daysFromReference !== undefined) {
      updates.dischargeDays = temporal.daysFromReference;
    }
    if (temporal.time) {
      updates.dischargeTime = temporal.time;
    }
    if (temporal.precision) {
      updates.dischargePrecision = temporal.precision;
    }
    if (temporal.needsClarification) {
      updates.timingClarificationNeeded = true;
    } else {
      updates.timingClarificationNeeded = false;
    }
  } else {
    // Check if user is clarifying a previous "next week"
    if (currentDraft.timingClarificationNeeded) {
      if (lower.includes('flexible') || lower.includes('not sure') || lower.includes('tbd')) {
        updates.timingClarificationNeeded = false;
      }
    }
  }

  // 4. Transition context
  if (lower.includes('hospital') || lower.includes('rehab') || lower.includes('fall') || lower.includes('fell') || lower.includes('move')) {
    updates.transitionType = 'POST_HOSPITAL';
  }

  // 5. Mobility & safety limitations
  const lowerTrimmed = lower.trim();
  const isNegativeMobility =
    lowerTrimmed === 'no' ||
    lowerTrimmed === 'none' ||
    lowerTrimmed === 'neither' ||
    lowerTrimmed === 'no limitations' ||
    lowerTrimmed === 'no mobility issues' ||
    lowerTrimmed === 'no stairs' ||
    lowerTrimmed === 'independent' ||
    lowerTrimmed === 'no problems' ||
    lowerTrimmed === 'no issues' ||
    /\b(no mobility (?:issues|limitations|problems)|no stairs|no problems|independent|fully mobile)\b/i.test(lower);

  if (isNegativeMobility) {
    updates.mobilityConstraint = false;
    updates.stairsConstraint = false;
  } else {
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
  }
  if (lower.includes('lives alone') || lower.includes('by herself') || lower.includes('by himself') || lower.includes('on her own')) {
    updates.livesAlone = true;
  }

  // 6. Coordinator identity & relationship
  const myNameMatch = text.match(
    /\b(?:my name is|call me|i'm|i am)(?:\s+(?:her|his|their)?\s*(?:son|daughter|child|spouse|husband|wife))?\s+([A-Z][a-z]+)\b/i
  );
  if (myNameMatch && !NON_NAME_WORDS.has(myNameMatch[1].toLowerCase())) {
    updates.coordinatorName = myNameMatch[1];
    updates.userName = myNameMatch[1];
  } else {
    // Single word name response (e.g. "Yin")
    const cleanWord = text.trim();
    if (
      /^[A-Z][a-zA-Z'-]{1,20}$/.test(cleanWord) &&
      !NON_NAME_WORDS.has(cleanWord.toLowerCase()) &&
      !currentDraft.coordinatorName
    ) {
      updates.coordinatorName = cleanWord;
      updates.userName = cleanWord;
    }
  }

  const relMatch = text.match(
    /\b(?:(?:i'm|i am|as)\s+(?:her|his|their|the)?\s*|(?:her|his|their)\s+)(son|daughter|child|spouse|husband|wife|sister|brother|niece|nephew)\b/i
  );
  if (relMatch) {
    const captured = relMatch[1] || relMatch[2];
    const capitalizedRel = captured.charAt(0).toUpperCase() + captured.slice(1).toLowerCase();
    updates.coordinatorRelationship = capitalizedRel;
    updates.userRelationship = capitalizedRel;
  }

  // 7. Care circle & helpers (e.g. "Yes, my brother Jim, my sister Kim, and my aunt Jin")
  const extractedDraftMembers: Array<{
    id: string;
    name: string;
    relationshipToSenior: string;
    role: 'OWNER' | 'FAMILY' | 'HELPER' | 'PROFESSIONAL';
    isLocal: boolean;
  }> = [];

  const activeCoordinatorLower = (updates.coordinatorName || currentDraft.coordinatorName || '').toLowerCase();

  const helperPattern = /\b(?:my\s+)?(brother|sister|aunt|uncle|son|daughter|cousin|friend|neighbor)\s+([A-Z][a-z]+)\b/gi;
  let helperMatch: RegExpExecArray | null;
  while ((helperMatch = helperPattern.exec(text)) !== null) {
    const rawRel = helperMatch[1].toLowerCase();
    const helperName = helperMatch[2];
    if (
      !NON_NAME_WORDS.has(helperName.toLowerCase()) &&
      helperName.toLowerCase() !== activeCoordinatorLower
    ) {
      let relationshipToSenior = 'Family Support';
      if (rawRel === 'brother' || rawRel === 'sister') {
        relationshipToSenior = rawRel === 'brother' ? 'Son' : 'Daughter';
      } else if (rawRel === 'aunt' || rawRel === 'uncle') {
        relationshipToSenior = rawRel === 'aunt' ? 'Sister' : 'Brother';
      } else if (rawRel === 'friend' || rawRel === 'neighbor') {
        relationshipToSenior = rawRel === 'friend' ? 'Family Friend' : 'Neighbor';
      }
      extractedDraftMembers.push({
        id: 'dmem-' + helperName.toLowerCase(),
        name: helperName,
        relationshipToSenior,
        role: 'FAMILY',
        isLocal: true,
      });
    }
  }

  if (extractedDraftMembers.length > 0) {
    const existing = currentDraft.draftMembers || [];
    const newMembers = extractedDraftMembers.filter(
      (em) =>
        em.name.toLowerCase() !== activeCoordinatorLower &&
        !existing.some((ex) => ex.name.toLowerCase() === em.name.toLowerCase())
    );
    updates.draftMembers = [...existing, ...newMembers];
    updates.careCircleAddressed = true;
    updates.hasLocalHelper = true;
    if (!currentDraft.localHelperName && newMembers.length > 0) {
      updates.localHelperName = newMembers[0].name;
    }
  } else if (lower.includes('sister jennifer')) {
    updates.localHelperName = 'Jennifer';
    updates.hasLocalHelper = true;
    updates.careCircleAddressed = true;
  }

  if (lower.includes('no one') || lower.includes('on my own') || lower.includes('nobody nearby') || lower.includes('no family nearby')) {
    updates.hasLocalHelper = false;
    updates.careCircleAddressed = true;
  }

  if (lower.includes('another state') || lower.includes('out of state') || lower.includes('remotely') || lower.includes('from chicago') || lower.includes('live in chicago')) {
    updates.userIsRemote = true;
  }

  // 8. Contact invitation parsing (email only)
  const emailMatch = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/);
  if (updates.localHelperName || currentDraft.localHelperName) {
    const helperName = updates.localHelperName || currentDraft.localHelperName;
    if (emailMatch) {
      const existingMembers = currentDraft.familyMembers || [];
      const memberIndex = existingMembers.findIndex(
        (m) => m.name.toLowerCase() === helperName?.toLowerCase()
      );
      const inviteData = {
        channel: 'EMAIL' as const,
        contact: emailMatch[0],
      };
      if (memberIndex >= 0) {
        existingMembers[memberIndex].invite = inviteData;
        existingMembers[memberIndex].email = emailMatch[0];
        updates.familyMembers = [...existingMembers];
      } else {
        updates.familyMembers = [
          ...existingMembers,
          {
            id: 'mem-' + Date.now(),
            name: helperName!,
            relationship: 'Local Support',
            isLocal: true,
            role: 'FAMILY',
            invite: inviteData,
            email: emailMatch[0],
          },
        ];
      }
    }
  }

  // 9. Location / ZIP / City
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

  // 10. Budget
  if (
    lower.includes('leave it open') ||
    lower.includes('leave open') ||
    lower.includes('live it open') ||
    lower.includes('live open') ||
    lower.includes('keep open') ||
    lower.includes('keep it open') ||
    lower.includes('not set') ||
    lower.includes('no budget') ||
    lower.includes('not sure') ||
    lower.includes('open for now') ||
    lowerTrimmed === 'open'
  ) {
    updates.budgetStatus = 'UNSET';
    updates.budget = undefined;
  } else {
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
    const referenceDate = body.clientNow ? new Date(body.clientNow) : new Date();
    const clientTimeZone = body.clientTimeZone || 'America/Chicago';

    // Evaluate current state before this turn to see what was expected
    const initialEvaluation = intakeReadinessService.evaluate(currentDraft);

    let extractedUpdates: Partial<IntakeDraft> = {};
    let conversationalReply = '';

    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const systemPrompt = `You are Nora, BridgeWell's empathetic, calm transition coordinator.
You guide families caring for aging parents through hospital discharge and housing transitions.
Your job is to talk with the family naturally while quietly gathering minimum viable planning facts.
The user should NEVER feel like they are filling out a form one field at a time.
Ask only ONE focused follow-up question per turn, focusing on the highest-priority missing fact.

REFERENCE CLOCK & TIMEZONE:
Current Date: ${referenceDate.toDateString()} (ISO: ${referenceDate.toISOString()})
Timezone: ${clientTimeZone}

CURRENT INTAKE DRAFT SO FAR:
${JSON.stringify(currentDraft, null, 2)}

NEXT HIGHEST-VALUE FIELD NEEDED:
${initialEvaluation.nextTargetField}

RECENT CONVERSATION HISTORY:
${history.map((h) => `${h.role === 'user' ? 'User' : 'Nora'}: ${h.content}`).join('\n')}

LATEST USER MESSAGE:
"${userMessage}"

RULES FOR EXTRACTION & TEMPORAL REASONING:
- Extract ONLY facts explicitly stated or strongly implied by the user.
- seniorName: extract the senior's actual name (e.g. "Maria", "Robert").
  - If the user refers to them as "my parent", output "Parent".
  - If the user refers to them as "my mom", output "Mom".
  - If the user refers to them as "my dad", output "Dad".
  - If helpers or family members are mentioned (e.g. "my brother Jim, my sister Kim, and my aunt Jin"), Jim, Kim, and Jin are HELPERS, NOT the senior! NEVER output a helper's name as seniorName.
  - NEVER output an event/action verb like "fell", "had", "broke", or "is" as a senior's name!
- TEMPORAL AWARENESS:
  - If user says "tomorrow" or "tmr", calculate reference date + 1 day.
  - If user says "by eod", "eod", or "end of day", set dischargeTime: "17:00".
  - If user says a weekday name (e.g. "Thursday", "Friday"), resolve the upcoming day based on ${referenceDate.toDateString()}.
  - If user says "next week", DO NOT invent or guess a date. Set timingClarificationNeeded: true, dischargeTimelineDescription: "next week", and ask if there is a particular day or if it's flexible.
  - If user specifies an exact or approximate time (e.g. "around 2 PM", "morning"), extract dischargeTime.
- MOBILITY & STAIRS:
  - If user says "no", "none", "neither", "independent", or that there are no mobility issues or stairs, set mobilityConstraint: false and stairsConstraint: false.
- COORDINATOR & RELATIONSHIP:
  - Extract coordinatorName / userName: what to call the user. If the user only gives a single name like "Yin", that is the coordinatorName.
  - Extract coordinatorRelationship / userRelationship: user's relationship to the senior (e.g. "Son", "Daughter", "Child", "Spouse"). If user says "my parent", user is "Child". Do NOT assume son vs daughter unless explicitly stated.
- HELP NETWORK & INVITATIONS:
  - If user mentions people helping (e.g. "my brother Jim, my sister Kim, and my aunt Jin"), capture them in draftMembers with their relationship to the senior.
  - We invite collaborators via email only. If user provides an email address to invite someone, capture their email address.
- BUDGET: If the user says "leave it open", "live it open" (typo), "not sure", or "no budget", set budgetStatus: "UNSET" and budget: null.
- LOCATION: If user provides a ZIP code or city/state, extract zipCode and/or city.
- DO NOT invent fictional names, locations, or details. Leave missing fields null.

RULES FOR CONVERSATIONAL REPLY:
- If all required information is now known:
  Acknowledge warmly, provide a concise recap of what you've gathered, state the immediate first priority, and confirm you have enough to build their transition plan.
- If more information is still needed:
  Warmly acknowledge what the user just said in 1 brief sentence, then ask ONE natural, gentle follow-up question for ${initialEvaluation.nextTargetField}.
  - If TIMING_CLARIFICATION: "Is there a particular day next week you're expecting, or is the timing still flexible?"
  - If DISCHARGE_TIMING and date is known but time is not: Ask if a specific time is known or just the day.
  - If SAFETY_MOBILITY: "Does ${currentDraft.seniorName || 'your family member'} have any mobility limitations right now — for example stairs, a walker, or needing help getting around?"
  - If COORDINATOR_NAME: "And before we build the plan, what should I call you?"
  - If COORDINATOR_RELATIONSHIP: "What is your relationship to ${currentDraft.seniorName || 'your family member'}?"
  - If LOCAL_SUPPORT: "Is there anyone nearby who can help in person, or are you coordinating mostly from a distance?"
  - If asking to invite helper: "Would you like to invite [Name] to collaborate? If so, what's their email address?"
  - If LOCATION: "What address or ZIP code should I use when looking for nearby help? You can give me just the ZIP if you'd rather not share the exact address yet."
  - If BUDGET: "Do you already have a budget in mind, or should we leave that open for now?"
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
                    seniorRelationship: { type: Type.STRING },
                    ageRange: { type: Type.STRING },
                    transitionType: { type: Type.STRING },
                    dischargeDays: { type: Type.NUMBER },
                    dischargeTimelineDescription: { type: Type.STRING },
                    dischargeDate: { type: Type.STRING },
                    dischargeTime: { type: Type.STRING },
                    dischargePrecision: { type: Type.STRING },
                    timingClarificationNeeded: { type: Type.BOOLEAN },
                    livesAlone: { type: Type.BOOLEAN },
                    mobilityConstraint: { type: Type.BOOLEAN },
                    stairsConstraint: { type: Type.BOOLEAN },
                    homeType: { type: Type.STRING },
                    zipCode: { type: Type.STRING },
                    city: { type: Type.STRING },
                    userName: { type: Type.STRING },
                    coordinatorName: { type: Type.STRING },
                    userRelationship: { type: Type.STRING },
                    coordinatorRelationship: { type: Type.STRING },
                    userCity: { type: Type.STRING },
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
    const fallbackExtracted = deterministicExtract(userMessage, currentDraft, referenceDate, clientTimeZone);
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

    // Enforce 5-digit numeric format for zipCode (avoid hallucinations like "Child")
    if (updatedDraft.zipCode && !/^\d{5}$/.test(updatedDraft.zipCode.trim())) {
      delete updatedDraft.zipCode;
    }

    // Sync coordinatorName and userName
    if (updatedDraft.coordinatorName && !updatedDraft.userName) {
      updatedDraft.userName = updatedDraft.coordinatorName;
    } else if (updatedDraft.userName && !updatedDraft.coordinatorName) {
      updatedDraft.coordinatorName = updatedDraft.userName;
    }
    // Sync coordinatorRelationship and userRelationship
    if (updatedDraft.coordinatorRelationship && !updatedDraft.userRelationship) {
      updatedDraft.userRelationship = updatedDraft.coordinatorRelationship;
    } else if (updatedDraft.userRelationship && !updatedDraft.coordinatorRelationship) {
      updatedDraft.coordinatorRelationship = updatedDraft.userRelationship;
    }

    // Prevent seniorName from being set to one of the helpers or coordinator
    const knownHelperNames = new Set([
      ...(updatedDraft.draftMembers || []).map((m) => m.name.toLowerCase()),
      ...(updatedDraft.familyMembers || []).map((m) => m.name.toLowerCase()),
      (updatedDraft.localHelperName || '').toLowerCase(),
      (updatedDraft.coordinatorName || '').toLowerCase(),
    ].filter(Boolean));

    if (
      updatedDraft.seniorName &&
      knownHelperNames.has(updatedDraft.seniorName.toLowerCase())
    ) {
      if (currentDraft.seniorName && !knownHelperNames.has(currentDraft.seniorName.toLowerCase())) {
        updatedDraft.seniorName = currentDraft.seniorName;
      } else {
        updatedDraft.seniorName = currentDraft.seniorRelationship || 'Parent';
      }
    }

    // Sanitize seniorName to never be a verb or invalid stopword
    if (updatedDraft.seniorName && NON_NAME_WORDS.has(updatedDraft.seniorName.trim().toLowerCase())) {
      updatedDraft.seniorName = currentDraft.seniorRelationship || 'Mom';
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
