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
        // PKCE is the secure flow for browser/SPA clients: the OAuth and
        // email-confirmation code exchange is bound to a per-session verifier,
        // so an intercepted `code` in the URL can't be redeemed by an attacker.
        flowType: 'pkce',
      },
    });
  }
  return cached;
}
