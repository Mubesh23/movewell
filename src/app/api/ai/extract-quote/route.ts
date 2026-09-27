import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req: NextRequest) {
  try {
    const { documentText, fileName, isSample } = await req.json();

    // Explicit Sample Demo Path
    if (isSample) {
      const sampleQuote = {
        providerName: 'Caring Transitions of Greater Houston',
        moveDate: '2026-10-18',
        movingAmount: 1350,
        packingAmount: 600,
        materialsAmount: 200,
        totalAmount: 2150,
        depositAmount: 500,
        notes: 'Full-service senior rightsizing, packing, loading, transport, and room setup.',
      };
      return NextResponse.json({ success: true, quote: sampleQuote, isSample: true });
    }

    if (!documentText || typeof documentText !== 'string' || !documentText.trim()) {
      return NextResponse.json(
        { success: false, error: 'Document text or content is required for extraction.' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'Quote extraction service is temporarily unavailable (API key not configured).' },
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
                text: `Analyze this vendor quote / contract document and extract structured cost details.

DOCUMENT CONTENT (${fileName || 'Quote Document'}):
"${documentText}"

Extract JSON with these fields:
- providerName: string (Exact company / provider name from document)
- moveDate: string (YYYY-MM-DD or descriptive date from document)
- movingAmount: number (base transport cost)
- packingAmount: number (packing labor cost)
- materialsAmount: number (boxes/supplies cost)
- totalAmount: number (total quote price)
- depositAmount: number (required deposit if specified)
- notes: string (key inclusions or scope)`,
              },
            ],
          },
        ],
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              providerName: { type: Type.STRING },
              moveDate: { type: Type.STRING },
              movingAmount: { type: Type.NUMBER },
              packingAmount: { type: Type.NUMBER },
              materialsAmount: { type: Type.NUMBER },
              totalAmount: { type: Type.NUMBER },
              depositAmount: { type: Type.NUMBER },
              notes: { type: Type.STRING },
            },
            required: ['providerName', 'totalAmount'],
          },
        },
      });

      if (!response.text) {
        return NextResponse.json(
          { success: false, error: 'Unable to reliably extract quote details from the submitted document.' },
          { status: 422 }
        );
      }

      const parsed = JSON.parse(response.text);
      if (!parsed.providerName || !parsed.totalAmount) {
        return NextResponse.json(
          { success: false, error: 'Document does not appear to contain a valid provider name and quote total.' },
          { status: 422 }
        );
      }

      return NextResponse.json({ success: true, quote: parsed });
    } catch (aiErr: any) {
      console.warn('[QuoteExtractionAPI] Gemini quote extraction failed:', aiErr);
      return NextResponse.json(
        { success: false, error: 'Unable to reliably extract quote details from the submitted document.' },
        { status: 422 }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
