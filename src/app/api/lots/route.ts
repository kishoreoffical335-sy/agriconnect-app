import { NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseServerConfigured } from '@/lib/supabaseServer';
import { supabase as supabaseAnon, isSupabaseConfigured } from '@/lib/supabaseClient';
import { generateUUID } from '@/lib/store';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fpoId = searchParams.get('fpo_id');

    const client = isSupabaseServerConfigured ? supabaseAdmin : (isSupabaseConfigured ? supabaseAnon : null);

    if (client) {
      let query = client.from('lots').select('*, lot_listings(*)').order('created_at', { ascending: false });
      if (fpoId) {
        query = query.eq('fpo_id', fpoId);
      }
      const { data, error } = await query;
      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true, data: data || [], source: 'supabase' });
    }

    return NextResponse.json({ success: true, data: [], source: 'demo' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fpo_id, listing_ids, crop, total_quantity_kg, quality, listings } = body;

    if (!fpo_id || !listing_ids || !Array.isArray(listing_ids) || listing_ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: fpo_id and non-empty listing_ids array' },
        { status: 400 }
      );
    }

    const client = isSupabaseServerConfigured ? supabaseAdmin : (isSupabaseConfigured ? supabaseAnon : null);

    let resolvedCrop = crop;
    let resolvedQuality = quality;
    let resolvedTotalQty = total_quantity_kg;
    let listingQuantities: { id: string; quantity_kg: number }[] = [];

    if (listings && Array.isArray(listings) && listings.length > 0) {
      resolvedCrop = resolvedCrop || listings[0]?.crop || 'Tomato';
      resolvedQuality = resolvedQuality || listings[0]?.quality || 'Grade A';
      resolvedTotalQty = resolvedTotalQty || listings.reduce((sum: number, l: any) => sum + (l.quantity_kg || 0), 0);
      listingQuantities = listings.map((l: any) => ({ id: l.id, quantity_kg: l.quantity_kg || 0 }));
    } else if (client) {
      // Fetch listings from Supabase to compute totals accurately
      const { data: dbListings, error: fetchErr } = await client
        .from('farmer_listings')
        .select('*')
        .in('id', listing_ids);

      if (fetchErr) {
        return NextResponse.json({ success: false, error: fetchErr.message }, { status: 500 });
      }

      if (!dbListings || dbListings.length === 0) {
        return NextResponse.json({ success: false, error: 'No matching farmer listings found' }, { status: 404 });
      }

      resolvedCrop = resolvedCrop || dbListings[0].crop;
      resolvedQuality = resolvedQuality || dbListings[0].quality;
      resolvedTotalQty = resolvedTotalQty || dbListings.reduce((sum, l) => sum + l.quantity_kg, 0);
      listingQuantities = dbListings.map((l) => ({ id: l.id, quantity_kg: l.quantity_kg }));
    } else {
      resolvedCrop = resolvedCrop || 'Tomato';
      resolvedQuality = resolvedQuality || 'Grade A';
      resolvedTotalQty = resolvedTotalQty || 1000;
      listingQuantities = listing_ids.map((id: string) => ({ id, quantity_kg: 1000 }));
    }

    const newLot = {
      id: body.id || generateUUID(),
      fpo_id,
      crop: resolvedCrop,
      total_quantity_kg: Number(resolvedTotalQty),
      quality: resolvedQuality,
      status: 'created',
      created_at: new Date().toISOString(),
    };

    const newLotListings = listingQuantities.map((item) => ({
      id: generateUUID(),
      lot_id: newLot.id,
      farmer_listing_id: item.id,
      quantity_kg: item.quantity_kg,
      created_at: new Date().toISOString(),
    }));

    if (client) {
      // 1. Insert Lot
      const { error: lotErr } = await client.from('lots').insert(newLot);
      if (lotErr) {
        return NextResponse.json({ success: false, error: lotErr.message }, { status: 500 });
      }

      // 2. Insert Lot Listings Junction
      const { error: junctionErr } = await client.from('lot_listings').insert(newLotListings);
      if (junctionErr) {
        return NextResponse.json({ success: false, error: junctionErr.message }, { status: 500 });
      }

      // 3. Update Farmer Listings status to 'lotted'
      const { error: updateErr } = await client
        .from('farmer_listings')
        .update({ status: 'lotted' })
        .in('id', listing_ids);

      if (updateErr) {
        console.warn('Failed to update farmer listings status in database:', updateErr);
      }

      return NextResponse.json(
        {
          success: true,
          data: {
            lot: newLot,
            lot_listings: newLotListings,
          },
          persisted: true,
        },
        { status: 201 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          lot: newLot,
          lot_listings: newLotListings,
        },
        persisted: false,
        message: 'Aggregated in demo mode (Supabase not configured)',
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
