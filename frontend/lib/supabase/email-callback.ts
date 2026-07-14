import type {
  EmailOtpType,
  Session,
  SupabaseClient,
} from '@supabase/supabase-js';

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
    return error?.message ?? null;
  }

  const query = new URLSearchParams(window.location.search);
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
): Promise<{ session: Session | null; error: string | null }> {
  const callbackError = await consumeEmailCallback(supabase);

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const { data, error } = await supabase.auth.getSession();
    if (data.session) return { session: data.session, error: null };
    if (error) return { session: null, error: error.message };
    await new Promise((resolve) => setTimeout(resolve, 150));
  }

  return { session: null, error: callbackError };
}
