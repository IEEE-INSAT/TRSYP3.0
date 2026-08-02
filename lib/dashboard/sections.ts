/**
 * The dashboard is a hub: registration is only the entry ticket, and everything
 * a participant still has to do afterwards lives behind one of these sections.
 *
 * Sections are declared in one place so the nav, the gate, and the pages can
 * never disagree about what exists or what is reachable.
 */

/** TEMP: payment step disabled for now - flip back to true to re-enable. */
export const PAYMENT_ENABLED = false;

/**
 * The rooming backend is live (`/rooming/*`), but no UI has been built for it
 * yet. The section is listed rather than hidden so participants can see it is
 * coming; flip this once the screen exists.
 */
export const ROOMING_ENABLED = false;

export type DashboardSectionId = 'overview' | 'avatar' | 'rooming' | 'payment';

export type DashboardSection = {
  id: DashboardSectionId;
  label: string;
  href: string;
  /** `false` renders the tab as a non-clickable "Soon" chip. */
  enabled: boolean;
  /**
   * Sections the avatar gate is allowed to block. The avatar tab itself must
   * stay reachable or a user with no avatar would have nowhere to go.
   */
  gated: boolean;
};

export const DASHBOARD_SECTIONS: DashboardSection[] = [
  { id: 'overview', label: 'Overview', href: '/dashboard', enabled: true, gated: true },
  { id: 'avatar', label: 'Avatar', href: '/dashboard/avatar', enabled: true, gated: false },
  { id: 'rooming', label: 'Rooming', href: '/dashboard/rooming', enabled: ROOMING_ENABLED, gated: true },
  { id: 'payment', label: 'Payment', href: '/dashboard/payment', enabled: PAYMENT_ENABLED, gated: true },
];

/** Where a user with no avatar is held until they create one. */
export const AVATAR_SECTION_HREF = '/dashboard/avatar';

/**
 * Longest-prefix match, so `/dashboard/payment` resolves to the payment tab
 * rather than to `/dashboard`, which prefixes every dashboard route.
 */
export function activeSection(pathname: string): DashboardSection | undefined {
  return [...DASHBOARD_SECTIONS]
    .sort((a, b) => b.href.length - a.href.length)
    .find((section) => pathname === section.href || pathname.startsWith(`${section.href}/`));
}
