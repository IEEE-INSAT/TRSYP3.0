import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useAuthStore } from './auth-store';
import { useRegistrationStore } from './registration-store';
import { registrationService } from '../api/registration.service';
import type { Team, TeamActivity } from '../api/types';

export type TeamRole = 'leader' | 'member';

/** Per-activity map - one slot for the competition, one for the challenge. */
type ByActivity<T> = Record<TeamActivity, T>;

const emptyByActivity = <T,>(value: T): ByActivity<T> => ({
  COMPETITION: value,
  CHALLENGE: value,
});

interface TeamState {
  /** Activity the UI is currently showing. Every action defaults to it. */
  activity: TeamActivity;
  teams: ByActivity<Team | null>;
  roles: ByActivity<TeamRole | null>;
  /** Whether a fetch has completed - gates the "no team yet" empty state. */
  loaded: boolean;
  loading: boolean;
  submitting: boolean;
  error: string | null;

  setActivity: (activity: TeamActivity) => void;
  /** Loads every activity's team in one request. */
  fetchTeams: () => Promise<void>;
  createTeam: (name: string, size: number, activity?: TeamActivity) => Promise<void>;
  updateTeam: (name?: string, size?: number, activity?: TeamActivity) => Promise<void>;
  joinTeam: (code: string, activity?: TeamActivity) => Promise<void>;
  leaveTeam: (activity?: TeamActivity) => Promise<void>;
  disbandTeam: (activity?: TeamActivity) => Promise<void>;
  removeMember: (participantId: string, activity?: TeamActivity) => Promise<void>;
  reset: () => void;
  clearError: () => void;
}

function msg(e: unknown): string {
  return e instanceof Error ? e.message : 'Something went wrong';
}

function roleFromTeam(team: Team | null): TeamRole | null {
  if (!team) return null;
  const myParticipantId = useRegistrationStore.getState().user?.participantId;
  if (myParticipantId && myParticipantId === team.leaderId) return 'leader';
  return 'member';
}

async function currentToken(): Promise<string> {
  return (await useAuthStore.getState().getAccessToken()) ?? '';
}

/** Selectors for the currently selected activity - the common read path. */
export const selectTeam = (s: TeamState): Team | null => s.teams[s.activity];
export const selectRole = (s: TeamState): TeamRole | null => s.roles[s.activity];

/**
 * Team store - drives Page 2 of the registration flow (create / join / status)
 * for both the competition and the technical challenge. A participant can hold
 * one team per activity, so state is keyed by activity throughout and each
 * action falls back to whichever activity the UI has selected.
 *
 * Backed by the registration service (real `/registration/team*` routes once
 * `features.registrationApi` is on, local placeholder otherwise).
 */
export const useTeamStore = create<TeamState>()(
  persist(
    (set, get) => ({
      activity: 'COMPETITION',
      teams: emptyByActivity<Team | null>(null),
      roles: emptyByActivity<TeamRole | null>(null),
      loaded: false,
      loading: false,
      submitting: false,
      error: null,

      setActivity: (activity) => set({ activity, error: null }),

      fetchTeams: async () => {
        if (get().loading) return;
        set({ loading: true, error: null });
        try {
          const { competition, challenge } = await registrationService.getTeams(
            await currentToken(),
          );
          set({
            teams: { COMPETITION: competition, CHALLENGE: challenge },
            roles: {
              COMPETITION: roleFromTeam(competition),
              CHALLENGE: roleFromTeam(challenge),
            },
            loading: false,
            loaded: true,
          });
        } catch (e) {
          set({ loading: false, loaded: true, error: msg(e) });
        }
      },

      createTeam: async (name, size, activity) => {
        const target = activity ?? get().activity;
        if (get().submitting) return;
        set({ submitting: true, error: null });
        try {
          const team = await registrationService.createTeam(
            { name, size, activity: target },
            await currentToken(),
          );
          set((s) => ({
            teams: { ...s.teams, [target]: team },
            roles: { ...s.roles, [target]: roleFromTeam(team) ?? 'leader' },
            submitting: false,
            loaded: true,
          }));
        } catch (e) {
          set({ submitting: false, error: msg(e) });
          throw e;
        }
      },

      updateTeam: async (name, size, activity) => {
        const target = activity ?? get().activity;
        if (get().submitting) return;
        set({ submitting: true, error: null });
        try {
          const team = await registrationService.updateTeam(
            { name, size },
            await currentToken(),
            target,
          );
          set((s) => ({ teams: { ...s.teams, [target]: team }, submitting: false }));
        } catch (e) {
          set({ submitting: false, error: msg(e) });
          throw e;
        }
      },

      joinTeam: async (code, activity) => {
        const target = activity ?? get().activity;
        if (get().submitting) return;
        set({ submitting: true, error: null });
        try {
          const team = await registrationService.joinTeam(code, await currentToken(), target);
          // The server decides the activity from the code, so trust the
          // response over the tab the user happened to be on.
          const slot = team.activity ?? target;
          set((s) => ({
            teams: { ...s.teams, [slot]: team },
            roles: { ...s.roles, [slot]: roleFromTeam(team) ?? 'member' },
            activity: slot,
            submitting: false,
            loaded: true,
          }));
        } catch (e) {
          set({ submitting: false, error: msg(e) });
          throw e;
        }
      },

      leaveTeam: async (activity) => {
        const target = activity ?? get().activity;
        if (get().submitting) return;
        set({ submitting: true, error: null });
        try {
          await registrationService.leaveTeam(await currentToken(), target);
          set((s) => ({
            teams: { ...s.teams, [target]: null },
            roles: { ...s.roles, [target]: null },
            submitting: false,
          }));
        } catch (e) {
          set({ submitting: false, error: msg(e) });
          throw e;
        }
      },

      disbandTeam: async (activity) => {
        const target = activity ?? get().activity;
        if (get().submitting) return;
        set({ submitting: true, error: null });
        try {
          await registrationService.disbandTeam(await currentToken(), target);
          set((s) => ({
            teams: { ...s.teams, [target]: null },
            roles: { ...s.roles, [target]: null },
            submitting: false,
          }));
        } catch (e) {
          set({ submitting: false, error: msg(e) });
          throw e;
        }
      },

      removeMember: async (participantId, activity) => {
        const target = activity ?? get().activity;
        if (get().submitting) return;
        set({ submitting: true, error: null });
        try {
          const team = await registrationService.removeMember(
            participantId,
            await currentToken(),
            target,
          );
          set((s) => ({
            teams: { ...s.teams, [target]: team },
            roles: { ...s.roles, [target]: roleFromTeam(team) },
            submitting: false,
          }));
        } catch (e) {
          set({ submitting: false, error: msg(e) });
          throw e;
        }
      },

      reset: () =>
        set({
          teams: emptyByActivity<Team | null>(null),
          roles: emptyByActivity<TeamRole | null>(null),
          error: null,
          loaded: false,
        }),
      clearError: () => set({ error: null }),
    }),
    {
      // Cache the teams so the dashboard renders instantly on reload and merely
      // refreshes in the background - avoids the "info pops in / takes time to
      // change" flash. `loaded`/`loading` stay transient so a refetch still runs.
      name: 'trsyp_team_store',
      version: 2,
      partialize: (state) => ({
        teams: state.teams,
        roles: state.roles,
        activity: state.activity,
      }),
      // v1 stored a single `team`/`role` pair, which was always the competition.
      migrate: (persisted, version) => {
        type Persisted = Pick<TeamState, 'teams' | 'roles' | 'activity'>;
        if (version >= 2) return persisted as Persisted;

        const legacy = persisted as { team?: Team | null; role?: TeamRole | null };
        return {
          activity: 'COMPETITION',
          teams: { COMPETITION: legacy?.team ?? null, CHALLENGE: null },
          roles: { COMPETITION: legacy?.role ?? null, CHALLENGE: null },
        } satisfies Persisted;
      },
    },
  ),
);
