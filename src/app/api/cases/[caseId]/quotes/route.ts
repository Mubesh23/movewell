import { NextRequest, NextResponse } from 'next/server';
import { repository } from '@/db/repository';
import { eventService } from '@/services/event-service';
import { requireCaseAccess } from '@/lib/auth-guards';
import { CostItem } from '@/types';

export async function POST(
  req: NextRequest,
  { params }: { params: { caseId: string } }
) {
  try {
    const access = await requireCaseAccess(req, params.caseId);
    if (!access.authorized) {
      return NextResponse.json(
        { success: false, error: access.error || 'Access denied' },
        { status: access.status }
      );
    }

    const { quote, documentName } = await req.json();

    if (!quote || !quote.totalAmount || !quote.providerName) {
      return NextResponse.json(
        { success: false, error: 'A valid quote object with providerName and totalAmount is required.' },
        { status: 400 }
      );
    }

    const costItem: CostItem = {
      id: 'cost-' + Math.random().toString(36).substring(2, 9),
      caseId: params.caseId,
      category: 'moving',
      description: `${quote.providerName} - Confirmed Moving & Rightsizing Quote`,
      source: 'QUOTE',
      amount: Number(quote.totalAmount),
      providerName: quote.providerName,
      documentName: documentName || 'Quote Document',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await repository.saveCostItem(costItem);

    // Record Event: QUOTE_APPLIED
    await eventService.recordEvent(
      params.caseId,
      'QUOTE_APPLIED',
      {
        costItemId: costItem.id,
        amount: costItem.amount,
        providerName: costItem.providerName,
        category: costItem.category,
      },
      'USER',
      access.userId
    );

    return NextResponse.json({ success: true, data: costItem });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
