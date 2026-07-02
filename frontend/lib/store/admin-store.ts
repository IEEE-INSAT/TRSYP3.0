import { create } from 'zustand';
import { adminService } from '../api/admin.service';
import { useAuthStore } from './auth-store';
import type {
  AdminChallenger,
  AdminParticipant,
  AdminStatus,
} from '../admin/types';

interface AdminState {
  /** Whether the current user has been verified as an admin via the backend. */
  authed: boolean;
  /** True while verifyAdmin() is in flight. */
  verifying: boolean;
  participants: AdminParticipant[];
  challengers: AdminChallenger[];
  loaded: boolean;

  /** Verify admin status by calling GET /admin/me with the current Supabase token. */
  verifyAdmin: () => Promise<boolean>;
  lock: () => void;
  load: () => Promise<void>;

  setParticipantStatus: (id: string, status: AdminStatus) => Promise<void>;
  deleteParticipant: (id: string) => Promise<void>;
  setChallengerStatus: (id: string, status: AdminStatus) => Promise<void>;
  deleteChallenger: (id: string) => Promise<void>;

  getParticipant: (id: string) => AdminParticipant | undefined;
  getChallenger: (id: string) => AdminChallenger | undefined;
}

/**
 * Admin store — single source of truth for the admin area.
 *
 * Auth is NO LONGER persisted to localStorage. On each admin page load the
 * `AdminGate` calls `verifyAdmin()`, which hits `GET /admin/me` (guarded by
 * SupabaseAuthGuard + AdminGuard on the backend). This ensures only real admins
 * registered in the Prisma `Admin` table can access the admin panel.
 */
export const useAdminStore = create<AdminState>()(
  (set, get) => ({
    authed: false,
    verifying: false,
    participants: [],
    challengers: [],
    loaded: false,

    verifyAdmin: async () => {
      set({ verifying: true });
      try {
        const token = await useAuthStore.getState().getAccessToken();
        if (!token) {
          set({ authed: false, verifying: false });
          return false;
        }
        const admin = await adminService.verifyAdmin(token);
        const isAdmin = !!admin;
        set({ authed: isAdmin, verifying: false });
        return isAdmin;
      } catch {
        set({ authed: false, verifying: false });
        return false;
      }
    },

    lock: () => set({ authed: false }),

    load: async () => {
      const data = await adminService.loadRegistrations();
      set({
        participants: data.participants,
        challengers: data.challengers,
        loaded: true,
      });
    },

    setParticipantStatus: async (id, status) => {
      const data = await adminService.setParticipantStatus(id, status);
      set({ participants: data.participants });
    },

    deleteParticipant: async (id) => {
      const data = await adminService.deleteParticipant(id);
      set({ participants: data.participants });
    },

    setChallengerStatus: async (id, status) => {
      const data = await adminService.setChallengerStatus(id, status);
      set({ challengers: data.challengers });
    },

    deleteChallenger: async (id) => {
      const data = await adminService.deleteChallenger(id);
      set({ challengers: data.challengers });
    },

    getParticipant: (id) => get().participants.find((p) => p.id === id),
    getChallenger: (id) => get().challengers.find((c) => c.id === id),
  }),
);
