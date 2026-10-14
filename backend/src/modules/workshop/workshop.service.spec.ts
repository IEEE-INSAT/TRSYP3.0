import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { WorkshopService } from './service';
import { PrismaService } from '../../prisma/prisma.service';

describe('WorkshopService', () => {
  let service: WorkshopService;
  let mockPrismaService: any;
  /** Value of WORKSHOP_BOOKING_PHASE for the current test - open unless a test says otherwise. */
  let phase: string | undefined;

  const workshop = (overrides: Record<string, any> = {}) => ({
    id: 'yp-transition-lab',
    title: 'YP Transition Lab',
    speaker: null,
    room: 'Salle César',
    session: 1,
    startTime: '09:00',
    endTime: '10:00',
    capacity: 60,
    reservesChallengeSeats: false,
    sortOrder: 1,
    ...overrides,
  });

  const pitching = (overrides: Record<string, any> = {}) =>
    workshop({ id: 'pitching', capacity: 45, reservesChallengeSeats: true, ...overrides });

  const participant = (overrides: Record<string, any> = {}) => ({
    id: 'participant-1',
    paid: true,
    banned: false,
    ...overrides,
  });

  /**
   * A transaction client for `book`. `booked` is the workshop's seat count,
   * `unsecured` the number of challenge teams still owed a held seat,
   * `team` the caller's challenge team membership and `teamSecured` whether a
   * teammate already booked.
   */
  const bookingTx = (opts: {
    workshop?: Record<string, any>;
    participant?: Record<string, any>;
    booked?: number;
    current?: Record<string, any> | null;
    team?: Record<string, any> | null;
    teamSecured?: boolean;
    unsecured?: number;
    create?: jest.Mock;
  } = {}) => {
    const w = opts.workshop ?? workshop();
    const tx = {
      participant: { findUnique: jest.fn().mockResolvedValue(participant(opts.participant)) },
      $queryRaw: jest.fn().mockResolvedValue([{ id: w.id }]),
      workshop: { findUniqueOrThrow: jest.fn().mockResolvedValue(w) },
      workshopBooking: {
        findUnique: jest.fn().mockResolvedValue(opts.current ?? null),
        count: jest.fn().mockResolvedValue(opts.booked ?? 0),
        findFirst: jest.fn().mockResolvedValue(opts.teamSecured ? { id: 'b-team' } : null),
        delete: jest.fn().mockResolvedValue({}),
        create: opts.create ?? jest.fn().mockResolvedValue({}),
      },
      teamMembership: {
        findUnique: jest.fn().mockResolvedValue(
          opts.team === undefined || opts.team === null ? null : { team: { selected: true, ...opts.team } },
        ),
      },
      team: { count: jest.fn().mockResolvedValue(opts.unsecured ?? 0) },
    };
    mockPrismaService.$transaction.mockImplementation(async (cb: any) => cb(tx));
    return tx;
  };

  beforeEach(async () => {
    phase = 'open';
    mockPrismaService = {
      $transaction: jest.fn(),
      participant: { findUnique: jest.fn() },
      workshopBooking: { deleteMany: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkshopService,
        { provide: PrismaService, useValue: mockPrismaService },
        {
          provide: ConfigService,
          useValue: { get: jest.fn((key: string) => (key === 'WORKSHOP_BOOKING_PHASE' ? phase : undefined)) },
        },
      ],
    }).compile();

    service = module.get<WorkshopService>(WorkshopService);
  });

  describe('book', () => {
    it('should lock the workshop row and book a free seat', async () => {
      const tx = bookingTx({ booked: 10 });

      await service.book('user-1', 'yp-transition-lab');

      expect(tx.$queryRaw).toHaveBeenCalled();
      expect(String(tx.$queryRaw.mock.calls[0][0].join('?'))).toContain('FOR UPDATE');
      expect(tx.workshopBooking.create).toHaveBeenCalledWith({
        data: { participantId: 'participant-1', workshopId: 'yp-transition-lab', session: 1 },
      });
    });

    it('should refuse when booking is not open', async () => {
      phase = 'soon';
      await expect(service.book('user-1', 'pitching')).rejects.toThrow('not opened yet');
      phase = 'closed';
      await expect(service.book('user-1', 'pitching')).rejects.toThrow('closed');
      expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
    });

    it('should refuse a participant whose payment is not confirmed', async () => {
      const tx = bookingTx({ participant: { paid: false } });
      await expect(service.book('user-1', 'yp-transition-lab')).rejects.toThrow(ForbiddenException);
      expect(tx.workshopBooking.create).not.toHaveBeenCalled();
    });

    it('should refuse a banned participant', async () => {
      bookingTx({ participant: { banned: true } });
      await expect(service.book('user-1', 'yp-transition-lab')).rejects.toThrow('Banned');
    });

    it('should refuse an unknown workshop', async () => {
      const tx = bookingTx();
      tx.$queryRaw.mockResolvedValue([]);
      await expect(service.book('user-1', 'nope')).rejects.toThrow(NotFoundException);
    });

    it('should refuse a full workshop', async () => {
      const tx = bookingTx({ workshop: workshop({ capacity: 12 }), booked: 12 });
      await expect(service.book('user-1', 'yp-transition-lab')).rejects.toThrow('full');
      expect(tx.workshopBooking.create).not.toHaveBeenCalled();
    });

    it('should refuse booking the same workshop twice', async () => {
      bookingTx({ current: { id: 'b-1', workshopId: 'yp-transition-lab', session: 1 } });
      await expect(service.book('user-1', 'yp-transition-lab')).rejects.toThrow(ConflictException);
    });

    it('should move an existing booking in the same session', async () => {
      const tx = bookingTx({ current: { id: 'b-1', workshopId: 'pitching', session: 1 } });

      await service.book('user-1', 'yp-transition-lab');

      expect(tx.workshopBooking.delete).toHaveBeenCalledWith({ where: { id: 'b-1' } });
      expect(tx.workshopBooking.create).toHaveBeenCalled();
      expect(tx.workshopBooking.delete.mock.invocationCallOrder[0]).toBeLessThan(
        tx.workshopBooking.create.mock.invocationCallOrder[0],
      );
    });

    it('should turn a concurrent duplicate into a conflict', async () => {
      const create = jest.fn().mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('dup', { code: 'P2002', clientVersion: 'x' }),
      );
      bookingTx({ create });
      await expect(service.book('user-1', 'yp-transition-lab')).rejects.toThrow(ConflictException);
    });

    describe('seats held for challenge teams', () => {
      it('should refuse an outsider the seats held for teams that have not booked', async () => {
        // 40 booked, 5 teams waiting: all 5 remaining seats are held.
        const tx = bookingTx({ workshop: pitching(), booked: 40, unsecured: 5 });
        await expect(service.book('user-1', 'pitching')).rejects.toThrow('held for technical challenge teams');
        expect(tx.workshopBooking.create).not.toHaveBeenCalled();
      });

      it('should let an outsider take a seat beyond the held ones', async () => {
        const tx = bookingTx({ workshop: pitching(), booked: 39, unsecured: 5 });
        await service.book('user-1', 'pitching');
        expect(tx.workshopBooking.create).toHaveBeenCalled();
      });

      it("should let a member of a waiting team take their team's held seat", async () => {
        const tx = bookingTx({ workshop: pitching(), booked: 44, unsecured: 1, team: { id: 'team-1' } });
        await service.book('user-1', 'pitching');
        expect(tx.workshopBooking.create).toHaveBeenCalled();
        expect(tx.team.count).not.toHaveBeenCalled();
      });

      it('should treat a second member of a secured team like anyone else', async () => {
        const tx = bookingTx({
          workshop: pitching(),
          booked: 44,
          unsecured: 1,
          team: { id: 'team-1' },
          teamSecured: true,
        });
        await expect(service.book('user-1', 'pitching')).rejects.toThrow('held');
        expect(tx.workshopBooking.create).not.toHaveBeenCalled();
      });

      it('should not hold seats on other workshops', async () => {
        const tx = bookingTx({ booked: 59, unsecured: 30 });
        await service.book('user-1', 'yp-transition-lab');
        expect(tx.team.count).not.toHaveBeenCalled();
        expect(tx.workshopBooking.create).toHaveBeenCalled();
      });
    });
  });

  describe('cancel', () => {
    it('should give the seat back', async () => {
      mockPrismaService.participant.findUnique.mockResolvedValue(participant());
      mockPrismaService.workshopBooking.deleteMany.mockResolvedValue({ count: 1 });

      await service.cancel('user-1', 'pitching');

      expect(mockPrismaService.workshopBooking.deleteMany).toHaveBeenCalledWith({
        where: { participantId: 'participant-1', workshopId: 'pitching' },
      });
    });

    it('should say so when there is no seat to give back', async () => {
      mockPrismaService.participant.findUnique.mockResolvedValue(participant());
      mockPrismaService.workshopBooking.deleteMany.mockResolvedValue({ count: 0 });
      await expect(service.cancel('user-1', 'pitching')).rejects.toThrow(NotFoundException);
    });

    it('should refuse once booking is closed', async () => {
      phase = 'closed';
      await expect(service.cancel('user-1', 'pitching')).rejects.toThrow(ForbiddenException);
    });
  });
});
