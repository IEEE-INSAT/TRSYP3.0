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

export type Gender = 'male' | 'female';

/** Student branch enum (backend `SB`). */
export type SB =
  | 'CU'
  | 'ENETCom'
  | 'ENIB'
  | 'ENICarthage'
  | 'ENIG'
  | 'ENIM'
  | 'ENIS'
  | 'ENISO'
  | 'ENIT'
  | 'ENSI'
  | 'ENSIT'
  | 'ENSTAB'
  | 'EPI'
  | 'EPPM'
  | 'EPS'
  | 'EPT'
  | 'ESPIN'
  | 'ESPITA'
  | 'ESPRIT'
  | 'ESSTHS'
  | 'FSB'
  | 'FSG'
  | 'FSM'
  | 'FSS'
  | 'FST'
  | 'IIT'
  | 'INAT'
  | 'INSAT'
  | 'ISETBizerte'
  | 'ISETCom'
  | 'ISETDjerba'
  | 'ISETKairouan'
  | 'ISETKef'
  | 'ISETNABEUL'
  | 'ISETRADES'
  | 'ISGI'
  | 'ISGIS'
  | 'ISI'
  | 'ISIMa'
  | 'ISIMG'
  | 'ISIMM'
  | 'ISIMS'
  | 'ISSATM'
  | 'ISSATSo'
  | 'ISTIC'
  | 'ISTMT'
  | 'MSE'
  | 'PolytechSfax'
  | 'SESAME'
  | 'SMU'
  | 'SupCom'
  | 'TEKUP'
  | 'UCentrale'
  | 'Other';

export const SB_OPTIONS: SB[] = [
  'CU',
  'ENETCom',
  'ENIB',
  'ENICarthage',
  'ENIG',
  'ENIM',
  'ENIS',
  'ENISO',
  'ENIT',
  'ENSI',
  'ENSIT',
  'ENSTAB',
  'EPI',
  'EPPM',
  'EPS',
  'EPT',
  'ESPIN',
  'ESPITA',
  'ESPRIT',
  'ESSTHS',
  'FSB',
  'FSG',
  'FSM',
  'FSS',
  'FST',
  'IIT',
  'INAT',
  'INSAT',
  'ISETBizerte',
  'ISETCom',
  'ISETDjerba',
  'ISETKairouan',
  'ISETKef',
  'ISETNABEUL',
  'ISETRADES',
  'ISGI',
  'ISGIS',
  'ISI',
  'ISIMa',
  'ISIMG',
  'ISIMM',
  'ISIMS',
  'ISSATM',
  'ISSATSo',
  'ISTIC',
  'ISTMT',
  'MSE',
  'PolytechSfax',
  'SESAME',
  'SMU',
  'SupCom',
  'TEKUP',
  
  'Other',
];

/** Country enum */
export type Country =
  | 'Tunisia' | 'Algeria' | 'Morocco' | 'Libya' | 'Egypt' | 'USA' | 'UK'
  | 'Canada' | 'Germany' | 'France' | 'Italy' | 'Spain' | 'UAE'
  | 'SaudiArabia' | 'Jordan' | 'Lebanon' | 'Palestine' | 'Syria' | 'Iraq'
  | 'Sudan' | 'Turkey' | 'India' | 'Pakistan' | 'Bangladesh' | 'China'
  | 'Japan' | 'SouthKorea' | 'Australia' | 'Brazil' | 'Argentina' | 'Mexico'
  | 'Other';

export const COUNTRY_OPTIONS: Country[] = [
  'Tunisia', 'Algeria', 'Morocco', 'Libya', 'Egypt', 'USA', 'UK', 'Canada',
  'Germany', 'France', 'Italy', 'Spain', 'UAE', 'SaudiArabia', 'Jordan',
  'Lebanon', 'Palestine', 'Syria', 'Iraq', 'Sudan', 'Turkey', 'India',
  'Pakistan', 'Bangladesh', 'China', 'Japan', 'SouthKorea', 'Australia',
  'Brazil', 'Argentina', 'Mexico', 'Other',
];

/**
 * International dialling codes for the phone-number country prefix.
 * `label` is what the user sees; `dial` is prepended to the local number to
 * build the E.164 value sent to the backend. Tunisia leads as the default.
 */
export interface DialCode {
  label: string;
  dial: string;
}

export const DIAL_CODES: DialCode[] = [
  { label: 'Tunisia', dial: '+216' },
  { label: 'Algeria', dial: '+213' },
  { label: 'Morocco', dial: '+212' },
  { label: 'Libya', dial: '+218' },
  { label: 'Egypt', dial: '+20' },
  { label: 'USA', dial: '+1' },
  { label: 'UK', dial: '+44' },
  { label: 'Canada', dial: '+1' },
  { label: 'Germany', dial: '+49' },
  { label: 'France', dial: '+33' },
  { label: 'Italy', dial: '+39' },
  { label: 'Spain', dial: '+34' },
  { label: 'UAE', dial: '+971' },
  { label: 'Saudi Arabia', dial: '+966' },
  { label: 'Jordan', dial: '+962' },
  { label: 'Lebanon', dial: '+961' },
  { label: 'Palestine', dial: '+970' },
  { label: 'Syria', dial: '+963' },
  { label: 'Iraq', dial: '+964' },
  { label: 'Sudan', dial: '+249' },
  { label: 'Turkey', dial: '+90' },
  { label: 'India', dial: '+91' },
  { label: 'Pakistan', dial: '+92' },
  { label: 'Bangladesh', dial: '+880' },
  { label: 'China', dial: '+86' },
  { label: 'Japan', dial: '+81' },
  { label: 'South Korea', dial: '+82' },
  { label: 'Australia', dial: '+61' },
  { label: 'Brazil', dial: '+55' },
  { label: 'Argentina', dial: '+54' },
  { label: 'Mexico', dial: '+52' },
];

/**
 * Body of POST /registration (Page 1 of the registration flow spec).
 *
 * `sb` is only sent for Students; `ieeeId` only for IEEE members
 * (participantType != NonIEEE).
 */
export interface RegisterParticipantPayload {
  ieeeId?: number;
  phone: string;
  gender: Gender;
  participantType: ParticipantType;
  sb?: SB;
  country: Country;
}

/** Participant row returned by /registration (Prisma `Participant`). */
export interface BackendParticipant {
  id: string;
  ieeeId?: number;
  phone: string;
  gender: string;
  paid: boolean;
  isInternational: boolean;
  banned: boolean;
  participantType: ParticipantType;
  sb?: string;
  country: Country;
  createdAt: string;
  updatedAt: string;
  internationalInfo?: unknown;
}

// ── Teams (Page 2 of the registration flow spec) ─────────────────────────────

export interface TeamMemberSummary {
  id: string;
  name: string;
  lastName: string;
  email: string;
  isLeader: boolean;
}

/** Team object returned by /registration/team*. `code` is only present for the leader. */
export interface Team {
  id: string;
  name: string;
  size: number;
  code: string; 
  leaderId: string;
  memberCount: number;
  spotsLeft: number;
  members: TeamMemberSummary[];
}

/** Body of POST /registration/team. */
export interface CreateTeamPayload {
  name: string;
  size: number;
}
