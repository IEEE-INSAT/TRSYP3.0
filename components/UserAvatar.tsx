'use client';

import { HybridAvatar } from './HybridAvatar';
import type { BackendUser } from '@/lib/api/types';

export default function UserAvatar({
  account,
  className,
}: {
  account: BackendUser | null;
  className?: string;
}) {
  if (account?.avatar) {
    return (
      <span className={`user-avatar ${className ?? ''}`}>
        <HybridAvatar avatar={account.avatar} className="user-avatar-art" />
      </span>
    );
  }

  const initials = account
    ? `${account.name.charAt(0)}${account.lastName.charAt(0)}`.toUpperCase()
    : '?';

  return (
    <span className={`user-avatar user-avatar-fallback ${className ?? ''}`} aria-hidden>
      {initials}
    </span>
  );
}
