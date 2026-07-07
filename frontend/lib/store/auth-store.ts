import { create } from 'zustand';
import { getSupabaseClient } from '../supabase/client';
import { authService } from '../api/auth.service';
import { isApiConfigured } from '../config';
import type { BackendUser } from '../api/types';

export interface SignUpInput {
  email: string;
  password: string;
  name: string;
  lastName: string;
  provider?: string;
}

interface AuthState {
  /** Supabase access token (Bearer) — null when signed out. */
  accessToken: string | null;
  /** Backend user row from /auth/me or /auth/sync-user. */
  account: BackendUser | null;
  /**
   * True while a sync-user/getMe call triggered by onAuthStateChange (e.g.
   * right after a Google OAuth redirect) is in flight. accessToken is set
   * synchronously as soon as Supabase confirms the session, but the backend
   * User row is only guaranteed to exist once this flips back to false.
   * UI that gates on being "logged in" should also check !syncing to avoid
   * hitting endpoints before the DB user is ready.
   */
  syncing: boolean;
  email: string | null;
  initialized: boolean;
  loading: boolean;
  error: string | null;

  initialize: () => Promise<void>;
  signUp: (input: SignUpInput) => Promise<{ emailConfirmationPending: boolean }>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ message: string }>;
  getAccessToken: () => Promise<string | null>;
}

/**
 * Authentication store.
 *
 * When Supabase is configured it owns the real auth lifecycle (sign up / in /
 * out) and syncs the user to the backend via /auth/sync-user. When it is NOT
 * configured the store runs in an offline placeholder mode: it records a local
 * token so the rest of the app behaves consistently until credentials are added.
 */
export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  account: null,
  syncing: false,
  email: null,
  initialized: false,
  loading: false,
  error: null,

  initialize: async () => {
    if (get().initialized) return;
    const supabase = getSupabaseClient();
    if (supabase) {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token ?? null;
      set({ accessToken: token, email: data.session?.user.email ?? null });
      if (token && isApiConfigured) {
        try {
          set({ account: await authService.getMe(token) });
        } catch (err) {
          console.error('[auth] getMe failed during init:', err);
        }
      }
      supabase.auth.onAuthStateChange(async (event, session) => {
        const token = session?.access_token ?? null;
        set({
          accessToken: token,
          email: session?.user.email ?? null,
        });

        // After Google (or any OAuth) sign-in, sync the user to the backend.
        if (event === 'SIGNED_IN' && token && isApiConfigured) {
          set({ syncing: true });
          try {
            const user = session?.user;
            const meta = user?.user_metadata ?? {};
            set({
              account: await authService.syncUser(
                {
                  email: user?.email ?? '',
                  name: meta.full_name?.split(' ')[0] ?? meta.name ?? '',
                  lastName: meta.full_name?.split(' ').slice(1).join(' ') ?? meta.lastName ?? '',
                  provider: user?.app_metadata?.provider ?? 'google',
                },
                token,
              ),
            });
          } catch (err) {
            console.error('[auth] syncUser failed in onAuthStateChange:', err);
          } finally {
            set({ syncing: false });
          }
        }
      });
    }
    set({ initialized: true });
  },

  signUp: async ({ email, password, name, lastName, provider = 'email' }) => {
    set({ loading: true, error: null });
    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        // Offline placeholder — no real account yet.
        set({ accessToken: `offline:${email}`, email, loading: false });
        return { emailConfirmationPending: false };
      }
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name, lastName } },
      });
      if (error) throw new Error(error.message);

      const token = data.session?.access_token ?? null;
      set({ accessToken: token, email });

      // If Supabase requires email confirmation, data.session will be null.
      // The user must verify their email before they can sign in.
      if (!token) {
        set({ loading: false });
        return { emailConfirmationPending: true };
      }

      // If the project doesn't require email confirmation we already have a
      // session — sync the user into the backend immediately.
      if (isApiConfigured) {
        try {
          set({
            account: await authService.syncUser(
              { email, name, lastName, provider },
              token,
            ),
          });
        } catch {
          /* non-fatal: profile can be synced on next sign-in */
        }
      }
      set({ loading: false });
      return { emailConfirmationPending: false };
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Sign up failed';
      set({ loading: false, error: message });
      throw e;
    }
  },

  signIn: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        set({ accessToken: `offline:${email}`, email, loading: false });
        return;
      }
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw new Error(error.message);

      // ── Email confirmation gate ──────────────────────────────────────
      // Supabase may return a valid session even if the user hasn't
      // confirmed their email. Block login and sign them back out.
      const user = data.session?.user;
      if (user && !user.email_confirmed_at) {
        await supabase.auth.signOut();
        throw new Error('Please confirm your email address before logging in. Check your inbox for the verification link.');
      }

      const token = data.session?.access_token ?? null;
      set({ accessToken: token, email });
      if (token && isApiConfigured) {
        try {
          // Try to fetch the existing user from the backend
          set({ account: await authService.getMe(token) });
        } catch (getErr) {
          console.error('[auth] getMe failed during signIn:', getErr);
          // User not in DB yet (first login after email verification) — sync them
          try {
            const meta = data.session?.user?.user_metadata ?? {};
            set({
              account: await authService.syncUser(
                {
                  email,
                  name: meta.name ?? meta.full_name?.split(' ')[0] ?? '',
                  lastName: meta.lastName ?? meta.full_name?.split(' ').slice(1).join(' ') ?? '',
                  provider: 'email',
                },
                token,
              ),
            });
          } catch (syncErr) {
            console.error('[auth] syncUser failed during signIn:', syncErr);
          }
        }
      }
      set({ loading: false });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Sign in failed';
      set({ loading: false, error: message });
      throw e;
    }
  },

  signOut: async () => {
    set({ accessToken: null, account: null, email: null });
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.error('[auth] Supabase sign out error:', err);
      }
    }
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  },

  resetPassword: async (email) => {
    if (isApiConfigured) return authService.resetPassword(email);
    // Offline placeholder: mirror the backend's privacy-preserving response.
    return { message: 'If an account exists, a password reset email has been sent' };
  },

  getAccessToken: async () => {
    const supabase = getSupabaseClient();
    if (!supabase) return get().accessToken;
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token ?? null;
    if (token !== get().accessToken) set({ accessToken: token });
    return token;
  },
}));
