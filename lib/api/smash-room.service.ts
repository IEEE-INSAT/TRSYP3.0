import { apiFetch } from './http';
import type { SmashRoomEntry, SmashRoomOverview, SubmitSmashRoomPayload } from './types';

/** Smash Room form: one final submission per participant. */
export const smashRoomService = {
  /** GET /smash-room - the form phase and the caller's submission, if any. */
  getOverview(token: string): Promise<SmashRoomOverview> {
    return apiFetch<SmashRoomOverview>('/smash-room', { token });
  },

  /** POST /smash-room - final. */
  submit(payload: SubmitSmashRoomPayload, token: string): Promise<SmashRoomEntry> {
    return apiFetch<SmashRoomEntry>('/smash-room', { method: 'POST', body: payload, token });
  },
};
