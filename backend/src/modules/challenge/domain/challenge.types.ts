import type { ArucoMarker } from '../aruco.data';

export interface ArucoStateResult {
  open: boolean;
}

/** How many distinct marker IDs the team has tried, out of its limit. */
export interface ArucoScansResult {
  teamName: string;
  used: number;
  limit: number;
  /** The real markers among those IDs, oldest try first. */
  found: ArucoMarker[];
}

export type ArucoMarkerResult = ArucoMarker & { scansUsed: number; scanLimit: number };

export interface ArucoCollectorStatusResult {
  collector: number;
  teamName: string;
  solved: boolean;
  attempts: number;
  attemptsLeft: number;
}

export interface ArucoSubmitResult extends ArucoCollectorStatusResult {
  correct: boolean;
}
