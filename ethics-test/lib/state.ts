import 'server-only';
import { timingSafeEqual } from 'node:crypto';
import { get } from '@vercel/global-config';

/**
 * What the moderators control: the step every screen shows (0 waiting to
 * start, 1..n scenario n, past the last one finished) and whether voting is
 * open. `updatedAt` lets the control page ignore an older value still being
 * served while a change spreads.
 */
export type EthicsState = { step: number; votingOpen: boolean; updatedAt: number };

const KEY = 'ethics_state';
const INITIAL: EthicsState = { step: 0, votingOpen: true, updatedAt: 0 };

/** True once a Global Config store is connected to the project. */
export const storeConnected = () => !!(process.env.GLOBAL_CONFIG || process.env.EDGE_CONFIG);

// Local development without a store: one dev server, so memory is shared.
let memory: EthicsState = INITIAL;

function isState(v: unknown): v is EthicsState {
  const s = v as EthicsState;
  return !!s && Number.isInteger(s.step) && s.step >= 0 && typeof s.votingOpen === 'boolean';
}

export async function readState(): Promise<EthicsState> {
  if (!storeConnected()) return memory;
  const value = await get<EthicsState>(KEY);
  return isState(value) ? { ...value, updatedAt: value.updatedAt ?? 0 } : INITIAL;
}

export class StoreError extends Error {}

/**
 * Writes through the Vercel REST API (the SDK only reads). Readers see it
 * within a few seconds - up to 10 at worst.
 */
export async function writeState(next: Omit<EthicsState, 'updatedAt'>): Promise<EthicsState> {
  const state: EthicsState = { ...next, updatedAt: Date.now() };

  if (!storeConnected()) {
    if (process.env.VERCEL) throw new StoreError('No Global Config store is connected to this project.');
    memory = state;
    return state;
  }

  const id = process.env.GLOBAL_CONFIG_ID;
  const token = process.env.VERCEL_API_TOKEN;
  if (!id || !token) throw new StoreError('GLOBAL_CONFIG_ID and VERCEL_API_TOKEN must be set to change the state.');

  const team = process.env.VERCEL_TEAM_ID ? `?teamId=${encodeURIComponent(process.env.VERCEL_TEAM_ID)}` : '';
  const res = await fetch(`https://api.vercel.com/v1/global-config/${encodeURIComponent(id)}/items${team}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ items: [{ operation: 'upsert', key: KEY, value: state }] }),
    cache: 'no-store',
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
    throw new StoreError(`Vercel refused the update: ${body?.error?.message ?? res.statusText}`);
  }
  return state;
}

/** Checks the key without letting response times hint at how much of it matched. */
export function isModerator(key: string | null): boolean {
  const expected = process.env.MODERATOR_KEY?.trim();
  if (!expected) return false;
  const given = Buffer.from(key?.trim() ?? '');
  const wanted = Buffer.from(expected);
  return given.length === wanted.length && timingSafeEqual(given, wanted);
}

export const moderatorKeySet = () => !!process.env.MODERATOR_KEY?.trim();
