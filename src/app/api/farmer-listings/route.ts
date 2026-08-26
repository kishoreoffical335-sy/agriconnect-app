import { NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseServerConfigured } from '@/lib/supabaseServer';
import { supabase as supabaseAnon, isSupabaseConfigured } from '@/lib/supabaseClient';
import { SEEDED_FARMER_LISTINGS } from '@/lib/seedData';
import { generateUUID } from '@/lib/store';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const farmerId = searchParams.get('farmer_id');

    const client = isSupabaseServerConfigured ? supabaseAdmin : (isSupabaseConfigured ? supabaseAnon : null);

    if (client) {
      let query = client.from('farmer_listings').select('*').order('created_at', { ascending: false });
      if (farmerId) {
        query = query.eq('farmer_id', farmerId);
      }
      const { data, error } = await query;
      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true, data: data || [], source: 'supabase' });
    }

    // Demo fallback response
    let demoData = SEEDED_FARMER_LISTINGS;
    if (farmerId) {
      demoData = demoData.filter((l) => l.farmer_id === farmerId);
    }
    return NextResponse.json({ success: true, data: demoData, source: 'seed' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { farmer_id, crop, quantity_kg, quality, ready_date, expected_price_per_kg, village } = body;

    if (!farmer_id || !crop || !quantity_kg || !quality || !ready_date) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: farmer_id, crop, quantity_kg, quality, ready_date' },
        { status: 400 }
      );
    }

    if (Number(quantity_kg) <= 0) {
      return NextResponse.json(
        { success: false, error: 'quantity_kg must be greater than 0' },
        { status: 400 }
      );
    }

    const newListing = {
      id: body.id || generateUUID(),
      farmer_id,
      crop,
      quantity_kg: Number(quantity_kg),
      quality,
      ready_date,
      expected_price_per_kg: expected_price_per_kg ? Number(expected_price_per_kg) : 24.0,
      village: village || 'Kanchipuram',
      status: 'listed',
      created_at: new Date().toISOString(),
    };

    const client = isSupabaseServerConfigured ? supabaseAdmin : (isSupabaseConfigured ? supabaseAnon : null);

    if (client) {
      const { data, error } = await client.from('farmer_listings').insert(newListing).select().single();
      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true, data: data || newListing, persisted: true }, { status: 201 });
    }

    return NextResponse.json(
      {
        success: true,
        data: newListing,
        persisted: false,
        message: 'Saved in demo mode (Supabase not configured)',
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
