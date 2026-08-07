// ---------------------------------------------------------------------------
// Supabase client (optional).
// The app runs entirely on the local persisted store when these env vars are
// absent, so nothing here is required to develop or demo. When configured,
// this client is the seam for auth + a real Postgres database matching
// /supabase/schema.sql.
// ---------------------------------------------------------------------------

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabaseEnabled = Boolean(url && anonKey)

export const supabase: SupabaseClient | null = supabaseEnabled
  ? createClient(url as string, anonKey as string)
  : null

export function assertSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error(
      'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env to enable auth and the hosted database.',
    )
  }
  return supabase
}
