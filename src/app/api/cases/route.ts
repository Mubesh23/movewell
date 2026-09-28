import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  return NextResponse.json(
    {
      success: false,
      error:
        'Direct case creation is disabled. Please start your transition plan with Nora at /get-started and review your draft proposal before activation.',
    },
    { status: 400 }
  );
}
