import * as crypto from 'crypto';

/**
 * The ArUco challenge (Garden and Mine games). All markers are OpenCV
 * DICT_4X4_50; each ID belongs to one beacon only. What each ID gives lives in
 * the aruco_markers table, edited from the admin portal, not in the frontend
 * bundle, so closing the challenge (ARUCO_OPEN=false) really hides it.
 */

export type ArucoGame = 'Garden' | 'Mine';
export type CollectorNumber = 1 | 2;

export type ArucoMarker =
  /** `quantity`: how many beacons carrying this ID are placed on the field. */
  | { id: number; kind: 'beacon'; game: ArucoGame; name: string; clue: string; quantity: number }
  | { id: number; kind: 'indicator'; game: ArucoGame; name: string; clue: string }
  | { id: number; kind: 'collector'; game: ArucoGame; name: string; collector: CollectorNumber };

/** Submissions allowed per team, per collector, before that collector locks. */
export const MAX_ATTEMPTS = 3;

/**
 * Distinct marker IDs a team may try (ARUCO_SCAN_LIMIT overrides it), so a
 * team can't walk through all 50 DICT_4X4_50 IDs. Re-opening an ID the team
 * already tried is free.
 */
export const DEFAULT_SCAN_LIMIT = 20;

/** The columns of an aruco_markers row that decide what the marker gives. */
export interface ArucoMarkerRow {
  markerId: number;
  kind: string;
  game: string;
  name: string;
  clue: string;
  quantity: number | null;
  collector: number | null;
}

/**
 * Shapes an aruco_markers row as what scanning reveals. The table's CHECK
 * constraints keep rows well formed; anything else reads as "no marker".
 */
export function toMarker(row: ArucoMarkerRow): ArucoMarker | null {
  if (row.game !== 'Garden' && row.game !== 'Mine') return null;
  const base = { id: row.markerId, game: row.game as ArucoGame, name: row.name };
  switch (row.kind) {
    case 'beacon':
      return { ...base, kind: 'beacon', clue: row.clue, quantity: row.quantity ?? 1 };
    case 'indicator':
      return { ...base, kind: 'indicator', clue: row.clue };
    case 'collector':
      return row.collector !== null && isCollectorNumber(row.collector)
        ? { ...base, kind: 'collector', collector: row.collector }
        : null;
    default:
      return null;
  }
}

export function isCollectorNumber(n: number): n is CollectorNumber {
  return n === 1 || n === 2;
}

/** Env var holding a collector's word, e.g. ARUCO_COLLECTOR_1_ANSWER. */
export function answerEnvKey(collector: CollectorNumber): string {
  return `ARUCO_COLLECTOR_${collector}_ANSWER`;
}

/**
 * Normalizes an answer before comparing so case and surrounding whitespace
 * don't cause a correct answer to be rejected.
 */
export function normalizeAnswer(raw: string): string {
  return raw.trim().toLowerCase();
}

/** Constant-time comparison of a candidate against the configured word. */
export function matchesAnswer(candidate: string, expected: string): boolean {
  const digest = (s: string) => crypto.createHash('sha256').update(normalizeAnswer(s)).digest();
  return crypto.timingSafeEqual(digest(candidate), digest(expected));
}
