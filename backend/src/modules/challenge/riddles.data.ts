import * as crypto from 'crypto';

/**
 * Normalizes a candidate answer before hashing/comparing so that
 * case, surrounding whitespace, and accidental spacing don't cause
 * a correct answer to be rejected.
 */
export function normalizeAnswer(raw: string): string {
  return raw.trim().toLowerCase();
}

function hashAnswer(plain: string): string {
  return crypto.createHash('sha256').update(normalizeAnswer(plain)).digest('hex');
}

export type RiddleNumber = 1 | 2 | 3;

export interface RiddleDefinition {
  riddleNumber: RiddleNumber;
  question: string;
  answerHash: string;
}

/**
 * The 3 riddles are identical for every team — only the access code
 * differs (it encodes which team + which riddle number).
 *
 * Replace the question text and the plaintext passed to hashAnswer()
 * with the real riddles/answers. The plaintext answer is never stored —
 * only its SHA-256 hash — so it isn't sitting in cleartext in the repo.
 */
export const RIDDLES: Record<RiddleNumber, RiddleDefinition> = {
  1: {
    riddleNumber: 1,
    question: 'Riddle 1 text goes here.',
    answerHash: hashAnswer('answer1'),
  },
  2: {
    riddleNumber: 2,
    question: 'Riddle 2 text goes here.',
    answerHash: hashAnswer('answer2'),
  },
  3: {
    riddleNumber: 3,
    question: 'Riddle 3 text goes here.',
    answerHash: hashAnswer('answer3'),
  },
};

export function getRiddle(riddleNumber: number): RiddleDefinition | null {
  if (riddleNumber !== 1 && riddleNumber !== 2 && riddleNumber !== 3) return null;
  return RIDDLES[riddleNumber];
}

export function isCorrectAnswer(riddleNumber: RiddleNumber, candidate: string): boolean {
  return hashAnswer(candidate) === RIDDLES[riddleNumber].answerHash;
}
