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
    audience: null,
    sortOrder: 1,
    ...overrides,
  });

  const participant = (overrides: Record<string, any> = {}) => ({
    id: 'participant-1',
    paid: true,
    banned: false,
    workshopPaymentWaiver: null,
    user: { email: 'me@test.tn' },
    ...overrides,
  });

  /** A technical challenge team as `loadDuties` reads it; `true` members have a workshop seat. */
  const team = (id: string, members: [string, boolean][]) => ({
    id,
    name: `Team ${id}`,
    code: id.toUpperCase(),
    memberships: members.map(([name, inWorkshop]) => ({
      participant: {
        paid: true,
        banned: false,
        sb: 'INSAT',
        workshopPaymentWaiver: null,
        user: { name, lastName: 'X' },
        _count: { workshopBookings: inWorkshop ? 1 : 0 },
      },
    })),
  });

  /** A transaction client for `book`. */
  const bookingTx = (opts: {
    workshop?: Record<string, any>;
    participant?: Record<string, any>;
    booked?: number;
    current?: Record<string, any> | null;
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
        create: opts.create ?? jest.fn().mockResolvedValue({}),
      },
    };
    mockPrismaService.$transaction.mockImplementation(async (cb: any) => cb(tx));
    return tx;
  };

  beforeEach(async () => {
    phase = 'open';
    mockPrismaService = {
      $transaction: jest.fn(),
      participant: { findUnique: jest.fn() },
      workshop: { findMany: jest.fn() },
      team: { findMany: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkshopService,
        { provide: PrismaService, useValue: mockPrismaService },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) =>
              key === 'WORKSHOP_BOOKING_PHASE'
                ? phase
                : key === 'WORKSHOP_SB_PENALTY'
                  ? '5'
                  : key === 'WORKSHOP_TESTER_EMAILS'
                    ? ' Tester@Test.tn , other@test.tn'
                    : undefined,
            ),
          },
        },
      ],
    }).compile();

    service = module.get<WorkshopService>(WorkshopService);
  });

  describe('book', () => {
    it('should lock the workshop row and book a free seat', async () => {
      const tx = bookingTx({ booked: 10 });

      await service.book('user-1', 'yp-transition-lab');

      expect(tx.$queryRaw.mock.calls[0][0].join('?')).toContain('FOR UPDATE');
      expect(tx.workshopBooking.create).toHaveBeenCalledWith({
        data: { participantId: 'participant-1', workshopId: 'yp-transition-lab', session: 1 },
      });
    });

    it('should refuse when booking is not open', async () => {
      phase = 'soon';
      await expect(service.book('user-1', 'yp-transition-lab')).rejects.toThrow('not opened yet');
      phase = 'closed';
      await expect(service.book('user-1', 'yp-transition-lab')).rejects.toThrow('closed');
      expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
    });

    it('should refuse a participant whose payment is not confirmed', async () => {
      const tx = bookingTx({ participant: { paid: false } });
      await expect(service.book('user-1', 'yp-transition-lab')).rejects.toThrow(ForbiddenException);
      expect(tx.workshopBooking.create).not.toHaveBeenCalled();
    });

    it('should let an unpaid participant with a payment waiver book', async () => {
      const tx = bookingTx({ participant: { paid: false, workshopPaymentWaiver: { participantId: 'participant-1' } } });
      await service.book('user-1', 'yp-transition-lab');
      expect(tx.workshopBooking.create).toHaveBeenCalled();
    });

    it('should let an unpaid tester book', async () => {
      const tx = bookingTx({ participant: { paid: false, user: { email: 'tester@test.tn' } } });
      await service.book('user-1', 'yp-transition-lab');
      expect(tx.workshopBooking.create).toHaveBeenCalled();
    });

    it('should refuse a banned participant, waiver or not', async () => {
      bookingTx({ participant: { banned: true, workshopPaymentWaiver: { participantId: 'participant-1' } } });
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

    it('should refuse a second seat in the session - bookings are final', async () => {
      const tx = bookingTx({ current: { id: 'b-1', workshopId: 'pitching', session: 1 } });
      await expect(service.book('user-1', 'yp-transition-lab')).rejects.toThrow('Bookings are final');
      expect(tx.workshopBooking.create).not.toHaveBeenCalled();
    });

    it('should turn a concurrent duplicate into a conflict', async () => {
      const create = jest.fn().mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('dup', { code: 'P2002', clientVersion: 'x' }),
      );
      bookingTx({ create });
      await expect(service.book('user-1', 'yp-transition-lab')).rejects.toThrow(ConflictException);
    });

    it('should turn a transaction that never started into a try-again', async () => {
      mockPrismaService.$transaction.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('wait', { code: 'P2028', clientVersion: 'x' }),
      );
      await expect(service.book('user-1', 'yp-transition-lab')).rejects.toThrow('Try again in a moment');
    });
  });

  describe('getOverview', () => {
    beforeEach(() => {
      mockPrismaService.participant.findUnique.mockResolvedValue(participant());
      mockPrismaService.workshop.findMany.mockResolvedValue([
        { ...workshop(), _count: { bookings: 58 }, bookings: [] },
        { ...workshop({ id: 'ras-leaders', session: 2, capacity: 12 }), _count: { bookings: 12 }, bookings: [{ id: 'b' }] },
      ]);
    });

    it("should report seats and the caller's own seats", async () => {
      mockPrismaService.team.findMany.mockResolvedValue([]);

      const overview = await service.getOverview('user-1');

      expect(overview.workshops.map((w) => [w.id, w.seatsLeft, w.bookedByMe])).toEqual([
        ['yp-transition-lab', 2, false],
        ['ras-leaders', 0, true],
      ]);
      expect(overview.team).toBeNull();
    });

    it("should report the caller's team and its penalty while nobody is in a workshop", async () => {
      mockPrismaService.team.findMany.mockResolvedValue([team('t1', [['A', false], ['B', false]])]);

      const overview = await service.getOverview('user-1');

      expect(overview.team).toMatchObject({ teamName: 'Team t1', compliant: false, sbPenalty: -5, inWorkshop: [] });
      expect(mockPrismaService.team.findMany.mock.calls[0][0].where).toMatchObject({
        activity: 'CHALLENGE',
        selected: true,
        memberships: { some: { participantId: 'participant-1' } },
      });
    });

    it('should clear the penalty once a member has a workshop seat', async () => {
      mockPrismaService.team.findMany.mockResolvedValue([team('t1', [['A', true], ['B', false]])]);

      const overview = await service.getOverview('user-1');

      expect(overview.team).toMatchObject({ compliant: true, sbPenalty: 0, inWorkshop: ['A X'] });
    });
  });
});
