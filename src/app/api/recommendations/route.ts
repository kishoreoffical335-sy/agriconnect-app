import { NextRequest, NextResponse } from 'next/server';
import { generateFarmerRecommendation } from '@/lib/recommendationEngine';
import { SEEDED_BUYER_DEMANDS, SEEDED_MANDI_PRICES, SEEDED_USERS, SEEDED_FPOS } from '@/lib/seedData';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const crop = typeof body?.crop === 'string' ? body.crop : 'Tomato';
    const quantityKg = Number(body?.quantityKg) || 2000;
    const quality = typeof body?.quality === 'string' ? body.quality : 'Grade A';
    const village = typeof body?.village === 'string' ? body.village : 'Kanchipuram';
    const expectedPricePerKg = Number(body?.expectedPricePerKg) || 24;

    const recommendation = generateFarmerRecommendation(
      {
        crop,
        quantityKg,
        quality,
        village,
        expectedPricePerKg,
      },
      {
        buyerDemands: SEEDED_BUYER_DEMANDS,
        mandiPrices: SEEDED_MANDI_PRICES,
        users: SEEDED_USERS,
        fpos: SEEDED_FPOS,
      }
    );

    return NextResponse.json(recommendation);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to generate recommendation';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
