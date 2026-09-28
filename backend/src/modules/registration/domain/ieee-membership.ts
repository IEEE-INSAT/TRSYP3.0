import { CareerStage, IeeeCheckStatus, ParticipantType, SB } from '@prisma/client';

/**
 * How an IEEE GetMemberStatus result translates into what a participant is
 * priced on. The admin portal applies the same rules to the same table
 * (`ieee_verifications`), so change them together.
 *
 * IEEE's grade is deliberately ignored: Student vs Young Professional is the
 * participant's own answer (`careerStage`).
 */

/** The IEEE Robotics and Automation Society's product code. */
export const RAS_SOCIETY_CODE = 'MEMRA024';

/** `checked_by` for checks this backend runs, as opposed to an admin's id. */
export const SYSTEM_CHECKER = 'system';

/** IEEE member numbers are never shorter; a shorter one isn't worth a call. */
export const MIN_MEMBER_NUMBER_DIGITS = 5;

export type IeeeMatch = 'IEEE_ID' | 'EMAIL';

/** Where a participant stands with IEEE, as shown to them. */
export type IeeeStanding =
  /** `Active`. */
  | 'MEMBER'
  /** `Applicant`: application not complete, usually awaiting payment. Counted as a member. */
  | 'APPLICANT'
  /** Held a membership that is no longer current (`Arrears`, `Inactive`, ...). */
  | 'LAPSED'
  /** No record, or `Not Applicable` (a web account that never held a membership). */
  | 'NOT_MEMBER';

/** The IEEE columns a decision is made from. `memberStatus` is null when no record was found. */
export interface IeeeRecord {
  memberStatus: string | null;
  societies: string[];
}

function normalise(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

export function ieeeStandingOf(memberStatus: string | null): IeeeStanding {
  switch (normalise(memberStatus)) {
    case 'active':
      return 'MEMBER';
    case 'applicant':
      return 'APPLICANT';
    case '':
    case 'not applicable':
      return 'NOT_MEMBER';
    default:
      return 'LAPSED';
  }
}

export function isIeeeMember(memberStatus: string | null): boolean {
  const standing = ieeeStandingOf(memberStatus);
  return standing === 'MEMBER' || standing === 'APPLICANT';
}

/** RAS only counts for an active member; an applicant has no societies yet. */
export function hasRas(record: IeeeRecord): boolean {
  return (
    normalise(record.memberStatus) === 'active' &&
    record.societies.some((code) => code.trim().toUpperCase() === RAS_SOCIETY_CODE)
  );
}

/**
 * The `status` column, a record only. `MISMATCH` is never produced here: the
 * participant's values are set from the result, so the claim always matches.
 */
export function checkStatusOf(record: IeeeRecord): IeeeCheckStatus {
  if (record.memberStatus === null) return IeeeCheckStatus.NOT_FOUND;
  return isIeeeMember(record.memberStatus) ? IeeeCheckStatus.VERIFIED : IeeeCheckStatus.INACTIVE;
}

/**
 * What the participant is priced on, given their IEEE record. A member keeps
 * the Student / Young Professional answer they gave; rows that never gave one
 * (they registered as non-members before it was asked) fall back on whether
 * they named a student branch.
 */
export function membershipFrom(
  record: IeeeRecord,
  participant: { careerStage: CareerStage | null; sb: SB | null },
): { participantType: ParticipantType; isRas: boolean } {
  if (!isIeeeMember(record.memberStatus)) {
    return { participantType: ParticipantType.NonIEEE, isRas: false };
  }
  const stage = participant.careerStage ?? (participant.sb ? CareerStage.Student : CareerStage.YoungProfessional);
  return { participantType: ParticipantType[stage], isRas: hasRas(record) };
}

/** Whether `ieeeId` could be an IEEE member number at all. */
export function isLookupableMemberNumber(ieeeId: number | null | undefined): ieeeId is number {
  return ieeeId != null && String(ieeeId).length >= MIN_MEMBER_NUMBER_DIGITS;
}

/** What the participant is shown about their IEEE check. */
export interface IeeeVerificationSummary {
  standing: IeeeStanding;
  isRas: boolean;
  matchedBy: IeeeMatch | null;
  checkedAt: Date;
  /** Their details changed since the check; a new one is on its way. */
  stale: boolean;
}

export function verificationSummaryOf(
  row: IeeeRecord & {
    matchedBy: string | null;
    checkedAt: Date;
    claimedIeeeId: number | null;
    claimedType: string;
    claimedIsRas: boolean;
    claimedEmail: string;
  },
  current: { ieeeId: number | null; participantType: ParticipantType; isRas: boolean; email: string },
): IeeeVerificationSummary {
  return {
    standing: ieeeStandingOf(row.memberStatus),
    isRas: hasRas(row),
    matchedBy: row.matchedBy === 'IEEE_ID' || row.matchedBy === 'EMAIL' ? row.matchedBy : null,
    checkedAt: row.checkedAt,
    stale: isVerificationStale(row, current),
  };
}

/**
 * Whether a stored result still describes the participant (same member number
 * and email as when it was checked) but they aren't priced on it. The admin
 * portal writes results without touching the participant, so its checks land
 * here until the backend applies them.
 */
export function storedResultDisagrees(
  row: IeeeRecord & { claimedIeeeId: number | null; claimedEmail: string },
  current: {
    ieeeId: number | null;
    email: string;
    participantType: ParticipantType;
    isRas: boolean;
    careerStage: CareerStage | null;
    sb: SB | null;
  },
): boolean {
  if (row.claimedIeeeId !== current.ieeeId || row.claimedEmail !== current.email) return false;
  const verdict = membershipFrom(row, current);
  return verdict.participantType !== current.participantType || verdict.isRas !== current.isRas;
}

/**
 * The admin portal's staleness rule: a row describes the participant only
 * while every `claimed*` value still equals the participant's current one.
 */
export function isVerificationStale(
  row: { claimedIeeeId: number | null; claimedType: string; claimedIsRas: boolean; claimedEmail: string },
  current: { ieeeId: number | null; participantType: ParticipantType; isRas: boolean; email: string },
): boolean {
  return (
    row.claimedIeeeId !== current.ieeeId ||
    row.claimedType !== current.participantType ||
    row.claimedIsRas !== current.isRas ||
    row.claimedEmail !== current.email
  );
}
