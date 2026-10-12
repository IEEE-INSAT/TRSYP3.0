import * as crypto from 'crypto';

/**
 * The ArUco beacon register (Garden and Mine games, 11 October 2026).
 * All markers are OpenCV DICT_4X4_50; each ID belongs to one beacon only.
 * The clues live here, not in the frontend bundle, so closing the challenge
 * (ARUCO_OPEN=false) really hides them.
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

const MARKERS: ArucoMarker[] = [
  // Red beacons - Garden (L and E are each placed twice on the field, same ID).
  { id: 0, kind: 'beacon', game: 'Garden', name: 'Red beacon', clue: 'A', quantity: 1 },
  { id: 10, kind: 'beacon', game: 'Garden', name: 'Red beacon', clue: 'L', quantity: 2 },
  { id: 20, kind: 'beacon', game: 'Garden', name: 'Red beacon', clue: 'I', quantity: 1 },
  { id: 30, kind: 'beacon', game: 'Garden', name: 'Red beacon', clue: 'E', quantity: 2 },
  { id: 40, kind: 'beacon', game: 'Garden', name: 'Red beacon', clue: 'N', quantity: 1 },
  { id: 12, kind: 'beacon', game: 'Garden', name: 'Red beacon', clue: 'C', quantity: 1 },
  { id: 22, kind: 'beacon', game: 'Garden', name: 'Red beacon', clue: 'S', quantity: 1 },
  { id: 32, kind: 'beacon', game: 'Garden', name: 'Red beacon', clue: 'K', quantity: 1 },

  // Red beacons - Mine. Clues not decided yet: fill `clue` in when they are.
  { id: 28, kind: 'beacon', game: 'Mine', name: 'Red beacon 1', clue: '', quantity: 1 },
  { id: 2, kind: 'beacon', game: 'Mine', name: 'Red beacon 2', clue: '', quantity: 1 },
  { id: 3, kind: 'beacon', game: 'Mine', name: 'Red beacon 3', clue: '', quantity: 1 },
  { id: 43, kind: 'beacon', game: 'Mine', name: 'Red beacon 4', clue: '', quantity: 1 },

  // Indicators - Garden.
  { id: 7, kind: 'indicator', game: 'Garden', name: 'Indicator 1', clue: 'two worlds don’t need to be one in order to move together' },
  { id: 17, kind: 'indicator', game: 'Garden', name: 'Indicator 2', clue: 'some connections are stronger if one hand holds the other' },
  { id: 27, kind: 'indicator', game: 'Garden', name: 'Indicator 3', clue: 'One extra letter on the left' },
  { id: 37, kind: 'indicator', game: 'Garden', name: 'Indicator 4', clue: 'At least 3 correct letters on the right' },

  // Collectors - Garden. Their words come from ARUCO_COLLECTOR_<n>_ANSWER.
  { id: 47, kind: 'collector', game: 'Garden', name: 'Collector 1', collector: 1 },
  { id: 6, kind: 'collector', game: 'Garden', name: 'Collector 2', collector: 2 },
];

const BY_ID = new Map(MARKERS.map((m) => [m.id, m]));

export function getMarker(id: number): ArucoMarker | null {
  return BY_ID.get(id) ?? null;
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
