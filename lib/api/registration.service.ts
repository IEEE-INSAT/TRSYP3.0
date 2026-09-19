import { apiFetch, ApiError, uploadWithProgress } from './http';
import { features } from '../config';
import type { PaymentMethod } from '../payment';
import type {
  BackendPaymentProof,
  BackendParticipant,
  MyPaymentResponse,
  CreateTeamPayload,
  MyTeams,
  RegisterParticipantPayload,
  Team,
  TeamActivity,
  UpdateParticipantPayload,
} from './types';

/**
 * Registration service - implements the registration flow spec
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

/** One storage slot per activity, mirroring the one-team-per-activity rule. */
const TEAM_KEY: Record<TeamActivity, string> = {
  COMPETITION: 'trsyp_team',
  CHALLENGE: 'trsyp_team_challenge',
};

const DEFAULT_ACTIVITY: TeamActivity = 'COMPETITION';

function readLocalTeam(activity: TeamActivity): Team | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(TEAM_KEY[activity]);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Team;
  } catch {
    return null;
  }
}

function writeLocalTeam(activity: TeamActivity, team: Team | null): void {
  if (typeof window === 'undefined') return;
  if (team) window.localStorage.setItem(TEAM_KEY[activity], JSON.stringify(team));
  else window.localStorage.removeItem(TEAM_KEY[activity]);
}

/** `?activity=…`, omitted for the default so old URLs stay byte-identical. */
function activityQuery(activity: TeamActivity): string {
  return activity === DEFAULT_ACTIVITY ? '' : `?activity=${activity}`;
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
  /** POST /registration - register the current Supabase user as a participant. */
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

  /**
   * PATCH /registration/profile - edit the participant record.
   *
   * Returns `null` while the registration API is off, mirroring `register`:
   * the store keeps the profile locally in that mode.
   */
  async updateProfile(
    payload: UpdateParticipantPayload,
    token: string,
  ): Promise<BackendParticipant | null> {
    if (!features.registrationApi) return null;
    return apiFetch<BackendParticipant>('/registration/profile', {
      method: 'PATCH',
      body: payload,
      token,
    });
  },

  /** GET /registration/profile - the current user's participant profile, or null if none yet. */
  async getProfile(token: string): Promise<BackendParticipant | null> {
    if (!features.registrationApi) return null;
    try {
      return await apiFetch<BackendParticipant>('/registration/profile', { token });
    } catch (e) {
      // 404 = the user hasn't registered a profile yet - an expected state, not an error.
      if (e instanceof ApiError && e.status === 404) return null;
      throw e;
    }
  },

  // ── Page 2: teams ────────────────────────────────────────────────────────
  // Every team call is scoped to an activity (competition or technical
  // challenge) and defaults to COMPETITION, which is what the API assumes when
  // the parameter is absent.

  /** POST /registration/team - create a team, returns the team + join `code`. */
  async createTeam(payload: CreateTeamPayload, token: string): Promise<Team> {
    const activity = payload.activity ?? DEFAULT_ACTIVITY;
    if (features.registrationApi) {
      return apiFetch<Team>('/registration/team', {
        method: 'POST',
        body: { ...payload, activity },
        token,
      });
    }
    const team: Team = {
      id: `local-team-${activity.toLowerCase()}`,
      name: payload.name,
      size: payload.size,
      code: randomCode(),
      activity,
      leaderId: 'me',
      memberCount: 1,
      spotsLeft: payload.size - 1,
      members: [
        { id: 'me', name: 'You', lastName: '(leader)', email: '', isLeader: true },
      ],
    };
    writeLocalTeam(activity, team);
    return team;
  },

  /** PATCH /registration/team - leader updates team name/size. */
  async updateTeam(
    payload: { name?: string; size?: number },
    token: string,
    activity: TeamActivity = DEFAULT_ACTIVITY,
  ): Promise<Team> {
    if (features.registrationApi) {
      return apiFetch<Team>('/registration/team', {
        method: 'PATCH',
        body: { ...payload, activity },
        token,
      });
    }
    const team = readLocalTeam(activity);
    if (!team) throw new Error('Not in a team');
    if (payload.name) team.name = payload.name;
    if (payload.size) team.size = payload.size;
    team.spotsLeft = team.size - team.memberCount;
    writeLocalTeam(activity, team);
    return team;
  },

  /**
   * POST /registration/team/join - join a team by 6-char code.
   * The server derives the activity from the code; `activity` is only a hint
   * for which local slot the placeholder should fill.
   */
  async joinTeam(
    code: string,
    token: string,
    activity: TeamActivity = DEFAULT_ACTIVITY,
  ): Promise<Team> {
    if (features.registrationApi) {
      return apiFetch<Team>('/registration/team/join', {
        method: 'POST',
        body: { code },
        token,
      });
    }
    const team: Team = {
      id: `local-team-${activity.toLowerCase()}`,
      name: `Team ${code}`,
      size: 1,
      code,
      activity,
      leaderId: 'someone-else',
      memberCount: 1,
      spotsLeft: 0,
      members: [{ id: 'me', name: 'You', lastName: '', email: '', isLeader: false }],
    };
    writeLocalTeam(activity, team);
    return team;
  },

  /** GET /registration/team - the current user's team for one activity, or null. */
  async getTeam(
    token: string,
    activity: TeamActivity = DEFAULT_ACTIVITY,
  ): Promise<Team | null> {
    if (features.registrationApi) {
      try {
        return await apiFetch<Team>(`/registration/team${activityQuery(activity)}`, { token });
      } catch {
        return null; // 404 → not in a team
      }
    }
    return readLocalTeam(activity);
  },

  /** GET /registration/teams - both teams in one round trip. */
  async getTeams(token: string): Promise<MyTeams> {
    if (features.registrationApi) {
      try {
        return await apiFetch<MyTeams>('/registration/teams', { token });
      } catch {
        // 404 → no participant profile yet; treat as "no teams".
        return { competition: null, challenge: null };
      }
    }
    return {
      competition: readLocalTeam('COMPETITION'),
      challenge: readLocalTeam('CHALLENGE'),
    };
  },

  /** DELETE /registration/team/leave - member leaves their team. */
  async leaveTeam(token: string, activity: TeamActivity = DEFAULT_ACTIVITY): Promise<void> {
    if (features.registrationApi) {
      await apiFetch(`/registration/team/leave${activityQuery(activity)}`, {
        method: 'DELETE',
        token,
      });
      return;
    }
    writeLocalTeam(activity, null);
  },

  /** DELETE /registration/team - leader disbands the whole team. */
  async disbandTeam(token: string, activity: TeamActivity = DEFAULT_ACTIVITY): Promise<void> {
    if (features.registrationApi) {
      await apiFetch(`/registration/team${activityQuery(activity)}`, {
        method: 'DELETE',
        token,
      });
      return;
    }
    writeLocalTeam(activity, null);
  },

  /** DELETE /registration/team/members/:participantId - leader removes a member. */
  async removeMember(
    participantId: string,
    token: string,
    activity: TeamActivity = DEFAULT_ACTIVITY,
  ): Promise<Team | null> {
    if (features.registrationApi) {
      await apiFetch(
        `/registration/team/members/${participantId}${activityQuery(activity)}`,
        { method: 'DELETE', token },
      );
      return this.getTeam(token, activity);
    }
    const team = readLocalTeam(activity);
    if (!team) return null;
    team.members = team.members.filter((m) => m.id !== participantId);
    team.memberCount = team.members.length;
    team.spotsLeft = team.size - team.members.length;
    writeLocalTeam(activity, team);
    return team;
  },

  // ── Payment ────────────────────────────────────────────────────────────
  /**
   * Submit a payment proof.
   *
   * Multipart, and sent with `XMLHttpRequest` rather than `fetch` so the
   * caller can report real upload progress - `fetch` still has no way to
   * observe a request body being sent.
   *
   * The receipt is omitted for a cash payment: there is nothing to scan when
   * the money was handed to a committee member, so those land as PENDING for
   * an admin to confirm in person.
   */
  async submitPayment(
    file: File | null,
    paymentMethod: PaymentMethod,
    token: string,
    onProgress?: (percent: number) => void,
  ): Promise<BackendPaymentProof> {
    const form = new FormData();
    form.append('method', paymentMethod);
    if (file) form.append('file', file, file.name);

    return uploadWithProgress<BackendPaymentProof>(
      '/payment/proof',
      form,
      token,
      onProgress,
    );
  },

  /**
   * Where the current participant stands: settled or not, the live fee, and
   * the most recent proof. The dashboard derives its status from this instead
   * of remembering anything locally.
   */
  async getMyPayment(token: string): Promise<MyPaymentResponse | null> {
    if (!features.registrationApi) return null;
    try {
      return await apiFetch<MyPaymentResponse>('/payment/proof/me', { token });
    } catch (e) {
      // No participant row yet - the caller has nothing to show either way.
      if (e instanceof ApiError && e.status === 404) return null;
      throw e;
    }
  },

  /** Short-lived link to a stored receipt, for showing it back to its owner. */
  async getProofFileUrl(
    proofId: string,
    token: string,
  ): Promise<{ url: string; expiresIn: number }> {
    return apiFetch<{ url: string; expiresIn: number }>(
      `/payment/proof/${proofId}/file`,
      { token },
    );
  },
};
