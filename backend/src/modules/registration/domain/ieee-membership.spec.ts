import { CareerStage, IeeeCheckStatus, ParticipantType, SB } from '@prisma/client';
import {
  checkStatusOf,
  ieeeStandingOf,
  isLookupableMemberNumber,
  isVerificationStale,
  membershipFrom,
} from './ieee-membership';

const student = { careerStage: CareerStage.Student, sb: SB.INSAT };
const youngProfessional = { careerStage: CareerStage.YoungProfessional, sb: null };

describe('membershipFrom', () => {
  it.each([
    ['active RAS member', 'Active', ['UH3001', 'MEMRA024'], ParticipantType.Student, true],
    ['active member, society code in lower case', 'active', ['memra024'], ParticipantType.Student, true],
    ['active member without RAS', 'Active', ['UH3001'], ParticipantType.Student, false],
    ['applicant: a member, but no societies count yet', 'Applicant', ['MEMRA024'], ParticipantType.Student, false],
    ['account that never held a membership', 'Not Applicable', [], ParticipantType.NonIEEE, false],
    ['lapsed member keeps no RAS', 'Arrears', ['MEMRA024'], ParticipantType.NonIEEE, false],
    ['inactive', 'Inactive', [], ParticipantType.NonIEEE, false],
    ['no record', null, [], ParticipantType.NonIEEE, false],
  ])('%s', (_label, memberStatus, societies, participantType, isRas) => {
    expect(membershipFrom({ memberStatus, societies }, student)).toEqual({ participantType, isRas });
  });

  it("keeps the participant's own career stage, whatever IEEE's grade", () => {
    expect(membershipFrom({ memberStatus: ' Active ', societies: [] }, youngProfessional).participantType).toBe(
      ParticipantType.YoungProfessional,
    );
  });

  it('falls back on the student branch when the career stage was never answered', () => {
    const record = { memberStatus: 'Active', societies: [] };
    expect(membershipFrom(record, { careerStage: null, sb: SB.ENIS }).participantType).toBe(ParticipantType.Student);
    expect(membershipFrom(record, { careerStage: null, sb: null }).participantType).toBe(
      ParticipantType.YoungProfessional,
    );
  });
});

describe('checkStatusOf (the admin portal mapping)', () => {
  it.each([
    [null, IeeeCheckStatus.NOT_FOUND],
    ['Active', IeeeCheckStatus.VERIFIED],
    ['Applicant', IeeeCheckStatus.VERIFIED],
    ['Not Applicable', IeeeCheckStatus.INACTIVE],
    ['Arrears', IeeeCheckStatus.INACTIVE],
    ['Inactive', IeeeCheckStatus.INACTIVE],
  ])('%s -> %s', (memberStatus, status) => {
    expect(checkStatusOf({ memberStatus, societies: [] })).toBe(status);
  });
});

describe('ieeeStandingOf', () => {
  it.each([
    ['Active', 'MEMBER'],
    ['Applicant', 'APPLICANT'],
    ['Arrears', 'LAPSED'],
    ['Inactive', 'LAPSED'],
    ['Not Applicable', 'NOT_MEMBER'],
    [null, 'NOT_MEMBER'],
  ])('%s -> %s', (memberStatus, standing) => {
    expect(ieeeStandingOf(memberStatus)).toBe(standing);
  });
});

describe('isLookupableMemberNumber', () => {
  it('skips numbers too short to be IEEE member numbers', () => {
    expect(isLookupableMemberNumber(1234)).toBe(false);
    expect(isLookupableMemberNumber(12345)).toBe(true);
    expect(isLookupableMemberNumber(null)).toBe(false);
  });
});

describe('isVerificationStale', () => {
  const row = { claimedIeeeId: 12345678, claimedType: 'Student', claimedIsRas: true, claimedEmail: 'a@b.com' };
  const current = { ieeeId: 12345678, participantType: ParticipantType.Student, isRas: true, email: 'a@b.com' };

  it('is fresh while every claimed value matches', () => {
    expect(isVerificationStale(row, current)).toBe(false);
  });

  it.each([
    ['member number', { ieeeId: null }],
    ['type', { participantType: ParticipantType.YoungProfessional }],
    ['RAS', { isRas: false }],
    ['email', { email: 'c@d.com' }],
  ])('is stale once the %s changes', (_label, change) => {
    expect(isVerificationStale(row, { ...current, ...change })).toBe(true);
  });
});
