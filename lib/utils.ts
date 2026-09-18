export function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(' ');
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
