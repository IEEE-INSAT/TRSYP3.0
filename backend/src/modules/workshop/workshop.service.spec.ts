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

  /** A workshop row as `findMany` returns it, with its seat count. */
  const workshop = (id: string, booked: number, overrides: Record<string, any> = {}) => ({
    id,
    title: id,
    speaker: null,
    room: 'Room',
    session: 1,
    startTime: '09:00',
    endTime: '10:00',
    capacity: 45,
    audience: null,
    sortOrder: 1,
    teams: [],
    _count: { bookings: booked },
    ...overrides,
  });

  /** A pitching slot open to teams t1-t4, in session 1 unless said otherwise. */
  const slot = (booked: number, session = 1) =>
    workshop(`slot${session}`, booked, {
      session,
      capacity: 10,
      teams: ['t1', 't2', 't3', 't4'].map((teamId) => ({ teamId })),
    });

  type Seat = 'pitch' | 'workshop' | null;
  /**
   * A pitching team as `loadDuties` reads it. Each member is `[id, seat]`,
   * `[id, seat, paid]` or `[id, seat, paid, waived]`; `pitchSession` is where
   * its slot is.
   */
  const team = (id: string, members: [string, Seat, boolean?, boolean?][], opts: { pitchSession?: number } = {}) => {
    const session = opts.pitchSession ?? 1;
    return {
      id,
      name: `Team ${id}`,
      code: id.toUpperCase(),
      workshopAccess: [{ workshopId: `slot${session}`, workshop: { session } }],
      memberships: members.map(([pid, seat, paid = true, waived = false]) => ({
        participant: {
          id: pid,
          paid,
          banned: false,
          sb: 'INSAT',
          workshopPaymentWaiver: waived ? { participantId: pid } : null,
          user: { name: pid, lastName: 'X' },
          workshopBookings: seat ? [{ workshop: { _count: { teams: seat === 'pitch' ? 4 : 0 } } }] : [],
        },
      })),
    };
  };

  /**
   * A transaction client for `book` by participant `me`. `workshops` are the
   * rows of the session being booked, `teams` every pitching team, `current`
   * the caller's seat in the session.
   */
  const bookingTx = (opts: {
    workshops: Record<string, any>[];
    teams?: Record<string, any>[];
    current?: Record<string, any> | null;
    participant?: Record<string, any>;
    create?: jest.Mock;
  }) => {
    const tx = {
      participant: {
        findUnique: jest.fn().mockResolvedValue({ id: 'me', paid: true, banned: false, workshopPaymentWaiver: null, ...opts.participant }),
      },
      $queryRaw: jest.fn().mockResolvedValue(opts.workshops.map((w) => ({ id: w.id }))),
      workshop: { findMany: jest.fn().mockResolvedValue(opts.workshops) },
      team: { findMany: jest.fn().mockResolvedValue(opts.teams ?? []) },
      workshopBooking: {
        findUnique: jest.fn().mockResolvedValue(opts.current ?? null),
        delete: jest.fn().mockResolvedValue({}),
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
      workshopBooking: { deleteMany: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkshopService,
        { provide: PrismaService, useValue: mockPrismaService },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) =>
              key === 'WORKSHOP_BOOKING_PHASE' ? phase : key === 'WORKSHOP_SB_PENALTY' ? '5' : undefined,
            ),
          },
        },
      ],
    }).compile();

    service = module.get<WorkshopService>(WorkshopService);
  });

  describe('book', () => {
    it("should lock the session's workshops in id order and book a free seat", async () => {
      const tx = bookingTx({ workshops: [workshop('a', 10), workshop('b', 0)] });

      await service.book('user-1', 'a');

      const sql = tx.$queryRaw.mock.calls[0][0].join('?');
      expect(sql).toContain('ORDER BY id');
      expect(sql).toContain('FOR UPDATE');
      expect(tx.workshopBooking.create).toHaveBeenCalledWith({
        data: { participantId: 'me', workshopId: 'a', session: 1 },
      });
    });

    it('should refuse when booking is not open', async () => {
      phase = 'soon';
      await expect(service.book('user-1', 'a')).rejects.toThrow('not opened yet');
      phase = 'closed';
      await expect(service.book('user-1', 'a')).rejects.toThrow('closed');
      expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
    });

    it('should refuse a participant whose payment is not confirmed', async () => {
      const tx = bookingTx({ workshops: [workshop('a', 0)], participant: { paid: false } });
      await expect(service.book('user-1', 'a')).rejects.toThrow(ForbiddenException);
      expect(tx.workshopBooking.create).not.toHaveBeenCalled();
    });

    it('should let an unpaid participant with a payment waiver book', async () => {
      const tx = bookingTx({ workshops: [workshop('a', 0)], participant: { paid: false, workshopPaymentWaiver: { participantId: 'me' } } });
      await service.book('user-1', 'a');
      expect(tx.workshopBooking.create).toHaveBeenCalled();
    });

    it('should refuse a banned participant, waiver or not', async () => {
      bookingTx({ workshops: [workshop('a', 0)], participant: { banned: true, workshopPaymentWaiver: { participantId: 'me' } } });
      await expect(service.book('user-1', 'a')).rejects.toThrow('Banned');
    });

    it('should refuse an unknown workshop', async () => {
      bookingTx({ workshops: [] });
      await expect(service.book('user-1', 'nope')).rejects.toThrow(NotFoundException);
    });

    it('should refuse a full workshop', async () => {
      const tx = bookingTx({ workshops: [workshop('a', 12, { capacity: 12 })] });
      await expect(service.book('user-1', 'a')).rejects.toThrow('full');
      expect(tx.workshopBooking.create).not.toHaveBeenCalled();
    });

    it('should refuse booking the same workshop twice', async () => {
      bookingTx({ workshops: [workshop('a', 1)], current: { id: 'b-1', workshopId: 'a', session: 1 } });
      await expect(service.book('user-1', 'a')).rejects.toThrow(ConflictException);
    });

    it('should refuse a second seat in the session - bookings are final', async () => {
      const tx = bookingTx({
        workshops: [workshop('a', 1), workshop('b', 0)],
        current: { id: 'b-1', workshopId: 'a', session: 1 },
      });

      await expect(service.book('user-1', 'b')).rejects.toThrow('Bookings are final');
      expect(tx.workshopBooking.delete).not.toHaveBeenCalled();
      expect(tx.workshopBooking.create).not.toHaveBeenCalled();
    });

    it('should turn a concurrent duplicate into a conflict', async () => {
      const create = jest.fn().mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('dup', { code: 'P2002', clientVersion: 'x' }),
      );
      bookingTx({ workshops: [workshop('a', 0)], create });
      await expect(service.book('user-1', 'a')).rejects.toThrow(ConflictException);
    });

    it('should turn a transaction that never started into a try-again', async () => {
      mockPrismaService.$transaction.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('wait', { code: 'P2028', clientVersion: 'x' }),
      );
      await expect(service.book('user-1', 'a')).rejects.toThrow('Try again in a moment');
    });

    describe('pitching slots', () => {
      it("should refuse anyone outside the slot's teams", async () => {
        const tx = bookingTx({ workshops: [slot(0)], teams: [team('t1', [['p1', null]])] });
        await expect(service.book('user-1', 'slot1')).rejects.toThrow('only for the teams pitching');
        expect(tx.workshopBooking.create).not.toHaveBeenCalled();
      });

      it('should let every member of a team pitch', async () => {
        const tx = bookingTx({ workshops: [slot(2)], teams: [team('t1', [['me', null], ['p2', 'pitch'], ['p3', 'pitch']])] });
        await service.book('user-1', 'slot1');
        expect(tx.workshopBooking.create).toHaveBeenCalled();
      });

      it("should hold the slot's seats for teams with nobody pitching yet", async () => {
        // 7 taken, the caller's team already pitching, 3 teams still waiting.
        const tx = bookingTx({
          workshops: [slot(7)],
          teams: [
            team('t1', [['me', null], ['p2', 'pitch']]),
            team('t2', [['p4', null]]),
            team('t3', [['p5', null]]),
            team('t4', [['p6', null]]),
          ],
        });
        await expect(service.book('user-1', 'slot1')).rejects.toThrow('held for the other teams');
        expect(tx.workshopBooking.create).not.toHaveBeenCalled();
      });

      it("should give a waiting team's member the team's held seat", async () => {
        const tx = bookingTx({
          workshops: [slot(9)],
          teams: [team('t1', [['me', null], ['p2', null]]), team('t2', [['p4', 'pitch']])],
        });
        await service.book('user-1', 'slot1');
        expect(tx.workshopBooking.create).toHaveBeenCalled();
      });
    });

    describe('seats held for pitching teams with nobody in a workshop', () => {
      // Session 2 holds seats for teams pitching in session 1.
      const s2 = (a: number, b: number) => [slot(0, 2), workshop('a', a, { session: 2 }), workshop('b', b, { session: 2, capacity: 60 })];
      const owing = [
        team('t1', [['p1', 'pitch'], ['p2', 'pitch']]), // owes a workshop member
        team('t2', [['p3', 'pitch'], ['p4', null]]), // owes a workshop member
        team('t3', [['p5', 'pitch']]), // one member: owes one too
        team('t4', [['p6', 'pitch'], ['p7', 'workshop']]), // already compliant
        team('t5', [['p8', null, false]]), // nobody able to book: nothing to hold
      ];

      it('should refuse an outsider the seats held in the other session', async () => {
        // 3 seats left across session 2, 3 teams owed one.
        const tx = bookingTx({ workshops: s2(43, 59), teams: owing });
        await expect(service.book('user-1', 'a')).rejects.toThrow('held for pitching teams');
        expect(tx.workshopBooking.create).not.toHaveBeenCalled();
      });

      it('should let an outsider take a seat beyond the held ones', async () => {
        const tx = bookingTx({ workshops: s2(42, 59), teams: owing });
        await service.book('user-1', 'a');
        expect(tx.workshopBooking.create).toHaveBeenCalled();
      });

      it("should give an owing team's member, even one who pitched, any free seat", async () => {
        const tx = bookingTx({
          workshops: s2(44, 60),
          teams: [team('t1', [['me', 'pitch'], ['p2', 'pitch']]), team('t2', [['p3', 'pitch'], ['p4', null]])],
        });
        await service.book('user-1', 'a');
        expect(tx.workshopBooking.create).toHaveBeenCalled();
      });

      it("should not hold seats in a team's own pitching session", async () => {
        // Session 1 is where t1/t2 pitch: nothing is held there for them.
        const tx = bookingTx({ workshops: [slot(4), workshop('a', 44)], teams: owing });
        await service.book('user-1', 'a');
        expect(tx.workshopBooking.create).toHaveBeenCalled();
      });

      it('should hold a seat for a team whose only able member has a payment waiver', async () => {
        const tx = bookingTx({
          workshops: s2(44, 60),
          teams: [team('t1', [['p1', 'pitch', false, true], ['p2', null, false]])],
        });
        await expect(service.book('user-1', 'a')).rejects.toThrow('held for pitching teams');
        expect(tx.workshopBooking.create).not.toHaveBeenCalled();
      });
    });
  });

  describe('getOverview', () => {
    it("should report the caller's team, its penalty and the seats left to them", async () => {
      mockPrismaService.participant.findUnique.mockResolvedValue({ id: 'p9', paid: true, banned: false, workshopPaymentWaiver: null });
      mockPrismaService.workshop.findMany.mockResolvedValue([
        { ...slot(1), bookings: [] },
        { ...workshop('a', 40, { session: 2 }), bookings: [] },
      ]);
      mockPrismaService.team.findMany.mockResolvedValue([
        team('t1', [['p1', 'pitch'], ['p9', null]]),
        team('t2', [['p3', 'pitch'], ['p4', null]]),
      ]);

      const overview = await service.getOverview('user-9');

      expect(overview.team).toMatchObject({ teamName: 'Team t1', pitchSession: 1, compliant: false, sbPenalty: -5 });
      expect(overview.team).not.toHaveProperty('memberIds');
      // The caller's own team is owed a seat, so they see every free one.
      expect(overview.workshops.find((w) => w.id === 'a')?.seatsLeft).toBe(5);
    });

    it('should hide pitching slots from everyone outside their teams', async () => {
      mockPrismaService.participant.findUnique.mockResolvedValue({ id: 'out', paid: true, banned: false, workshopPaymentWaiver: null });
      mockPrismaService.workshop.findMany.mockResolvedValue([{ ...slot(1), bookings: [] }, { ...workshop('a', 0), bookings: [] }]);
      mockPrismaService.team.findMany.mockResolvedValue([team('t1', [['p1', 'pitch']])]);

      const overview = await service.getOverview('user-0');

      expect(overview.workshops.map((w) => w.id)).toEqual(['a']);
      expect(overview.team).toBeNull();
    });
  });
});
