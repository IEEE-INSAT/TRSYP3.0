import { apiFetch } from './http';
import type { ArucoStatusResponse, ArucoSubmitResponse } from './types';

/**
 * Challenge (ArUco) service.
 *
 * Only the collector (marker 4) talks to the backend; both calls need the
 * signed-in user's token, and attempts are counted per account.
 */
export const challengeService = {
  /** GET /challenge/aruco/status - this account's attempts on the collector. */
  async status(token: string): Promise<ArucoStatusResponse> {
    return apiFetch<ArucoStatusResponse>('/challenge/aruco/status', { token });
  },

  /** POST /challenge/aruco/submit - submit the word assembled from the clues. */
  async submit(answer: string, token: string): Promise<ArucoSubmitResponse> {
    return apiFetch<ArucoSubmitResponse>('/challenge/aruco/submit', {
      method: 'POST',
      body: { answer },
      token,
    });
  },
};
