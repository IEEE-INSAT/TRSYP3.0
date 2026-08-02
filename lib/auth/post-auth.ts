/**
 * Post-authentication destination handling.
 *
 * Two of the auth paths (Google OAuth, the email-verification link) leave the
 * site and come back as a *fresh page load*, so the route the user was heading
 * for cannot be kept in React state. It travels two ways instead:
 *
 * 1. a `?next=` param on the redirect URL - survives anything, including the
 *    link being opened on another device;
 * 2. a localStorage copy - survives the mail client opening the link in a brand
 *    new tab (which would wipe sessionStorage), and covers the case where
 *    Supabase drops the query string.
 *
 * Everything here is deliberately free of store imports so it stays a pure,
 * cycle-free module - callers pass `isRegistered` in.
 */

const NEXT_PARAM = 'next';
const NEXT_STORAGE_KEY = 'trsyp_post_auth_next';

/** Where the OAuth round-trip comes back to. Trailing slash: `trailingSlash: true`. */
const AUTH_CALLBACK_PATH = '/auth/callback/';

/**
 * Where a freshly authenticated user goes when nothing more specific was
 * requested. Never `/` - someone who just signed in has unfinished business,
 * and the landing page reads as "nothing happened".
 */
const DEFAULT_NEXT = '/register';

/**
 * Accept only same-origin absolute paths. Rejects protocol-relative (`//evil`)
 * and backslash (`/\evil`) forms, which browsers resolve as external hosts, so
 * a crafted `?next=` can't turn our own redirect into an open redirect.
 */
export function sanitizeNext(value: string | null | undefined): string | null {
  if (!value) return null;
  if (!value.startsWith('/')) return null;
  if (value.startsWith('//') || value.startsWith('/\\')) return null;
  // Never point back at the callback - that would loop.
  if (value.startsWith(AUTH_CALLBACK_PATH)) return null;
  return value;
}

/** Persist the intended destination across a full page reload. */
export function rememberNext(route: string | null | undefined): void {
  const safe = sanitizeNext(route);
  try {
    if (safe) window.localStorage.setItem(NEXT_STORAGE_KEY, safe);
    else window.localStorage.removeItem(NEXT_STORAGE_KEY);
  } catch {
    // Storage blocked (private mode) - the ?next= param still carries the intent.
  }
}

/**
 * Read the pending destination: `?next=` first, then the stored copy.
 * Non-destructive on purpose - a React effect may run twice in development, and
 * consuming on read would lose the value on the second pass. Call `clearNext()`
 * once, immediately before navigating.
 */
export function readNext(): string | null {
  const fromUrl = new URLSearchParams(window.location.search).get(NEXT_PARAM);
  const fromUrlSafe = sanitizeNext(fromUrl);
  if (fromUrlSafe) return fromUrlSafe;

  try {
    return sanitizeNext(window.localStorage.getItem(NEXT_STORAGE_KEY));
  } catch {
    return null;
  }
}

/** Drop the stored destination once it has been acted on. */
export function clearNext(): void {
  try {
    window.localStorage.removeItem(NEXT_STORAGE_KEY);
  } catch {
    /* nothing to clean up */
  }
}

/** Absolute URL for a Supabase redirect, carrying `next` when there is one. */
export function redirectUrl(path: string, next?: string | null): string {
  const url = new URL(path, window.location.origin);
  const safe = sanitizeNext(next);
  if (safe) url.searchParams.set(NEXT_PARAM, safe);
  return url.toString();
}

/** Absolute URL of the OAuth landing route. */
export function authCallbackUrl(next?: string | null): string {
  return redirectUrl(AUTH_CALLBACK_PATH, next);
}

/**
 * The single rule for "where does the user go once authenticated".
 *
 * An already-registered participant belongs on their dashboard; anyone else
 * continues to the route they asked for, and failing that to the registration
 * flow. `/` is never an answer here.
 *
 * The avatar deliberately plays no part in this. It is required, but only once
 * the user is registered, and `DashboardGate` enforces that inside the
 * dashboard - so signing in never detours through a character editor.
 */
export function resolvePostAuth({
  isRegistered,
  next,
}: {
  isRegistered: boolean;
  next?: string | null;
}): string {
  if (isRegistered) return '/dashboard';
  return sanitizeNext(next) ?? DEFAULT_NEXT;
}
