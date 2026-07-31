import { apiFetch } from './http';
import type { RiddleAccessResponse, RiddleSubmitResponse } from './types';

/**
 * Challenge (riddle) service.
 *
 * No auth token involved — a team is identified purely by the code it was
 * handed offline, which the backend decodes itself (see
 * backend/src/modules/challenge/riddle-code.util.ts).
 */
export const challengeService = {
  /** POST /challenge/access — resolve a code into its riddle question + progress. */
  async access(code: string): Promise<RiddleAccessResponse> {
    return apiFetch<RiddleAccessResponse>('/challenge/access', {
      method: 'POST',
      body: { code },
    });
  },

  /** POST /challenge/submit — submit a solution word for the riddle behind this code. */
  async submit(code: string, answer: string): Promise<RiddleSubmitResponse> {
    return apiFetch<RiddleSubmitResponse>('/challenge/submit', {
      method: 'POST',
      body: { code, answer },
    });
  },
};
