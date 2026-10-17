import type { ArucoMarker } from '../aruco.data';

export interface ArucoStateResult {
  /** Whether a round is live. */
  open: boolean;
}

/** The team's tries in the live round, out of its limit, and its field log. */
export interface ArucoScansResult {
  teamName: string;
  used: number;
  limit: number;
  /** The real markers among the IDs tried, as they showed, oldest first. */
  found: ArucoMarker[];
}

export type ArucoMarkerResult = ArucoMarker & { scansUsed: number; scanLimit: number };

/** The team's word attempts in the live round. */
export interface ArucoWordStatusResult {
  teamName: string;
  solved: boolean;
  attempts: number;
  attemptsLeft: number;
}

export interface ArucoWordSubmitResult extends ArucoWordStatusResult {
  correct: boolean;
}
