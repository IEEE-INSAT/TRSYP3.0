/** Browser-side calls to this app's own API. */
export type EthicsState = { step: number; votingOpen: boolean; updatedAt: number };

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { cache: 'no-store', ...init });
  const raw = await res.text();
  const data = raw ? JSON.parse(raw) : null;
  if (!res.ok) throw new Error((data && data.message) || res.statusText || 'Request failed');
  return data as T;
}

export const api = {
  getState: () => call<EthicsState>('/api/state'),

  setState: (state: { step: number; votingOpen: boolean }, key: string) =>
    call<EthicsState>('/api/state', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-moderator-key': key },
      body: JSON.stringify(state),
    }),

  checkKey: (key: string) => call<null>('/api/moderator', { method: 'POST', headers: { 'x-moderator-key': key } }),
};
