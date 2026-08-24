import { NextResponse } from 'next/server';
import {
  SEEDED_USERS,
  SEEDED_FPOS,
  SEEDED_FARMER_LISTINGS,
  SEEDED_BUYER_DEMANDS,
  SEEDED_MANDI_PRICES,
} from '@/lib/seedData';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';

export async function POST() {
  try {
    if (isSupabaseConfigured && supabase) {
      // Clear transactional tables in Supabase if configured
      await supabase.from('settlement_lines').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('settlements').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('route_stops').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('pickup_routes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('matches').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('lot_listings').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('lots').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('farmer_listings').delete().neq('id', '00000000-0000-0000-0000-000000000000');

      // Re-insert initial listings
      await supabase.from('farmer_listings').insert(SEEDED_FARMER_LISTINGS as any);
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
