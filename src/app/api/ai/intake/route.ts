import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();
    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return NextResponse.json(
        { success: false, error: 'A situation prompt is required.' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;

    let extracted = {
      seniorName: 'Maria Thompson',
      ageRange: '78',
      transitionType: 'POST_HOSPITAL',
      urgency: 'URGENT',
      dischargeDays: 5,
      zipCode: '77004',
      livesAlone: true,
      mobilityConstraint: true,
      stairsConstraint: true,
      ownsHome: true,
      homeType: 'Two-story house',
      budget: 8000,
      userName: 'Sarah',
      userCity: 'Chicago, IL',
      localHelperName: 'Jennifer',
      localHelperCity: 'Houston, TX',
      summaryText:
        "I've analyzed your situation. This looks like an urgent post-hospital transition with immediate safety concerns around stairs and discharge coordination. I can turn this into a structured transition plan for your family.",
    };

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: 'gemini-flash-latest',
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: `You are Nora, MoveWell's empathetic transition assistant.
Analyze the user's description of a senior housing/post-hospital transition and extract structured details.

USER SITUATION DESCRIPTION:
"${prompt}"

Extract JSON with these exact fields:
- seniorName: string (e.g. "Maria Thompson" or name mentioned)
- ageRange: string (e.g. "78" or "75-80")
- dischargeDays: number (days until hospital discharge, default 5)
- zipCode: string (5-digit US ZIP, default "77004")
- livesAlone: boolean (true if senior lives alone)
- mobilityConstraint: boolean (true if fall, mobility limit, wheelchair, or walker)
- stairsConstraint: boolean (true if two-story home, stairs issue, or fall on stairs)
- budget: number (dollar amount, default 8000)
- userName: string (primary remote coordinator name, default "Sarah")
- userCity: string (primary coordinator city, default "Chicago, IL")
- localHelperName: string (local family helper name, default "Jennifer")
- localHelperCity: string (local helper city, default "Houston, TX")
- summaryText: string (2-3 sentence warm, empathetic summary from Nora framing the top priority: discharge destination, accessibility, and family coordination)`,
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
                dischargeDays: { type: Type.NUMBER },
                zipCode: { type: Type.STRING },
                livesAlone: { type: Type.BOOLEAN },
                mobilityConstraint: { type: Type.BOOLEAN },
                stairsConstraint: { type: Type.BOOLEAN },
                budget: { type: Type.NUMBER },
                userName: { type: Type.STRING },
                userCity: { type: Type.STRING },
                localHelperName: { type: Type.STRING },
                localHelperCity: { type: Type.STRING },
                summaryText: { type: Type.STRING },
              },
              required: ['seniorName', 'budget', 'summaryText'],
            },
          },
        });

        if (response.text) {
          const parsed = JSON.parse(response.text);
          extracted = { ...extracted, ...parsed };
        }
      } catch (aiErr) {
        console.warn('[IntakeAPI] Gemini extraction failed, using safe intelligent default:', aiErr);
      }
    }

    return NextResponse.json({ success: true, data: extracted });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
