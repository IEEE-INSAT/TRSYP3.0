import * as crypto from 'crypto';

const ALGO = 'aes-256-cbc';
// Fixed IV: safe here because each code encrypts a single 16-byte block and
// this isn't protecting high-value secrets — it just keeps the team/riddle
// mapping from being readable or guessable at a glance.
const IV = Buffer.alloc(16, 0);

function getKey(): Buffer {
  const secret = process.env.RIDDLE_CODE_SECRET;
  if (!secret) {
    throw new Error('RIDDLE_CODE_SECRET is not set');
  }
  return crypto.createHash('sha256').update(secret).digest(); // 32 bytes
}

export interface DecodedRiddleCode {
  teamCode: string;
  riddleNumber: number;
}

/**
 * Encodes (teamCode, riddleNumber) into a single opaque code.
 * Deterministic: the same team + riddle number always produces the same code,
 * so codes can be generated once and printed/handed out.
 */
export function encodeRiddleCode(teamCode: string, riddleNumber: 1 | 2 | 3): string {
  const plaintext = `${teamCode.toUpperCase()}:${riddleNumber}`;
  const cipher = crypto.createCipheriv(ALGO, getKey(), IV);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  return encrypted.toString('base64url');
}

/**
 * Decodes a code back into its (teamCode, riddleNumber) pair.
 * Returns null for any invalid, tampered, or malformed code instead of throwing,
 * so callers can respond with a plain "invalid code" without a try/catch.
 */
export function decodeRiddleCode(code: string): DecodedRiddleCode | null {
  try {
    const encrypted = Buffer.from(code, 'base64url');
    const decipher = crypto.createDecipheriv(ALGO, getKey(), IV);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');

    const [teamCode, riddleStr] = decrypted.split(':');
    const riddleNumber = parseInt(riddleStr, 10);

    if (!teamCode || ![1, 2, 3].includes(riddleNumber)) {
      return null;
    }

    return { teamCode, riddleNumber };
  } catch {
    return null;
  }
}
