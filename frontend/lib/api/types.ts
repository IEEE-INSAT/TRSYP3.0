/**
 * Types mirroring the NestJS backend DTOs / responses.
 *
 * Keep these in sync with `backend/src/modules/**`. They describe the contract
 * the service layer targets — some endpoints are not wired on the backend yet
 * (see the feature flags in `lib/config.ts`), but typing them now means the
 * switch from placeholder to live is a one-line flag change.
 */

// ── Auth ────────────────────────────────────────────────────────────────────

/** Body of POST /auth/sync-user (backend SyncUserDto). */
export interface SyncUserPayload {
  email: string;
  name: string;
  lastName: string;
  provider?: string;
}

/** User row returned by /auth/sync-user and /auth/me (Prisma `User`). */
export interface BackendUser {
  id: string;
  email: string;
  name: string;
  lastName: string;
  supabaseId: string;
  provider: string;
  createdAt: string;
  updatedAt: string;
}

// ── Admin ───────────────────────────────────────────────────────────────────

export type AdminPosition = 'CHAIR' | 'VICE_CHAIR';

/** Body of POST /admin/create-admin (backend CreateAdminDto). */
export interface CreateAdminPayload {
  email: string;
  password: string;
  name: string;
  lastName: string;
  position: AdminPosition;
}

/** Admin row returned by POST /admin/create-admin (Prisma `Admin`). */
export interface BackendAdmin {
  id: string;
  email: string;
  name: string;
  lastName: string;
  position: AdminPosition;
  supabaseId: string;
  createdAt: string;
  updatedAt: string;
}

// ── Registration (backend module not wired yet) ──────────────────────────────

export type ParticipantType = 'NonIEEE' | 'Student' | 'YoungProfessional';

/**
 * Body of POST /registration (backend RegisterLocalDto).
 *
 * NOTE: the V2 forms collect a different shape (free-text university, no
 * gender / participantType / country). The mapping in
 * `registration.service.ts` documents the gaps to close once the backend
 * registration module is finalised.
 */
export interface RegisterParticipantPayload {
  ieeeId?: number;
  phone: string;
  gender: 'male' | 'female';
  participantType: ParticipantType;
  sb?: string;
  country: string;
}

/** Participant row returned by /registration (Prisma `Participant`). */
export interface BackendParticipant {
  id: string;
  userId: string;
  ieeeId: number | null;
  phone: string;
  gender: string;
  paid: boolean;
  isInternational: boolean;
  banned: boolean;
  participantType: ParticipantType;
  sb: string | null;
  country: string;
  createdAt: string;
  updatedAt: string;
}
