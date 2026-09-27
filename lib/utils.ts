export function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(' ');
}

/**
 * Client-side mirror of the server's Fablab submission rule: an https link on
 * drive.google.com.
 */
export function isGoogleDriveUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    return url.protocol === 'https:' && url.hostname.toLowerCase() === 'drive.google.com';
  } catch {
    return false;
  }
}

/**
 * Client-side mirror of the server's Facebook-link rule: a valid http(s) URL
 * whose host is facebook.com or fb.com (any subdomain).
 */
export function isFacebookUrl(value: string): boolean {
  try {
    const { protocol, hostname } = new URL(value.trim());
    if (protocol !== 'http:' && protocol !== 'https:') return false;
    const host = hostname.toLowerCase();
    return ['facebook.com', 'fb.com'].some((d) => host === d || host.endsWith(`.${d}`));
  } catch {
    return false;
  }
}

/**
 * What's wrong with an IEEE member number as typed, or null when it's fine.
 * Required from anyone who says they're an IEEE member. Real numbers have at
 * least 5 digits (the server skips shorter ones).
 */
export function ieeeMemberNumberError(value: string): string | null {
  const digits = value.trim();
  if (!digits) return 'Required for IEEE members';
  if (!/^\d+$/.test(digits)) return 'Digits only';
  if (digits.length < 5) return 'Enter your full IEEE member number';
  return null;
}
