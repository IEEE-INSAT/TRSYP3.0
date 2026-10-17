import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { SmashRoomService } from './service';
import { SubmitSmashRoomSchema } from './dto';
import { PrismaService } from '../../prisma/prisma.service';

describe('SmashRoomService', () => {
  let service: SmashRoomService;
  let mockPrismaService: any;
  /** Value of SMASH_ROOM_PHASE for the current test - open unless a test says otherwise. */
  let phase: string | undefined;

  const input = {
    firstName: 'Amine',
    lastName: 'Achour',
    sb: 'INSAT' as const,
    university: null,
    riddleAnswer: 'a robot',
    passType: 'TRIO' as const,
  };

  const participant = (overrides: Record<string, any> = {}) => ({
    id: 'participant-1',
    paid: true,
    banned: false,
    workshopPaymentWaiver: null,
    participantType: 'Student',
    sb: 'INSAT',
    user: { email: 'me@test.tn', name: 'Amine', lastName: 'Achour' },
    internationalInfo: null,
    smashRoomEntry: null,
    ...overrides,
  });

  beforeEach(async () => {
    phase = 'open';
    mockPrismaService = {
      participant: { findUnique: jest.fn().mockResolvedValue(participant()) },
      smashRoomEntry: { create: jest.fn().mockResolvedValue({ id: 'e-1' }), findMany: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SmashRoomService,
        { provide: PrismaService, useValue: mockPrismaService },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) =>
              key === 'SMASH_ROOM_PHASE' ? phase : key === 'WORKSHOP_TESTER_EMAILS' ? 'tester@test.tn' : undefined,
            ),
          },
        },
      ],
    }).compile();

    service = module.get<SmashRoomService>(SmashRoomService);
  });

  describe('submit', () => {
    it("should store the form against the caller's participant", async () => {
      await service.submit('user-1', input);
      expect(mockPrismaService.smashRoomEntry.create).toHaveBeenCalledWith({
        data: { ...input, participantId: 'participant-1' },
      });
    });

    it('should refuse while the form is not open', async () => {
      phase = 'soon';
      await expect(service.submit('user-1', input)).rejects.toThrow('not opened yet');
      phase = 'closed';
      await expect(service.submit('user-1', input)).rejects.toThrow('closed');
      expect(mockPrismaService.smashRoomEntry.create).not.toHaveBeenCalled();
    });

    it('should refuse an unpaid participant', async () => {
      mockPrismaService.participant.findUnique.mockResolvedValue(participant({ paid: false }));
      await expect(service.submit('user-1', input)).rejects.toThrow(ForbiddenException);
    });

    it('should accept an unpaid participant with a waiver, or a tester', async () => {
      mockPrismaService.participant.findUnique.mockResolvedValueOnce(
        participant({ paid: false, workshopPaymentWaiver: { participantId: 'participant-1' } }),
      );
      await service.submit('user-1', input);
      mockPrismaService.participant.findUnique.mockResolvedValueOnce(
        participant({ paid: false, user: { email: 'Tester@test.tn', name: 'T', lastName: 'T' } }),
      );
      await service.submit('user-1', input);
      expect(mockPrismaService.smashRoomEntry.create).toHaveBeenCalledTimes(2);
    });

    it('should refuse a banned participant', async () => {
      mockPrismaService.participant.findUnique.mockResolvedValue(participant({ banned: true }));
      await expect(service.submit('user-1', input)).rejects.toThrow('Banned');
    });

    it('should refuse a second submission - submissions are final', async () => {
      mockPrismaService.participant.findUnique.mockResolvedValue(participant({ smashRoomEntry: { id: 'e-0' } }));
      await expect(service.submit('user-1', input)).rejects.toThrow(ConflictException);
      expect(mockPrismaService.smashRoomEntry.create).not.toHaveBeenCalled();
    });

    it('should turn a concurrent duplicate into a conflict', async () => {
      mockPrismaService.smashRoomEntry.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('dup', { code: 'P2002', clientVersion: 'x' }),
      );
      await expect(service.submit('user-1', input)).rejects.toThrow('already submitted');
    });

    it('should need a participant profile', async () => {
      mockPrismaService.participant.findUnique.mockResolvedValue(null);
      await expect(service.submit('user-1', input)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getOverview', () => {
    it("should prefill an IEEE member's name and student branch", async () => {
      const { prefill } = await service.getOverview('user-1');
      expect(prefill).toEqual({ firstName: 'Amine', lastName: 'Achour', isIeee: true, sb: 'INSAT', university: null });
    });

    it("should prefill a non-member's university from their international affiliation", async () => {
      mockPrismaService.participant.findUnique.mockResolvedValue(
        participant({ participantType: 'NonIEEE', sb: 'Other', internationalInfo: { affiliation: ' TU Munich ' } }),
      );
      const { prefill } = await service.getOverview('user-1');
      expect(prefill).toMatchObject({ isIeee: false, sb: null, university: 'TU Munich' });
    });

    it("should otherwise prefill a non-member's university from the school they picked", async () => {
      mockPrismaService.participant.findUnique.mockResolvedValue(participant({ participantType: 'NonIEEE', sb: 'ENIT' }));
      expect((await service.getOverview('user-1')).prefill).toMatchObject({ sb: null, university: 'ENIT' });

      mockPrismaService.participant.findUnique.mockResolvedValue(participant({ participantType: 'NonIEEE', sb: 'Other' }));
      expect((await service.getOverview('user-1')).prefill.university).toBeNull();
    });
  });

  describe('SubmitSmashRoomSchema', () => {
    const body = { firstName: ' Amine ', lastName: 'Achour', riddleAnswer: 'x', passType: 'DUO' };

    it('should take a student branch', () => {
      expect(SubmitSmashRoomSchema.parse({ ...body, sb: 'INSAT' })).toMatchObject({
        firstName: 'Amine',
        sb: 'INSAT',
        university: null,
      });
    });

    it('should take a university instead', () => {
      expect(SubmitSmashRoomSchema.parse({ ...body, university: 'Université de Tunis' })).toMatchObject({
        sb: null,
        university: 'Université de Tunis',
      });
    });

    it('should need exactly one of branch and university', () => {
      expect(SubmitSmashRoomSchema.safeParse(body).success).toBe(false);
      expect(SubmitSmashRoomSchema.safeParse({ ...body, university: '  ' }).success).toBe(false);
      expect(SubmitSmashRoomSchema.safeParse({ ...body, sb: 'INSAT', university: 'X' }).success).toBe(false);
    });

    it('should only take duo, trio or squad', () => {
      expect(SubmitSmashRoomSchema.safeParse({ ...body, sb: 'INSAT', passType: 'SOLO' }).success).toBe(false);
    });
  });
});
