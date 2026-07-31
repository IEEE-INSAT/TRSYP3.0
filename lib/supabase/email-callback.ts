import type {
  EmailOtpType,
  Session,
  SupabaseClient,
} from '@supabase/supabase-js';

type CallbackResult = { session: Session | null; error: string | null };

let activeCallback:
  | { url: string; promise: Promise<CallbackResult> }
  | null = null;

/**
 * Consumes every Supabase confirmation/recovery callback format before pages
 * call getSession(). Static hosting does not provide a server callback.
 */
export async function consumeEmailCallback(
  supabase: SupabaseClient,
): Promise<string | null> {
  const fragment = new URLSearchParams(window.location.hash.slice(1));
  const accessToken = fragment.get('access_token');
  const refreshToken = fragment.get('refresh_token');

  if (accessToken && refreshToken) {
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (!error) {
      // OAuth implicit flow puts live credentials in the fragment. Remove them
      // as soon as Supabase has persisted the session so they cannot leak via
      // screenshots, copied URLs, browser history, or crash reports.
      window.history.replaceState(
        {},
        document.title,
        `${window.location.pathname}${window.location.search}`,
      );
    }
    return error?.message ?? null;
  }

  const query = new URLSearchParams(window.location.search);
  const callbackError =
    query.get('error_description') ?? query.get('error');
  if (callbackError) return callbackError;

  const code = query.get('code');
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return null;

    // supabase-js may already have exchanged the code automatically.
    const { data } = await supabase.auth.getSession();
    return data.session ? null : error.message;
  }

  const tokenHash = query.get('token_hash');
  const type = query.get('type');
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as EmailOtpType,
    });
    return error?.message ?? null;
  }

  return null;
}

/**
 * Supabase processes detected URL callbacks asynchronously. Wait briefly for
 * that work (or our explicit callback handling) before declaring a link bad.
 */
export async function waitForEmailCallbackSession(
  supabase: SupabaseClient,
): Promise<CallbackResult> {
  const callbackUrl = window.location.href;

  // React Strict Mode mounts effects twice in development. Reuse the exact
  // same exchange instead of spending a one-time OAuth code twice.
  if (activeCallback?.url === callbackUrl) return activeCallback.promise;

  const promise = (async (): Promise<CallbackResult> => {
    const callbackError = await consumeEmailCallback(supabase);
    let lastSessionError: string | null = null;

    // Remote auth storage and browser events can settle a little after the URL
    // exchange returns. A refresh used to "fix" this because the session had
    // finished persisting by then; wait here instead.
    for (let attempt = 0; attempt < 100; attempt += 1) {
      const { data, error } = await supabase.auth.getSession();
      if (data.session) return { session: data.session, error: null };
      if (error) lastSessionError = error.message;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    return {
      session: null,
      error: callbackError ?? lastSessionError ?? 'Authentication timed out.',
    };
  })();

  activeCallback = { url: callbackUrl, promise };
  return promise;
}
