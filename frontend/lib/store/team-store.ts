import { create } from 'zustand';
import { useAuthStore } from './auth-store';
import { registrationService } from '../api/registration.service';
import type { Team } from '../api/types';

export type TeamRole = 'leader' | 'member';

interface TeamState {
  team: Team | null;
  role: TeamRole | null;
  loaded: boolean;
  loading: boolean;
  submitting: boolean;
  error: string | null;

  fetchTeam: () => Promise<void>;
  createTeam: (name: string, size: number) => Promise<void>;
  joinTeam: (code: string) => Promise<void>;
  leaveTeam: () => Promise<void>;
  disbandTeam: () => Promise<void>;
  removeMember: (participantId: string) => Promise<void>;
  reset: () => void;
}

function msg(e: unknown): string {
  return e instanceof Error ? e.message : 'Something went wrong';
}

function roleFromTeam(team: Team | null): TeamRole | null {
  if (!team) return null;
  // The leader is the only member who receives the join `code`.
  if (team.code) return 'leader';
  const me = team.members.find((m) => m.participantId === 'me');
  return me?.isLeader ? 'leader' : 'member';
}

async function currentToken(): Promise<string> {
  return (await useAuthStore.getState().getAccessToken()) ?? '';
}

/**
 * Team store — drives Page 2 of the registration flow (create / join / status).
 * Backed by the registration service (real `/registration/team*` routes once
 * `features.registrationApi` is on, local placeholder otherwise).
 */
export const useTeamStore = create<TeamState>((set) => ({
  team: null,
  role: null,
  loaded: false,
  loading: false,
  submitting: false,
  error: null,

  fetchTeam: async () => {
    set({ loading: true, error: null });
    try {
      const team = await registrationService.getTeam(await currentToken());
      set({ team, role: roleFromTeam(team), loading: false, loaded: true });
    } catch (e) {
      set({ loading: false, loaded: true, error: msg(e) });
    }
  },

  createTeam: async (name, size) => {
    set({ submitting: true, error: null });
    try {
      const team = await registrationService.createTeam({ name, size }, await currentToken());
      set({ team, role: roleFromTeam(team) ?? 'leader', submitting: false, loaded: true });
    } catch (e) {
      set({ submitting: false, error: msg(e) });
      throw e;
    }
  },

  joinTeam: async (code) => {
    set({ submitting: true, error: null });
    try {
      const team = await registrationService.joinTeam(code, await currentToken());
      set({ team, role: roleFromTeam(team) ?? 'member', submitting: false, loaded: true });
    } catch (e) {
      set({ submitting: false, error: msg(e) });
      throw e;
    }
  },

  leaveTeam: async () => {
    set({ submitting: true, error: null });
    try {
      await registrationService.leaveTeam(await currentToken());
      set({ team: null, role: null, submitting: false });
    } catch (e) {
      set({ submitting: false, error: msg(e) });
      throw e;
    }
  },

  disbandTeam: async () => {
    set({ submitting: true, error: null });
    try {
      await registrationService.disbandTeam(await currentToken());
      set({ team: null, role: null, submitting: false });
    } catch (e) {
      set({ submitting: false, error: msg(e) });
      throw e;
    }
  },

  removeMember: async (participantId) => {
    set({ submitting: true, error: null });
    try {
      const team = await registrationService.removeMember(participantId, await currentToken());
      set({ team, role: roleFromTeam(team), submitting: false });
    } catch (e) {
      set({ submitting: false, error: msg(e) });
      throw e;
    }
  },

  reset: () => set({ team: null, role: null, error: null, loaded: false }),
}));
