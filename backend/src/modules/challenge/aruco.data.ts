import * as crypto from 'crypto';

/**
 * Normalizes a candidate answer before hashing/comparing so that
 * case and surrounding whitespace don't cause a correct answer to be rejected.
 */
export function normalizeAnswer(raw: string): string {
  return raw.trim().toLowerCase();
}

function hashAnswer(plain: string): string {
  return crypto.createHash('sha256').update(normalizeAnswer(plain)).digest('hex');
}

/** Submissions allowed per account before the collector locks. */
export const MAX_ATTEMPTS = 3;

/**
 * The word the ArUco clues spell out (markers 0-3 hand out the pieces,
 * marker 4 - the collector - is where it's typed in). Only its SHA-256 hash
 * lives here so the plaintext isn't sitting in the repo.
 */
const ANSWER_HASH = '05f514fae7ca5710f9e9289a20a5c9b372af781bfc94dd23d9cb8a044122460f';

export function isCorrectAnswer(candidate: string): boolean {
  return hashAnswer(candidate) === ANSWER_HASH;
}
