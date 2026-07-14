import { apiFetch } from './http';
import type { BackendUser } from './types';

/**
 * Auth service — wired to the backend routes that already exist
 * (`backend/src/modules/auth`). All token-protected calls expect the Supabase
 * access token obtained from the auth store.
 */
export const authService = {
  /** GET /auth/me — current user profile. */
  getMe(token: string): Promise<BackendUser> {
    return apiFetch<BackendUser>('/auth/me', { token });
  },

  /** POST /auth/check-email — checks if email is registered. */
  checkEmail(email: string): Promise<{ message: string }> {
    return apiFetch<{ message: string }>('/auth/check-email', {
      method: 'POST',
      body: { email },
    });
  },

  /**
   * POST /auth/validate-email — verifies the domain has MX records.
   * Runs on the backend because the static-export frontend has no Node runtime
   * for DNS lookups. Returns `{ valid, reason? }`.
   */
  validateEmailDomain(
    email: string,
  ): Promise<{ valid: boolean; reason?: string }> {
    return apiFetch<{ valid: boolean; reason?: string }>(
      '/auth/validate-email',
      {
        method: 'POST',
        body: { email },
      },
    );
  },
};
