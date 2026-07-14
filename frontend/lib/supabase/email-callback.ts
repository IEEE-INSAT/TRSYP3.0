import type { EmailOtpType, SupabaseClient } from '@supabase/supabase-js';

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
