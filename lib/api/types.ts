import type { PaymentMethod } from '../payment';

/**
 * Types mirroring the NestJS backend DTOs / responses.
 *
 * Keep these in sync with `backend/src/modules/**`. They describe the contract
 * the service layer targets - some endpoints are not wired on the backend yet
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
  avatar: AvatarConfig | null;
  createdAt: string;
  updatedAt: string;
}

export interface AvatarConfig {
  avatarStyle: 'Circle' | 'Transparent';
  topType: string;
  accessoriesType: string;
  hatColor: string;
  hairColor: string;
  facialHairType: string;
  facialHairColor: string;
  clotheType: string;
  clotheColor: string;
  graphicType: string;
  eyeType: string;
  eyebrowType: string;
  mouthType: string;
  skinColor: string;
  robotColor: 'Cobalt' | 'Ember' | 'Jade' | 'Violet' | 'Graphite';
  robotEyes: 'Dual' | 'Mono' | 'Sensor';
  robotMouth: 'Speaker' | 'Smile' | 'Signal';
  robotAntenna: 'Single' | 'Twin' | 'None';
  robotAccessory: 'None' | 'Halo' | 'Visor';
  robotBackground: 'Aurora' | 'Sunset' | 'Mint' | 'Lavender' | 'Night';
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

/** Student or young professional - the participant's own answer (backend `CareerStage`). */
export type CareerStage = 'Student' | 'YoungProfessional';

/**
 * Body of POST /registration (Page 1 of the registration flow spec).
 *
 * IEEE membership and RAS are never sent: the server looks them up in IEEE's
 * records. `ieeeId` is an optional lookup key (email is the fallback); `sb`
 * is only sent for Students who say they're IEEE members.
 */
export interface RegisterParticipantPayload {
  ieeeId?: number;
  phone: string;
  gender: Gender;
  careerStage: CareerStage;
  sb?: SB;
  country: Country;
  /** Facebook profile URL - required at registration; on PATCH it can be changed but not cleared. */
  facebookLink?: string;
}

/**
 * Body of PATCH /registration/profile.
 *
 * Every field is optional - only what the user actually changed is sent.
 * `ieeeId: null` removes the member number, `sb: null` the student branch.
 * A new number is checked with IEEE right away.
 */
export type UpdateParticipantPayload = Partial<Omit<RegisterParticipantPayload, 'ieeeId' | 'sb'>> & {
  ieeeId?: number | null;
  sb?: SB | null;
};

/**
 * Where the participant stands with IEEE, from IEEE's records:
 * MEMBER (active), APPLICANT (application pending - counted as a member),
 * LAPSED (needs renewing), NOT_MEMBER (no membership found).
 */
export type IeeeStanding = 'MEMBER' | 'APPLICANT' | 'LAPSED' | 'NOT_MEMBER';

/** The participant's IEEE membership check. */
export interface IeeeVerification {
  standing: IeeeStanding;
  isRas: boolean;
  matchedBy: 'IEEE_ID' | 'EMAIL' | null;
  checkedAt: string;
  /** Their details changed since; a new check is on its way. */
  stale: boolean;
}

/** Body of PATCH /auth/me. Email is not editable - it is the Supabase identity. */
export interface UpdateMePayload {
  name?: string;
  lastName?: string;
}

/** Participant row returned by /registration (Prisma `Participant`). */
export interface BackendParticipant {
  id: string;
  ieeeId?: number;
  phone: string;
  gender: string;
  /**
   * Admin responses only. `ParticipantResponseDto` marks this `@Exclude()`,
   * so `GET /registration/profile` never returns it - read the settled flag
   * from `GET /payment/proof/me` instead.
   */
  paid?: boolean;
  isInternational: boolean;
  isRas: boolean;
  facebookLink?: string | null;
  /** Registration fee, derived server-side from membership tier and team status. */
  fee?: number;
  currency?: string;
  feeRole?: 'VISITOR' | 'CHALLENGER' | 'FABLAB';
  feeTier?: 'IEEE_RAS' | 'IEEE' | 'NON_IEEE';
  banned: boolean;
  /** What the participant is priced as - set from their IEEE check. */
  participantType: ParticipantType;
  careerStage?: CareerStage | null;
  /** Null until the first IEEE check completes. */
  ieeeVerification?: IeeeVerification | null;
  sb?: string;
  country: Country;
  createdAt: string;
  updatedAt: string;
  internationalInfo?: unknown;
}

// ── Teams (Page 2 of the registration flow spec) ─────────────────────────────

/**
 * The event a team competes in. A participant may hold one team of each - a
 * competition, technical challenge and Fablab team - but never two of the same.
 */
export type TeamActivity = 'COMPETITION' | 'CHALLENGE' | 'FABLAB';

export const TEAM_ACTIVITIES: TeamActivity[] = ['COMPETITION', 'CHALLENGE', 'FABLAB'];

/** UI copy for each activity, so labels stay identical across screens. */
export const ACTIVITY_LABELS: Record<TeamActivity, string> = {
  COMPETITION: 'Competition',
  CHALLENGE: 'Technical Challenge',
  FABLAB: 'Adwya × Orange Fablab Challenge',
};

/** Team size bounds (leader included) - mirrors the backend's team DTO. */
export const TEAM_SIZE_LIMITS: Record<TeamActivity, { min: number; max: number }> = {
  COMPETITION: { min: 3, max: 6 },
  CHALLENGE: { min: 2, max: 6 },
  FABLAB: { min: 2, max: 4 },
};

/** Fablab Challenge axis - picked by the leader, stored on FABLAB teams only. */
export type FablabAxis = 'SAMPLE_PREPARATION' | 'WEIGHING_DOSING';

/** The axes in display order, numbered as in the specification book. */
export const FABLAB_AXES: { value: FablabAxis; number: number; label: string }[] = [
  { value: 'SAMPLE_PREPARATION', number: 1, label: 'Automated Sample Preparation' },
  { value: 'WEIGHING_DOSING', number: 2, label: 'Automated Weighing & Dosing Station' },
];

/** "Axis 2 · Automated Weighing & Dosing Station" */
export function fablabAxisLabel(axis: FablabAxis): string {
  const a = FABLAB_AXES.find((x) => x.value === axis);
  return a ? `Axis ${a.number} · ${a.label}` : axis;
}

/**
 * Whether a participant may create or join a team in this activity. Fablab is
 * for IEEE RAS members only (leader and teammates alike) - mirrors the
 * backend's `assertEligibleFor`. Every other activity is open to all.
 */
export function canEnterActivity(
  activity: TeamActivity,
  member: { isIeee: boolean; isRas: boolean },
): boolean {
  return activity !== 'FABLAB' || (member.isIeee && member.isRas);
}

/** Size options offered in the team forms for one activity. */
export function teamSizeOptions(activity: TeamActivity): number[] {
  const { min, max } = TEAM_SIZE_LIMITS[activity];
  return Array.from({ length: max - min + 1 }, (_, i) => min + i);
}

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
  activity: TeamActivity;
  /** FABLAB teams only; null (or absent from older backends) otherwise. */
  axis?: FablabAxis | null;
  /** FABLAB only - the Google Drive folder the leader submitted, if any. */
  submissionUrl?: string | null;
  /** ISO timestamp of the last submission. */
  submittedAt?: string | null;
  /** False once the team is out after the selection phase. Absent from older backends - treat as selected. */
  selected?: boolean;
  leaderId: string;
  memberCount: number;
  spotsLeft: number;
  members: TeamMemberSummary[];
}

/** GET /registration/teams - every team the caller holds, one slot per activity. */
export interface MyTeams {
  competition: Team | null;
  challenge: Team | null;
  fablab: Team | null;
}

/** Body of POST /registration/team. */
export interface CreateTeamPayload {
  name: string;
  size: number;
  activity?: TeamActivity;
  /** Required when `activity` is FABLAB, omitted otherwise. */
  axis?: FablabAxis;
}

// ── Rooming ───────────────────────────────────────────────────────────────────

export interface RoomMember {
  id: string;
  name: string;
  lastName: string;
  email: string;
}

/**
 * Room object returned by /rooming*. Every room is a double and holds one
 * gender - the owner's. `code` is what the owner shares with their roommate.
 */
export interface Room {
  id: string;
  code: string;
  gender: Gender;
  ownerId: string;
  capacity: number;
  memberCount: number;
  spotsLeft: number;
  /** Owner first. */
  members: RoomMember[];
}

/** GET /rooming - `room` is null when the caller is not in one. */
export interface MyRoom {
  room: Room | null;
}

// ── Challenge (ArUco markers) ─────────────────────────────────────────────────

/** Response of GET /challenge/aruco/status. */
export interface ArucoStatusResponse {
  solved: boolean;
  attempts: number;
  /** Attempts left before the collector locks (0 once solved or lost). */
  attemptsLeft: number;
}

/** Body of POST /challenge/aruco/submit. */
export interface ArucoSubmitPayload {
  answer: string;
}

/** Response of POST /challenge/aruco/submit. */
export interface ArucoSubmitResponse extends ArucoStatusResponse {
  correct: boolean;
}

// ── Payment proofs ───────────────────────────────────────────────────────────

/** Review state of a submitted proof, mirroring the backend enum. */
export type PaymentProofStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

/** One submitted proof, as its owner sees it. */
export interface BackendPaymentProof {
  id: string;
  method: PaymentMethod;
  status: PaymentProofStatus;
  /** The fee as it stood when the proof was submitted, in TND. */
  amountSnapshot: number;
  /** Null for a cash payment, which has no receipt. */
  fileName: string | null;
  hasFile: boolean;
  rejectionReason: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

/**
 * Response of GET /payment/proof/me.
 *
 * `paid` is the settled flag and `latestProof` explains what is happening in
 * between, which together are enough to derive the dashboard status without
 * the client keeping any of its own.
 */
export interface MyPaymentResponse {
  paid: boolean;
  fee: number;
  currency: string;
  /** Whether the backend is accepting proofs right now. */
  submissionOpen: boolean;
  latestProof: BackendPaymentProof | null;
}
