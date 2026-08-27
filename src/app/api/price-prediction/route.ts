import { NextRequest, NextResponse } from 'next/server';
import { predictPrice } from '@/lib/pricePrediction';
import { SEEDED_MANDI_PRICES } from '@/lib/seedData';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const crop = typeof body?.crop === 'string' ? body.crop : '';

    if (!crop.trim()) {
      return NextResponse.json({ error: 'crop is required' }, { status: 400 });
    }

    const result = predictPrice(
      {
        crop,
        quantityKg: Number(body.quantityKg) || undefined,
        demandKg: Number(body.demandKg) || undefined,
        supplyKg: Number(body.supplyKg) || undefined,
        quality: typeof body.quality === 'string' ? body.quality : undefined,
        currentPrice: Number(body.currentPrice) || undefined,
      },
      SEEDED_MANDI_PRICES,
    );

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to predict price';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
