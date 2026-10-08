export interface ArucoStatusResult {
  solved: boolean;
  attempts: number;
  attemptsLeft: number;
}

export interface ArucoSubmitResult extends ArucoStatusResult {
  correct: boolean;
}
