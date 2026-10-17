import { apiFetch } from './http';
import type {
  ArucoMarkerLookup,
  ArucoScansResponse,
  ArucoStateResponse,
  ArucoWordStatusResponse,
  ArucoWordSubmitResponse,
} from './types';

/**
 * Challenge (ArUco) service.
 *
 * The games live on the backend, so nothing leaks before the admin portal
 * starts a round. Everything but `state` needs the signed-in user's token:
 * marker tries (distinct IDs) and word attempts are counted per Competition
 * team, per round.
 */
export const challengeService = {
  /** GET /challenge/aruco/state - whether a round is live. */
  async state(): Promise<ArucoStateResponse> {
    return apiFetch<ArucoStateResponse>('/challenge/aruco/state');
  },

  /** GET /challenge/aruco/scans - the team's tries and field log this round. */
  async scans(token: string): Promise<ArucoScansResponse> {
    return apiFetch<ArucoScansResponse>('/challenge/aruco/scans', { token });
  },

  /** GET /challenge/aruco/markers/:id - what scanning a marker reveals (a new ID uses a try). */
  async marker(id: number, token: string): Promise<ArucoMarkerLookup> {
    return apiFetch<ArucoMarkerLookup>(`/challenge/aruco/markers/${id}`, { token });
  },

  /** GET /challenge/aruco/word - the team's word attempts this round. */
  async wordStatus(token: string): Promise<ArucoWordStatusResponse> {
    return apiFetch<ArucoWordStatusResponse>('/challenge/aruco/word', { token });
  },

  /** POST /challenge/aruco/word - submit the team's word. */
  async submitWord(answer: string, token: string): Promise<ArucoWordSubmitResponse> {
    return apiFetch<ArucoWordSubmitResponse>('/challenge/aruco/word', {
      method: 'POST',
      body: { answer },
      token,
    });
  },
};
