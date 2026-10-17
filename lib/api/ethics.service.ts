import { apiFetch } from './http';
import type { EthicsState } from './types';

/**
 * The live Ethical Decision Test. Participants only read the state; the
 * moderators change it with their key. Votes are never sent.
 */
export const ethicsService = {
  /** GET /ethics/state */
  getState(): Promise<EthicsState> {
    return apiFetch<EthicsState>('/ethics/state', { cache: 'no-store' });
  },

  /** PUT /ethics/state - moderators only. */
  setState(state: { step: number; votingOpen: boolean }, moderatorKey: string): Promise<EthicsState> {
    return apiFetch<EthicsState>('/ethics/state', {
      method: 'PUT',
      body: state,
      headers: { 'x-moderator-key': moderatorKey },
    });
  },

  /** POST /ethics/moderator/check - throws on a wrong key. */
  async checkKey(moderatorKey: string): Promise<void> {
    await apiFetch<void>('/ethics/moderator/check', { method: 'POST', headers: { 'x-moderator-key': moderatorKey } });
  },
};
