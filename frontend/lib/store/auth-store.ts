import { create } from 'zustand';
import { getSupabaseClient } from '../supabase/client';
import { authService } from '../api/auth.service';
import { ApiError } from '../api/http';
import { isApiConfigured } from '../config';
import { useRegistrationStore } from './registration-store';
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
  email: string | null;
  initialized: boolean;
  loading: boolean;
  /** True from the moment sign-out starts until the redirect. Lets route-guarded
   *  pages skip their own redirect so they don't race signOut's navigation. */
  signingOut: boolean;
  error: string | null;

  initialize: () => Promise<void>;
  signUp: (input: SignUpInput) => Promise<void>;
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
  email: null,
  initialized: false,
  loading: false,
  signingOut: false,
  error: null,

  initialize: async () => {
    if (get().initialized) return;
    const supabase = getSupabaseClient();
    if (supabase) {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token ?? null;
      set({ accessToken: token, email: data.session?.user.email ?? null });
      if (token && isApiConfigured) {
        let tokenValid = true;
        try {
          set({ account: await authService.getMe(token) });
        } catch (err) {
          // A 401 here means the token is dead (e.g. an expired session that
          // survived a failed sign-out). Clear it so the UI shows guest actions
          // instead of a phantom logged-in state.
          if (err instanceof ApiError && err.status === 401) {
            tokenValid = false;
            set({ accessToken: null, account: null, email: null });
            try {
              await supabase.auth.signOut({ scope: 'local' });
            } catch {
              /* storage already inconsistent — nothing more to do */
            }
          } else {
            console.error('[auth] getMe failed during init:', err);
          }
        }
        // Re-derive registration state from the backend on every authenticated
        // load (reloads fire INITIAL_SESSION, not SIGNED_IN, so the listener
        // below wouldn't cover this path).
        if (tokenValid)
          void useRegistrationStore.getState().hydrateFromBackend();
      }
      supabase.auth.onAuthStateChange(async (event, session) => {
        const token = session?.access_token ?? null;
        set({
          accessToken: token,
          email: session?.user.email ?? null,
        });

        if (event === 'SIGNED_IN' && token && isApiConfigured) {
          try {
            set({ account: await authService.getMe(token) });
          } catch (err: any) {
            console.error('[auth] getMe failed in onAuthStateChange:', err);
          }
          void useRegistrationStore.getState().hydrateFromBackend();
        }
      });
    }
    set({ initialized: true });
  },

  signUp: async ({ email, password, name, lastName }) => {
    set({ loading: true, error: null });
    try {
      if (isApiConfigured) {
        await authService.signUp({ email, password, name, lastName });
        set({ loading: false });
        return;
      }

      const supabase = getSupabaseClient();
      if (!supabase) {
        // Offline placeholder — no real account yet.
        set({ accessToken: `offline:${email}`, email, loading: false });
        return;
      }
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name, lastName } },
      });
      if (error) {
        // Supabase enforces email uniqueness — translate its error into a
        // friendly, actionable message instead of a pre-flight check.
        if (
          error.code === 'user_already_exists' ||
          /already registered/i.test(error.message)
        ) {
          throw new Error(
            'An account with this email already exists. Please sign in instead.',
          );
        }
        throw new Error(error.message);
      }

      const token = data.session?.access_token ?? null;
      set({ accessToken: token, email });

      if (token && isApiConfigured) {
        try {
          set({ account: await authService.getMe(token) });
        } catch (err: any) {
          console.error('[auth] getMe failed during signUp:', err);
        }
      }
      set({ loading: false });
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

      const token = data.session?.access_token ?? null;
      set({ accessToken: token, email });
      if (token && isApiConfigured) {
        try {
          set({ account: await authService.getMe(token) });
        } catch (getErr) {
          console.error('[auth] getMe failed during signIn:', getErr);
        }
        // Reconcile the registration profile before we hand control back to the
        // caller, so post-login routing can tell an already-registered user
        // (→ dashboard) from a new one (→ registration flow). hydrateFromBackend
        // swallows its own errors, so this never rejects the sign-in.
        await useRegistrationStore.getState().hydrateFromBackend();
      }
      set({ loading: false });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Sign in failed';
      set({ loading: false, error: message });
      throw e;
    }
  },

  signOut: async () => {
    // Mark sign-out in progress FIRST so route-guarded pages (e.g. the
    // dashboard) don't fire their own redirect and race the one below —
    // two competing navigations abort each other ("this page couldn't load").
    set({ signingOut: true, accessToken: null, account: null, email: null });
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        // `scope: 'local'` wipes the persisted browser session without the
        // network POST to GoTrue that the default 'global' scope performs. For a
        // long-lived session the access token is already expired, so that POST
        // can hang or reject — and on rejection supabase-js may leave the session
        // in localStorage. The redirect below then reloads into a stale session
        // that reads back as "still logged in". Local scope clears storage
        // reliably; the timeout guarantees a hung call can never block the
        // redirect.
        await Promise.race([
          supabase.auth.signOut({ scope: 'local' }),
          new Promise((resolve) => setTimeout(resolve, 2000)),
        ]);
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
    return {
      message: 'If an account exists, a password reset email has been sent',
    };
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
