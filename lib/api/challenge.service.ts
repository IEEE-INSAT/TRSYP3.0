import { apiFetch } from './http';
import type {
  ArucoCollectorStatusResponse,
  ArucoMarkerLookup,
  ArucoScansResponse,
  ArucoStateResponse,
  ArucoSubmitResponse,
} from './types';

/**
 * Challenge (ArUco) service.
 *
 * The marker register lives on the backend so closing the challenge
 * (ARUCO_OPEN=false) hides it. Everything but `state` needs the signed-in
 * user's token: marker tries (distinct IDs) and collector attempts are
 * counted per Competition team.
 */
export const challengeService = {
  /** GET /challenge/aruco/state - whether the challenge is open. */
  async state(): Promise<ArucoStateResponse> {
    return apiFetch<ArucoStateResponse>('/challenge/aruco/state');
  },

  /** GET /challenge/aruco/scans - how many marker IDs the team has tried. */
  async scans(token: string): Promise<ArucoScansResponse> {
    return apiFetch<ArucoScansResponse>('/challenge/aruco/scans', { token });
  },

  /** GET /challenge/aruco/markers/:id - what scanning a marker reveals (a new ID uses a try). */
  async marker(id: number, token: string): Promise<ArucoMarkerLookup> {
    return apiFetch<ArucoMarkerLookup>(`/challenge/aruco/markers/${id}`, { token });
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
