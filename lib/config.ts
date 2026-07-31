/**
 * Centralised runtime configuration.
 *
 * Every value is read from `NEXT_PUBLIC_*` env vars (see `.env.example`).
 * Nothing here throws when a value is missing - instead we expose booleans so
 * the rest of the app can gracefully fall back to a local/offline placeholder
 * mode until the backend (and Supabase project) are ready.
 */

export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '');

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

/** True once a backend base URL is configured. */
export const isApiConfigured = API_URL.length > 0;

/** True once Supabase credentials are present - enables real authentication. */
export const isSupabaseConfigured =
  SUPABASE_URL.length > 0 && SUPABASE_ANON_KEY.length > 0;

/**
 * Feature flags for backend routes that are not live yet. Flip the matching
 * env var to "true" once the endpoint exists; until then the service layer
 * uses local placeholders so the UI keeps working.
 */
/**
 * Master switch for public registration. Set to `false` to temporarily close
 * registration - the Register CTAs render disabled. Flip back to `true` to
 * reopen. (Temporary hold - expected back tomorrow.)
 */
export const REGISTRATION_OPEN = true;

/**
 * Master switch for public log-in. Set to `false` to temporarily hide the
 * Log In CTA in the navbar. Flip back to `true` to reopen.
 */
export const LOGIN_OPEN = true;

export const features = {
  /** POST /registration, GET /registration/profile, ... */
  registrationApi: process.env.NEXT_PUBLIC_FEATURE_REGISTRATION_API === 'true',
} as const;

/**
 * Team registration window for one activity.
 * - `soon`   - announced, but creating/joining is not possible yet.
 * - `open`   - fully live.
 * - `closed` - the window has passed; existing teams stay visible and
 *              manageable, but no new ones can be created or joined.
 */
export type RegistrationPhase = 'soon' | 'open' | 'closed';

function readPhase(value: string | undefined, fallback: RegistrationPhase): RegistrationPhase {
  const phase = value?.trim().toLowerCase();
  return phase === 'soon' || phase === 'open' || phase === 'closed' ? phase : fallback;
}

/**
 * Per-activity registration windows. These mirror the backend's
 * `COMPETITION_REGISTRATION_PHASE` / `CHALLENGE_REGISTRATION_PHASE` env vars -
 * the backend is the one that actually enforces them, these only decide what
 * the UI offers, so keep the two in sync when flipping a window.
 */
export const activityPhases = {
  competition: readPhase(process.env.NEXT_PUBLIC_COMPETITION_PHASE, 'open'),
  challenge: readPhase(process.env.NEXT_PUBLIC_CHALLENGE_PHASE, 'soon'),
} as const satisfies Record<'competition' | 'challenge', RegistrationPhase>;
