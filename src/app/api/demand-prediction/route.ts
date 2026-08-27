import { NextRequest, NextResponse } from 'next/server';
import { predictBuyerDemand } from '@/lib/demandPrediction';
import { SEEDED_BUYER_DEMANDS } from '@/lib/seedData';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const crop = typeof body?.crop === 'string' ? body.crop : 'Tomato';
    const location = typeof body?.location === 'string' ? body.location : 'Chennai Wholesale Terminal';
    const horizonDays = Number(body?.horizonDays) || 7;

    const result = predictBuyerDemand(
      {
        crop,
        location,
        horizonDays,
      },
      SEEDED_BUYER_DEMANDS
    );

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to predict demand';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
