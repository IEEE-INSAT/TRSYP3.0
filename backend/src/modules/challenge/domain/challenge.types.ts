import type { ArucoMarker } from '../aruco.data';

export interface ArucoStateResult {
  open: boolean;
}

export type ArucoMarkerResult = ArucoMarker;

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
