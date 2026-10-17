import * as crypto from 'crypto';

/**
 * The ArUco challenge: Garden games (Human, Machine, Alliance: letters,
 * hints and a word) and Mine games (safe and unsafe paths) on the same
 * printed OpenCV DICT_4X4_50 markers. What each ID gives in each game, and
 * each Garden game's word, live in the database (aruco_games, aruco_markers),
 * never in the frontend bundle, so nothing leaks before a round starts.
 */

export type ArucoMarkerKind = 'letter' | 'hint' | 'collector' | 'path';

/** What scanning a marker reveals. */
export interface ArucoMarker {
  id: number;
  kind: ArucoMarkerKind;
  /** "Red beacon", "Blue beacon", "Collector" or "Mine marker". */
  name: string;
  /** The letter, the hint's text, or safe | unsafe for a path. Absent for a collector. */
  content?: string;
  /** Hints only: which of the four (1-4). */
  hint?: number;
}

/** Word attempts a team gets per round. */
export const MAX_ATTEMPTS = 3;

/**
 * Distinct marker IDs a team may try per round (ARUCO_SCAN_LIMIT overrides
 * it, and a game's own scan_limit overrides both), so a team can't walk
 * through all 50 IDs. Reopening one is free.
 */
export const DEFAULT_SCAN_LIMIT = 20;

const NAMES: Record<ArucoMarkerKind, string> = {
  letter: 'Red beacon',
  hint: 'Blue beacon',
  collector: 'Collector',
  path: 'Mine marker',
};

export function isMarkerKind(kind: string | null): kind is ArucoMarkerKind {
  return kind === 'letter' || kind === 'hint' || kind === 'collector' || kind === 'path';
}

/** Shapes a marker row (or a scan's snapshot of one) as what scanning reveals. */
export function toMarker(row: {
  markerId: number;
  kind: string | null;
  content: string;
  hintNumber: number | null;
}): ArucoMarker | null {
  if (!isMarkerKind(row.kind)) return null;
  const marker: ArucoMarker = { id: row.markerId, kind: row.kind, name: NAMES[row.kind] };
  if (row.kind !== 'collector') marker.content = row.content;
  if (row.kind === 'hint' && row.hintNumber !== null) marker.hint = row.hintNumber;
  return marker;
}

/**
 * Normalizes a word before comparing, so case and spaces ("alliance",
 * " Alliance ", "ALL IANCE") don't make a right answer wrong.
 */
export function normalizeAnswer(raw: string): string {
  return raw.replace(/\s+/g, '').toLowerCase();
}

/** Constant-time comparison of a candidate against the game's word. */
export function matchesAnswer(candidate: string, expected: string): boolean {
  const digest = (s: string) => crypto.createHash('sha256').update(normalizeAnswer(s)).digest();
  return crypto.timingSafeEqual(digest(candidate), digest(expected));
}
