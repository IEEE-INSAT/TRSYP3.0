/** Unambiguous character set for join codes (no 0/O, 1/I/L). */
const JOIN_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export const JOIN_CODE_LENGTH = 6;

/**
 * Generate a unique 6-character join code (teams, rooms).
 * `isTaken` checks the caller's own table. Retries up to 5 times before giving
 * up (practically impossible to exhaust).
 */
export async function generateJoinCode(
  isTaken: (code: string) => Promise<boolean>,
  label: string,
): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = Array.from(
      { length: JOIN_CODE_LENGTH },
      () => JOIN_CODE_CHARS[Math.floor(Math.random() * JOIN_CODE_CHARS.length)],
    ).join('');

    if (!(await isTaken(code))) return code;
  }

  throw new Error(`Failed to generate a unique ${label} code. Please try again.`);
}
