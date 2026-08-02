'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { hasFullAvatar } from '@/lib/avatar';
import { useAuthStore } from '@/lib/store/auth-store';
import { DASHBOARD_SECTIONS, activeSection } from '@/lib/dashboard/sections';

/**
 * Section switcher for the dashboard hub.
 *
 * While the signed-in user has no avatar every other section is locked: the
 * avatar is mandatory once you are registered, and a nav that still offered the
 * other tabs would just bounce the user back here via the gate.
 */
export default function DashboardNav() {
  const pathname = usePathname();
  const account = useAuthStore((state) => state.account);
  const current = activeSection(pathname);
  const locked = !!account && !hasFullAvatar(account.avatar);

  return (
    <nav className="dash-nav" aria-label="Dashboard sections">
      <ul className="dash-nav-list">
        {DASHBOARD_SECTIONS.map((section) => {
          const isCurrent = current?.id === section.id;
          const unavailable = !section.enabled || (locked && section.gated);

          if (unavailable) {
            return (
              <li key={section.id}>
                <span
                  className="dash-nav-item dash-nav-item--disabled"
                  aria-disabled="true"
                  title={
                    !section.enabled
                      ? `${section.label} is not open yet`
                      : 'Create your avatar first'
                  }
                >
                  {section.label}
                  <span className="dash-nav-chip">
                    {!section.enabled ? 'Soon' : 'Locked'}
                  </span>
                </span>
              </li>
            );
          }

          return (
            <li key={section.id}>
              <Link
                href={section.href}
                className={`dash-nav-item ${isCurrent ? 'dash-nav-item--active' : ''}`}
                aria-current={isCurrent ? 'page' : undefined}
              >
                {section.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
