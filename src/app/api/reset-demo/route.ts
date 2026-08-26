import { NextResponse } from 'next/server';
import {
  SEEDED_USERS,
  SEEDED_FPOS,
  SEEDED_FARMER_LISTINGS,
  SEEDED_BUYER_DEMANDS,
  SEEDED_MANDI_PRICES,
} from '@/lib/seedData';
import { supabaseAdmin, isSupabaseServerConfigured } from '@/lib/supabaseServer';
import { supabase as supabaseAnon, isSupabaseConfigured } from '@/lib/supabaseClient';

export async function POST() {
  try {
    const client = isSupabaseServerConfigured ? supabaseAdmin : (isSupabaseConfigured ? supabaseAnon : null);
    if (client) {
      // Clear transactional tables in Supabase if configured
      await client.from('settlement_lines').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await client.from('settlements').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await client.from('route_stops').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await client.from('pickup_routes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await client.from('matches').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await client.from('lot_listings').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await client.from('lots').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await client.from('farmer_listings').delete().neq('id', '00000000-0000-0000-0000-000000000000');

      // Re-insert initial listings
      await client.from('farmer_listings').insert(SEEDED_FARMER_LISTINGS as any);
    }

    return NextResponse.json({
      success: true,
      message: 'Demo state reset successfully',
      farmersSeeded: SEEDED_FARMER_LISTINGS.length,
      buyersSeeded: SEEDED_BUYER_DEMANDS.length,
    });
  } catch (error: any) {
    console.error('Reset error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
