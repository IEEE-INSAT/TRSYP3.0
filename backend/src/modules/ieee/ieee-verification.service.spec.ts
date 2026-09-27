import { CareerStage, ParticipantType, SB } from '@prisma/client';
import { IeeeApiClient, IeeeApiError } from './ieee-api.client';
import { IeeeVerificationService } from './ieee-verification.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('IeeeVerificationService', () => {
  const participant = {
    ieeeId: 12345678 as number | null,
    careerStage: CareerStage.Student,
    sb: SB.INSAT,
    user: { email: 'a@b.com', active: true },
  };
  let prisma: any;
  let ieee: { isConfigured: jest.Mock; getStatus: jest.Mock };
  let service: IeeeVerificationService;

  beforeEach(() => {
    prisma = {
      participant: { findUnique: jest.fn().mockResolvedValue(participant), update: jest.fn() },
      ieeeVerification: { upsert: jest.fn() },
      $transaction: jest.fn((cb) => cb(prisma)),
    };
    ieee = { isConfigured: jest.fn().mockReturnValue(true), getStatus: jest.fn() };
    service = new IeeeVerificationService(prisma as PrismaService, ieee as unknown as IeeeApiClient);
  });

  const found = (memberStatus: string, societies: string[] = []) => ({
    found: true,
    memberStatus,
    grade: 'Student Member',
    societies,
    firstInitial: 'S',
    lastInitial: 'M',
  });

  it('looks up by member number first and writes the result through', async () => {
    ieee.getStatus.mockResolvedValue(found('Active', ['UH3001', 'MEMRA024']));

    await expect(service.verify('p1')).resolves.toBe('CHECKED');

    expect(ieee.getStatus).toHaveBeenCalledTimes(1);
    expect(ieee.getStatus).toHaveBeenCalledWith('12345678');
    expect(prisma.participant.update).toHaveBeenCalledWith({
      where: { id: 'p1' },
      data: { participantType: ParticipantType.Student, isRas: true },
    });
    const row = prisma.ieeeVerification.upsert.mock.calls[0][0].update;
    expect(row).toEqual(
      expect.objectContaining({
        status: 'VERIFIED',
        memberStatus: 'Active',
        grade: 'Student Member',
        societies: ['UH3001', 'MEMRA024'],
        matchedBy: 'IEEE_ID',
        issues: [],
        checkedBy: 'system',
        // The participant's values *after* the update, or the admin portal
        // reads the row as stale.
        claimedIeeeId: 12345678,
        claimedType: ParticipantType.Student,
        claimedIsRas: true,
        claimedEmail: 'a@b.com',
      }),
    );
  });

  it('falls back on the email when the member number is not found', async () => {
    ieee.getStatus.mockResolvedValueOnce({ found: false }).mockResolvedValueOnce(found('Applicant'));

    await service.verify('p1');

    expect(ieee.getStatus).toHaveBeenLastCalledWith('a@b.com');
    const row = prisma.ieeeVerification.upsert.mock.calls[0][0].update;
    expect(row).toEqual(
      expect.objectContaining({ matchedBy: 'EMAIL', status: 'VERIFIED', claimedType: 'Student', claimedIsRas: false }),
    );
  });

  it('skips a member number too short to be one', async () => {
    prisma.participant.findUnique.mockResolvedValue({ ...participant, ieeeId: 1234 });
    ieee.getStatus.mockResolvedValue({ found: false });

    await service.verify('p1');

    expect(ieee.getStatus).toHaveBeenCalledTimes(1);
    expect(ieee.getStatus).toHaveBeenCalledWith('a@b.com');
  });

  it('records "not found" with empty IEEE columns and prices the participant as a non-member', async () => {
    ieee.getStatus.mockResolvedValue({ found: false });

    await service.verify('p1');

    expect(prisma.participant.update).toHaveBeenCalledWith({
      where: { id: 'p1' },
      data: { participantType: ParticipantType.NonIEEE, isRas: false },
    });
    expect(prisma.ieeeVerification.upsert.mock.calls[0][0].update).toEqual(
      expect.objectContaining({
        status: 'NOT_FOUND',
        memberStatus: null,
        grade: null,
        societies: [],
        firstInitial: null,
        lastInitial: null,
        matchedBy: null,
        claimedType: ParticipantType.NonIEEE,
        claimedIsRas: false,
      }),
    );
  });

  it('never looks up by email before the account is activated', async () => {
    prisma.participant.findUnique.mockResolvedValue({ ...participant, ieeeId: null, user: { email: 'a@b.com', active: false } });

    await expect(service.verify('p1')).resolves.toBe('NOT_READY');
    expect(ieee.getStatus).not.toHaveBeenCalled();
    expect(prisma.ieeeVerification.upsert).not.toHaveBeenCalled();
  });

  it('writes nothing when IEEE fails', async () => {
    ieee.getStatus.mockRejectedValue(new IeeeApiError('timeout'));

    await expect(service.verify('p1')).rejects.toThrow(IeeeApiError);
    expect(prisma.participant.update).not.toHaveBeenCalled();
    expect(prisma.ieeeVerification.upsert).not.toHaveBeenCalled();
  });

  it('drops a result whose member number changed during the call', async () => {
    ieee.getStatus.mockResolvedValue(found('Active'));
    prisma.participant.findUnique
      .mockResolvedValueOnce(participant)
      .mockResolvedValueOnce({ ...participant, ieeeId: 87654321 });

    await expect(service.verify('p1')).resolves.toBe('SUPERSEDED');
    expect(prisma.ieeeVerification.upsert).not.toHaveBeenCalled();
  });
});
