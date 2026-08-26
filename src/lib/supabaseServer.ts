import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const isSupabaseServerConfigured = Boolean(
  supabaseUrl &&
  supabaseServiceRoleKey &&
  !supabaseUrl.includes('your-supabase-url') &&
  !supabaseUrl.includes('your-project-id') &&
  !supabaseServiceRoleKey.includes('your-service-role-key')
);

/**
 * Server-side admin client using the Supabase Service Role Key.
 *
 * IMPORTANT SECURITY RULES:
 * - This file must ONLY be imported by Server Components, Server Actions, or API Route handlers.
 * - NEVER import or call this in client components ('use client').
 * - NEVER expose SUPABASE_SERVICE_ROLE_KEY via NEXT_PUBLIC_ variables.
 */
export const supabaseAdmin = isSupabaseServerConfigured
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

export function getSupabaseAdminClient() {
  if (!supabaseAdmin) {
    throw new Error(
      'Supabase server client is not configured. Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local'
    );
  }
  return supabaseAdmin;
}
