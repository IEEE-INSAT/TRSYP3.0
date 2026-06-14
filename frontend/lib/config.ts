/**
 * Centralised runtime configuration.
 *
 * Every value is read from `NEXT_PUBLIC_*` env vars (see `.env.example`).
 * Nothing here throws when a value is missing — instead we expose booleans so
 * the rest of the app can gracefully fall back to a local/offline placeholder
 * mode until the backend (and Supabase project) are ready.
 */

export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '');

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

/** True once a backend base URL is configured. */
export const isApiConfigured = API_URL.length > 0;

/** True once Supabase credentials are present — enables real authentication. */
export const isSupabaseConfigured =
  SUPABASE_URL.length > 0 && SUPABASE_ANON_KEY.length > 0;

/**
 * Feature flags for backend routes that are not live yet. Flip the matching
 * env var to "true" once the endpoint exists; until then the service layer
 * uses local placeholders so the UI keeps working.
 */
export const features = {
  /** POST /registration, GET /registration/profile, ... */
  registrationApi: process.env.NEXT_PUBLIC_FEATURE_REGISTRATION_API === 'true',
  /** GET /registration/admin/participants and moderation endpoints. */
  adminApi: process.env.NEXT_PUBLIC_FEATURE_ADMIN_API === 'true',
} as const;
