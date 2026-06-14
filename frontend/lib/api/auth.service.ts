import { apiFetch } from './http';
import type { BackendUser, SyncUserPayload } from './types';

/**
 * Auth service — wired to the backend routes that already exist
 * (`backend/src/modules/auth`). All token-protected calls expect the Supabase
 * access token obtained from the auth store.
 */
export const authService = {
  /** POST /auth/sync-user — upsert the Prisma `User` from the Supabase identity. */
  syncUser(payload: SyncUserPayload, token: string): Promise<BackendUser> {
    return apiFetch<BackendUser>('/auth/sync-user', {
      method: 'POST',
      body: payload,
      token,
    });
  },

  /** GET /auth/me — current user profile. */
  getMe(token: string): Promise<BackendUser> {
    return apiFetch<BackendUser>('/auth/me', { token });
  },

  /** POST /auth/reset-password — public endpoint, sends a reset email. */
  resetPassword(email: string): Promise<{ message: string }> {
    return apiFetch<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: { email },
    });
  },
};
