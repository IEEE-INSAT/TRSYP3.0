import { apiFetch } from './http';
import { features } from '../config';
import type { BackendAdmin, CreateAdminPayload } from './types';
import type {
  AdminRegistrations,
  AdminStatus,
} from '../admin/types';
import { generateSeedData } from '../admin/seed';

const STORAGE_KEY = 'trsyp_registrations';

// ── Local placeholder persistence for registrations ───────────────────────────

function readLocal(): AdminRegistrations {
  if (typeof window === 'undefined') return { participants: [], challengers: [] };
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      return JSON.parse(raw) as AdminRegistrations;
    } catch {
      /* fall through to reseed */
    }
  }
  const seeded = generateSeedData();
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
  return seeded;
}

function writeLocal(data: AdminRegistrations): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/**
 * Admin service.
 *
 * `verifyAdmin` calls `GET /admin/me` (guarded by SupabaseAuthGuard +
 * AdminGuard on the backend) to check whether the currently signed-in
 * Supabase user is an admin.
 *
 * `createAdmin` / `deleteAccount` are wired to the live backend routes.
 * The registration listing & moderation methods are PLACEHOLDERS backed by
 * local storage + seed data because the backend `/registration/admin/*` routes
 * live in the un-wired registration module.
 */
export const adminService = {
  /**
   * Verify admin status by calling the backend.
   * Returns the admin profile on success, null if the user is not an admin.
   */
  async verifyAdmin(token: string): Promise<BackendAdmin | null> {
    try {
      return await apiFetch<BackendAdmin>('/admin/me', { token });
    } catch {
      // 401 (not logged in) or 403 (not an admin) — treat both as "not admin"
      return null;
    }
  },

  /** POST /admin/create-admin (requires an admin Supabase token). */
  createAdmin(payload: CreateAdminPayload, token: string): Promise<BackendAdmin> {
    return apiFetch<BackendAdmin>('/admin/create-admin', {
      method: 'POST',
      body: payload,
      token,
    });
  },

  /** POST /admin/delete-account (requires an admin Supabase token). */
  deleteAccount(supabaseId: string, token: string): Promise<{ message: string }> {
    return apiFetch<{ message: string }>('/admin/delete-account', {
      method: 'POST',
      body: { supabaseId },
      token,
    });
  },

  /**
   * Load all registrations.
   * TODO(backend): GET /registration/admin/participants (+ a challengers route
   * once the team model exists). Map the paged backend response into
   * `AdminRegistrations` here when `features.adminApi` is enabled.
   */
  async loadRegistrations(): Promise<AdminRegistrations> {
    if (features.adminApi) {
      // const { data } = await apiFetch(...); return mapToAdminRegistrations(data);
    }
    return readLocal();
  },

  /**
   * Update a participant's status.
   * TODO(backend): POST /registration/admin/participants/:id/{ban|unban|...}.
   */
  async setParticipantStatus(
    id: string,
    status: AdminStatus,
  ): Promise<AdminRegistrations> {
    const data = readLocal();
    const idx = data.participants.findIndex((p) => p.id === id);
    if (idx >= 0) data.participants[idx].status = status;
    writeLocal(data);
    return data;
  },

  /** Delete a participant. TODO(backend): DELETE /registration/admin/participants/:id. */
  async deleteParticipant(id: string): Promise<AdminRegistrations> {
    const data = readLocal();
    data.participants = data.participants.filter((p) => p.id !== id);
    writeLocal(data);
    return data;
  },

  /** Update a challenger team's status. TODO(backend): teams not modelled yet. */
  async setChallengerStatus(
    id: string,
    status: AdminStatus,
  ): Promise<AdminRegistrations> {
    const data = readLocal();
    const idx = data.challengers.findIndex((c) => c.id === id);
    if (idx >= 0) data.challengers[idx].status = status;
    writeLocal(data);
    return data;
  },

  /** Delete a challenger team. TODO(backend): teams not modelled yet. */
  async deleteChallenger(id: string): Promise<AdminRegistrations> {
    const data = readLocal();
    data.challengers = data.challengers.filter((c) => c.id !== id);
    writeLocal(data);
    return data;
  },
};
