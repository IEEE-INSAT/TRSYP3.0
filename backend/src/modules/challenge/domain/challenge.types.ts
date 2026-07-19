export interface RiddleAccessResult {
  riddleNumber: number;
  question: string;
  solved: boolean;
  attempts: number;
}

export interface RiddleSubmitResult {
  correct: boolean;
  solved: boolean;
  attempts: number;
}
