import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { adminService } from '../api/admin.service';
import type {
  AdminChallenger,
  AdminParticipant,
  AdminStatus,
} from '../admin/types';

interface AdminState {
  /** Placeholder gate flag — see TODO in admin.service.ts. */
  authed: boolean;
  participants: AdminParticipant[];
  challengers: AdminChallenger[];
  loaded: boolean;

  unlock: (password: string) => boolean;
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
 * Admin store — single source of truth for the admin area. Registration data is
 * fetched through the admin service (placeholder local data today, real
 * `/registration/admin/*` once `features.adminApi` is enabled). Only the auth
 * flag is persisted.
 */
export const useAdminStore = create<AdminState>()(
  persist(
    (set, get) => ({
      authed: false,
      participants: [],
      challengers: [],
      loaded: false,

      unlock: (password) => {
        const ok = adminService.verifyPassword(password);
        if (ok) set({ authed: true });
        return ok;
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
    {
      name: 'trsyp_admin_auth',
      partialize: (state) => ({ authed: state.authed }),
    },
  ),
);
