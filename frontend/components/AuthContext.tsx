'use client';

/**
 * Backwards-compatibility shim.
 *
 * Auth is now backed by Zustand (see `lib/store`). This module re-exports the
 * provider, the `useAuth` hook and the shared types so existing imports keep
 * working. Prefer importing from `@/lib/store` in new code.
 */
export { AuthProvider } from '@/lib/store/auth-provider';
export { useAuth } from '@/lib/store/use-auth';
export type {
  UserData,
  TeamMember,
  UserType,
  RegStatus,
} from '@/lib/store/registration-store';
