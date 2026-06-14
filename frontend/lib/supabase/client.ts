import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY, isSupabaseConfigured } from '../config';

/**
 * Lazily-created browser Supabase client (singleton).
 *
 * Returns `null` when Supabase is not configured, which lets the auth store
 * fall back to an offline placeholder session. The backend authenticates by
 * verifying the Supabase JWT, so this client is the source of access tokens
 * once real credentials are provided.
 */
let cached: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (!cached) {
    cached = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return cached;
}
