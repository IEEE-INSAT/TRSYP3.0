/**
 * Rate-limit key for the ArUco routes: the signed-in player, not the IP. At
 * the venue every team shares one Wi-Fi address, so per-IP limits would make
 * all teams share one bucket.
 *
 * The global ThrottlerGuard runs before JwtAuthGuard, so the token's `sub`
 * is read here unverified. A forged token only earns its own bucket and is
 * then refused by JwtAuthGuard; tries and word attempts are capped per team
 * in the database regardless. Requests without a token fall back to the IP.
 */
export function playerTracker(req: Record<string, any>): string {
  const auth: unknown = req.headers?.authorization;
  const payload = typeof auth === 'string' && auth.startsWith('Bearer ') ? auth.slice(7).split('.')[1] : undefined;
  if (payload) {
    try {
      const { sub } = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { sub?: unknown };
      if (typeof sub === 'string' && sub) return `player:${sub}`;
    } catch {
      // Not a JWT: fall through to the IP.
    }
  }
  return req.ip ?? 'unknown';
}
