import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Stores a session delivered in the fragment of a Supabase confirmation or
 * recovery URL. Static hosting does not provide a server callback, so this
 * must run in the browser before pages call getSession().
 */
export async function consumeEmailCallback(
  supabase: SupabaseClient,
): Promise<string | null> {
  const fragment = new URLSearchParams(window.location.hash.slice(1));
  const accessToken = fragment.get('access_token');
  const refreshToken = fragment.get('refresh_token');

  if (!accessToken || !refreshToken) return null;

  const { error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  return error?.message ?? null;
}
