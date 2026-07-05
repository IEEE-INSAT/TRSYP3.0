import { apiFetch } from './http';
import { features } from '../config';
import type {
  BackendParticipant,
  CreateTeamPayload,
  RegisterParticipantPayload,
  Team,
} from './types';

/**
 * Registration service — implements the registration flow spec
 * (participant info + teams).
 *
 * PLACEHOLDER STATUS: the backend `/registration/*` routes are not wired yet
 * (the module isn't imported into `app.module.ts`, and teams aren't modelled).
 * Every method contains the real call, guarded by `features.registrationApi`.
 * While the flag is off, participant calls resolve to `null` (the registration
 * store keeps the profile locally) and the team calls use a local-storage
 * simulation so the leader/member/status flow is demoable in one browser.
 * Flip NEXT_PUBLIC_FEATURE_REGISTRATION_API=true to go fully live.
 */

// ── Local placeholder team persistence ────────────────────────────────────────

const TEAM_KEY = 'trsyp_team';

function readLocalTeam(): Team | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(TEAM_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Team;
  } catch {
    return null;
  }
}

function writeLocalTeam(team: Team | null): void {
  if (typeof window === 'undefined') return;
  if (team) window.localStorage.setItem(TEAM_KEY, JSON.stringify(team));
  else window.localStorage.removeItem(TEAM_KEY);
}

function randomCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}

export const registrationService = {
  // ── Page 1: participant ─────────────────────────────────────────────────
  /** POST /registration — register the current Supabase user as a participant. */
  async register(
    payload: RegisterParticipantPayload,
    token: string,
  ): Promise<BackendParticipant | null> {
    if (!features.registrationApi) return null;
    return apiFetch<BackendParticipant>('/registration', {
      method: 'POST',
      body: payload,
      token,
    });
  },

  /** GET /registration/profile — the current user's participant profile. */
  async getProfile(token: string): Promise<BackendParticipant | null> {
    if (!features.registrationApi) return null;
    return apiFetch<BackendParticipant>('/registration/profile', { token });
  },

  // ── Page 2: teams ────────────────────────────────────────────────────────
  /** POST /registration/team — create a team, returns the team + join `code`. */
  async createTeam(payload: CreateTeamPayload, token: string): Promise<Team> {
    if (features.registrationApi) {
      return apiFetch<Team>('/registration/team', {
        method: 'POST',
        body: payload,
        token,
      });
    }
    const team: Team = {
      id: 'local-team',
      name: payload.name,
      size: payload.size,
      code: randomCode(),
      leaderId: 'me',
      memberCount: 1,
      spotsLeft: payload.size - 1,
      members: [
        { id: 'me', name: 'You', lastName: '(leader)', email: '', isLeader: true },
      ],
    };
    writeLocalTeam(team);
    return team;
  },

  /** PATCH /registration/team — leader updates team name/size. */
  async updateTeam(payload: { name?: string; size?: number }, token: string): Promise<Team> {
    if (features.registrationApi) {
      return apiFetch<Team>('/registration/team', {
        method: 'PATCH',
        body: payload,
        token,
      });
    }
    const team = readLocalTeam();
    if (!team) throw new Error('Not in a team');
    if (payload.name) team.name = payload.name;
    if (payload.size) team.size = payload.size;
    team.spotsLeft = team.size - team.memberCount;
    writeLocalTeam(team);
    return team;
  },

  /** POST /registration/team/join — join a team by 6-char code. */
  async joinTeam(code: string, token: string): Promise<Team> {
    if (features.registrationApi) {
      return apiFetch<Team>('/registration/team/join', {
        method: 'POST',
        body: { code },
        token,
      });
    }
    const team: Team = {
      id: 'local-team',
      name: `Team ${code}`,
      size: 1,
      code,
      leaderId: 'someone-else',
      memberCount: 1,
      spotsLeft: 0,
      members: [{ id: 'me', name: 'You', lastName: '', email: '', isLeader: false }],
    };
    writeLocalTeam(team);
    return team;
  },

  /** GET /registration/team — the current user's team, or null. */
  async getTeam(token: string): Promise<Team | null> {
    if (features.registrationApi) {
      try {
        return await apiFetch<Team>('/registration/team', { token });
      } catch {
        return null; // 404 → not in a team
      }
    }
    return readLocalTeam();
  },

  /** DELETE /registration/team/leave — member leaves their team. */
  async leaveTeam(token: string): Promise<void> {
    if (features.registrationApi) {
      await apiFetch('/registration/team/leave', { method: 'DELETE', token });
      return;
    }
    writeLocalTeam(null);
  },

  /** DELETE /registration/team — leader disbands the whole team. */
  async disbandTeam(token: string): Promise<void> {
    if (features.registrationApi) {
      await apiFetch('/registration/team', { method: 'DELETE', token });
      return;
    }
    writeLocalTeam(null);
  },

  /** DELETE /registration/team/members/:participantId — leader removes a member. */
  async removeMember(participantId: string, token: string): Promise<Team | null> {
    if (features.registrationApi) {
      await apiFetch(`/registration/team/members/${participantId}`, {
        method: 'DELETE',
        token,
      });
      return this.getTeam(token);
    }
    const team = readLocalTeam();
    if (!team) return null;
    team.members = team.members.filter((m) => m.id !== participantId);
    team.memberCount = team.members.length;
    team.spotsLeft = team.size - team.members.length;
    writeLocalTeam(team);
    return team;
  },

  // ── Payment ────────────────────────────────────────────────────────────
  /**
   * Submit a payment proof.
   *
   * TODO(backend): the Payment module is currently empty stubs — there is no
   * endpoint nor a model for payment proofs. When it lands, replace this with
   * the real (likely multipart) upload call and drop the placeholder.
   */
  async submitPayment(
    fileName: string,
    token: string,
  ): Promise<{ ok: boolean }> {
    if (!features.registrationApi) return { ok: true };
    await apiFetch('/payment/proof', {
      method: 'POST',
      body: { fileName },
      token,
    });
    return { ok: true };
  },
};
