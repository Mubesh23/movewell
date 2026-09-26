import { NextRequest, NextResponse } from 'next/server';
import { resourceService } from '@/services/resource-service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category') || undefined;
    const zipCode = searchParams.get('zipCode') || undefined;

    const resources = await resourceService.findResources(category, zipCode);
    return NextResponse.json({ success: true, data: resources });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
