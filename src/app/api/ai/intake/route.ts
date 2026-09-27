import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();
    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return NextResponse.json(
        { success: false, error: 'A situation description is required.' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          recoverable: true,
          error: "Intake analysis is temporarily unavailable. Please use our guided intake form.",
          nextAction: 'GUIDED_INTAKE',
        },
        { status: 503 }
      );
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `You are Nora, MoveWell's empathetic transition coordinator.
Analyze the user's description of a senior transition. Extract ONLY facts explicitly stated or strongly implied by the user.
DO NOT invent fictional names, locations, or family members. If a field is not mentioned, leave it undefined/empty or null.

USER DESCRIPTION:
"${prompt}"

Extract JSON:
- seniorName: string (Exact name of the senior mentioned, e.g. "Robert", "Maria Thompson", or "Dad" if name omitted)
- ageRange: string (Age or age range if mentioned, e.g. "82", "78", or null)
- transitionType: string ("POST_HOSPITAL" if hospital or rehab or fall mentioned, otherwise "PLANNED_DOWNSIZE")
- urgency: string ("URGENT" if discharge or fall or imminent timeline mentioned, otherwise "PLANNED")
- dischargeDays: number (Days until discharge if mentioned, otherwise null)
- zipCode: string (5-digit US ZIP code if mentioned, otherwise null)
- city: string (City mentioned, e.g. "Dallas", "Houston", or null)
- livesAlone: boolean (true if stated senior lives alone, otherwise null)
- mobilityConstraint: boolean (true if mobility, wheelchair, walker, or fall mentioned)
- stairsConstraint: boolean (true if stairs or two-story home mentioned)
- homeType: string (Home type if mentioned, e.g. "Two-story house", "Single story", "Apartment", or null)
- budget: number (Budget amount mentioned in dollars, e.g. 8000, or null)
- userName: string (Name of primary coordinator / user if mentioned, e.g. "Sarah", "Michael", or "Family Coordinator")
- userCity: string (City where primary coordinator lives, if mentioned)
- localHelperName: string (Local helper or relative mentioned, or null)
- localHelperCity: string (City of local helper, or null)
- summaryText: string (2-3 sentence empathetic summary from Nora addressing the senior by their real name and highlighting the top transition priorities)`,
              },
            ],
          },
        ],
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              seniorName: { type: Type.STRING },
              ageRange: { type: Type.STRING },
              transitionType: { type: Type.STRING },
              urgency: { type: Type.STRING },
              dischargeDays: { type: Type.NUMBER },
              zipCode: { type: Type.STRING },
              city: { type: Type.STRING },
              livesAlone: { type: Type.BOOLEAN },
              mobilityConstraint: { type: Type.BOOLEAN },
              stairsConstraint: { type: Type.BOOLEAN },
              homeType: { type: Type.STRING },
              budget: { type: Type.NUMBER },
              userName: { type: Type.STRING },
              userCity: { type: Type.STRING },
              localHelperName: { type: Type.STRING },
              localHelperCity: { type: Type.STRING },
              summaryText: { type: Type.STRING },
            },
            required: ['seniorName', 'summaryText'],
          },
        },
      });

      if (!response.text) {
        return NextResponse.json({
          success: false,
          recoverable: true,
          error: "I couldn't reliably interpret that description. Please try including the senior's name and situation, or use our guided form.",
          nextAction: 'GUIDED_INTAKE',
        });
      }

      const extracted = JSON.parse(response.text);

      // Verify that at least a senior reference or context was extracted
      if (!extracted.seniorName || extracted.seniorName.trim() === '') {
        return NextResponse.json({
          success: false,
          recoverable: true,
          error: "I couldn't identify the senior or family situation from that text. Please tell us a bit more, or use our guided intake form.",
          nextAction: 'GUIDED_INTAKE',
        });
      }

      const missingFields: string[] = [];
      if (!extracted.dischargeDays) missingFields.push('discharge timeline');
      if (!extracted.budget) missingFields.push('budget');
      if (!extracted.zipCode && !extracted.city) missingFields.push('location');

      return NextResponse.json({
        success: true,
        data: {
          seniorName: extracted.seniorName,
          ageRange: extracted.ageRange || undefined,
          transitionType: extracted.transitionType || 'POST_HOSPITAL',
          urgency: extracted.urgency || 'URGENT',
          dischargeDays: extracted.dischargeDays || undefined,
          zipCode: extracted.zipCode || undefined,
          city: extracted.city || undefined,
          livesAlone: extracted.livesAlone ?? undefined,
          mobilityConstraint: extracted.mobilityConstraint ?? undefined,
          stairsConstraint: extracted.stairsConstraint ?? undefined,
          homeType: extracted.homeType || undefined,
          budget: extracted.budget || undefined,
          userName: extracted.userName || undefined,
          userCity: extracted.userCity || undefined,
          localHelperName: extracted.localHelperName || undefined,
          localHelperCity: extracted.localHelperCity || undefined,
          summaryText: extracted.summaryText,
        },
        missingFields,
      });
    } catch (aiErr: any) {
      console.warn('[IntakeAPI] Gemini extraction failed:', aiErr);
      return NextResponse.json({
        success: false,
        recoverable: true,
        error: "I couldn't reliably interpret that description. Please try again with more details or use our guided form.",
        nextAction: 'GUIDED_INTAKE',
      });
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
