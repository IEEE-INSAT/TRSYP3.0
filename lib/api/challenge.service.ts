import { apiFetch } from './http';
import type {
  ArucoCollectorStatusResponse,
  ArucoMarker,
  ArucoStateResponse,
  ArucoSubmitResponse,
} from './types';

/**
 * Challenge (ArUco) service.
 *
 * The marker register lives on the backend so closing the challenge
 * (ARUCO_OPEN=false) hides it. Marker lookups are public; the collector
 * calls need the signed-in user's token, and attempts count per team.
 */
export const challengeService = {
  /** GET /challenge/aruco/state - whether the challenge is open. */
  async state(): Promise<ArucoStateResponse> {
    return apiFetch<ArucoStateResponse>('/challenge/aruco/state');
  },

  /** GET /challenge/aruco/markers/:id - what scanning a marker reveals. */
  async marker(id: number): Promise<ArucoMarker> {
    return apiFetch<ArucoMarker>(`/challenge/aruco/markers/${id}`);
  },

  /** GET /challenge/aruco/collectors/:n/status - the team's attempts on a collector. */
  async collectorStatus(collector: number, token: string): Promise<ArucoCollectorStatusResponse> {
    return apiFetch<ArucoCollectorStatusResponse>(`/challenge/aruco/collectors/${collector}/status`, {
      token,
    });
  },

  /** POST /challenge/aruco/collectors/:n/submit - submit the team's word. */
  async submit(collector: number, answer: string, token: string): Promise<ArucoSubmitResponse> {
    return apiFetch<ArucoSubmitResponse>(`/challenge/aruco/collectors/${collector}/submit`, {
      method: 'POST',
      body: { answer },
      token,
    });
  },
};
