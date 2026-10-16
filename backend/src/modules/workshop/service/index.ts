import {
  Injectable,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, TeamActivity, Workshop } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { WorkshopBookingPhase } from '../domain';

type Tx = Prisma.TransactionClient;

/** One workshop as the caller sees it. */
export type WorkshopView = Workshop & {
  booked: number;
  seatsLeft: number;
  bookedByMe: boolean;
};

/**
 * Where a selected technical challenge team stands. At least one member must
 * attend a workshop - in either session - or the team's SB loses points.
 * Reported, not enforced.
 */
export type TeamDuty = {
  teamId: string;
  teamName: string;
  code: string;
  /** Student branches of the team's members. */
  sbs: string[];
  /** Members able to book: not banned, and paid or with a payment waiver. */
  bookableMembers: number;
  /** Members with a workshop seat, in either session. */
  inWorkshop: string[];
  /** Someone is in a workshop. */
  compliant: boolean;
  /** SB points lost if it stays this way: 0, or minus `WORKSHOP_SB_PENALTY`. */
  sbPenalty: number;
};

export type WorkshopOverview = {
  phase: WorkshopBookingPhase;
  /** Not banned, and paid or with a payment waiver. */
  canBook: boolean;
  workshops: WorkshopView[];
  /** The caller's selected technical challenge team, null when not on one. */
  team: TeamDuty | null;
};

export type WorkshopRoster = Workshop & {
  attendees: { participantId: string; name: string; lastName: string; email: string; phone: string; bookedAt: Date }[];
};

export type WorkshopAdminOverview = {
  workshops: WorkshopRoster[];
  /** Every selected technical challenge team, for the SB point deductions. */
  teamDuties: TeamDuty[];
};

const fullName = (u: { name: string; lastName: string }) => `${u.name} ${u.lastName}`.trim();

/**
 * When booking opens, bookings of a popular workshop queue behind its row
 * lock. Prisma's defaults (2s to start, 5s to finish) fail a large share of a
 * rush; these let the queue drain instead.
 */
const BOOKING_TX_OPTIONS = { maxWait: 20_000, timeout: 20_000 };

/**
 * Day-3 workshop booking. Bookings are final: no cancelling, no moving.
 *
 * - One seat per session - a unique index on (participant, session).
 * - Capacity, checked under `SELECT ... FOR UPDATE` on the workshop row, so
 *   concurrent bookings of the same workshop run one after another and the
 *   count each one reads is final. Every booking locks exactly one row, so
 *   they cannot deadlock.
 *
 * Each selected technical challenge team must have at least one member in a
 * workshop, in either session, or its SB loses `WORKSHOP_SB_PENALTY` points.
 * That rule is shown to the team and reported to admins; booking does not
 * enforce it.
 */
@Injectable()
export class WorkshopService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  /** The workshops, the caller's seats and their team's standing. */
  async getOverview(userId: string): Promise<WorkshopOverview> {
    const participant = await this.findParticipant(this.prisma, userId);

    const workshops = await this.prisma.workshop.findMany({
      orderBy: [{ session: 'asc' }, { sortOrder: 'asc' }],
      include: {
        _count: { select: { bookings: true } },
        bookings: { where: { participantId: participant.id }, select: { id: true } },
      },
    });

    const [team] = await this.loadDuties(this.prisma, participant.id);

    return {
      phase: this.getPhase(),
      canBook: this.mayBook(participant),
      workshops: workshops.map(({ _count, bookings, ...w }) => ({
        ...w,
        booked: _count.bookings,
        seatsLeft: Math.max(0, w.capacity - _count.bookings),
        bookedByMe: bookings.length > 0,
      })),
      team: team ?? null,
    };
  }

  /**
   * Book a seat. Final: a participant who has a seat in the session cannot
   * book another one there.
   *
   * @throws NotFoundException  no participant profile, or no such workshop
   * @throws ForbiddenException booking closed, not allowed to book, or full
   * @throws ConflictException  already has a seat in this session
   */
  async book(userId: string, workshopId: string): Promise<void> {
    this.assertOpen();

    try {
      await this.prisma.$transaction(async (tx) => {
        const participant = await this.findParticipant(tx, userId);
        this.assertCanBook(participant);

        // Serialise every booking of this workshop from here to commit.
        const [locked] = await tx.$queryRaw<{ id: string }[]>`
          SELECT id FROM workshops WHERE id = ${workshopId} FOR UPDATE`;
        if (!locked) throw new NotFoundException('Workshop not found.');

        const workshop = await tx.workshop.findUniqueOrThrow({ where: { id: workshopId } });

        const current = await tx.workshopBooking.findUnique({
          where: { participantId_session: { participantId: participant.id, session: workshop.session } },
        });
        if (current) {
          throw new ConflictException(
            current.workshopId === workshop.id
              ? 'You already have a seat in this workshop.'
              : 'You already have a seat in this session. Bookings are final.',
          );
        }

        const booked = await tx.workshopBooking.count({ where: { workshopId: workshop.id } });
        if (booked >= workshop.capacity) {
          throw new ForbiddenException('This workshop is full.');
        }

        await tx.workshopBooking.create({
          data: { participantId: participant.id, workshopId: workshop.id, session: workshop.session },
        });
      }, BOOKING_TX_OPTIONS);
    } catch (error) {
      this.handlePrismaError(error);
      throw error;
    }
  }

  /** Attendance lists, and where every technical challenge team stands. */
  async getAdminOverview(): Promise<WorkshopAdminOverview> {
    const workshops = await this.prisma.workshop.findMany({
      orderBy: [{ session: 'asc' }, { sortOrder: 'asc' }],
      include: {
        bookings: {
          orderBy: { createdAt: 'asc' },
          include: {
            participant: {
              select: { id: true, phone: true, user: { select: { name: true, lastName: true, email: true } } },
            },
          },
        },
      },
    });

    return {
      workshops: workshops.map(({ bookings, ...w }) => ({
        ...w,
        attendees: bookings.map((b) => ({
          participantId: b.participant.id,
          name: b.participant.user.name,
          lastName: b.participant.user.lastName,
          email: b.participant.user.email,
          phone: b.participant.phone,
          bookedAt: b.createdAt,
        })),
      })),
      teamDuties: await this.loadDuties(this.prisma),
    };
  }

  /**
   * Current booking window, from the environment. Unrecognised values mean
   * closed rather than accidentally opening booking.
   */
  getPhase(): WorkshopBookingPhase {
    const raw = this.config.get<string>('WORKSHOP_BOOKING_PHASE')?.trim().toLowerCase();
    return raw === 'open' || raw === 'soon' || raw === 'closed' ? raw : 'closed';
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  private assertOpen(): void {
    const phase = this.getPhase();
    if (phase === 'open') return;
    throw new ForbiddenException(
      phase === 'soon' ? 'Workshop booking has not opened yet.' : 'Workshop booking is closed.',
    );
  }

  private mayBook(p: { paid: boolean; banned: boolean; waived: boolean; tester: boolean }): boolean {
    return !p.banned && (p.paid || p.waived || p.tester);
  }

  private assertCanBook(p: { paid: boolean; banned: boolean; waived: boolean; tester: boolean }): void {
    if (p.banned) throw new ForbiddenException('Banned participants cannot book workshops.');
    if (!this.mayBook(p)) {
      throw new ForbiddenException('Workshop seats are for participants whose payment is confirmed.');
    }
  }

  private async findParticipant(db: Tx, userId: string) {
    const participant = await db.participant.findUnique({
      where: { userId },
      select: {
        id: true,
        paid: true,
        banned: true,
        workshopPaymentWaiver: { select: { participantId: true } },
        user: { select: { email: true } },
      },
    });
    if (!participant) {
      throw new NotFoundException('Participant profile not found. Complete your registration first.');
    }
    const { workshopPaymentWaiver, user, ...rest } = participant;
    return { ...rest, waived: !!workshopPaymentWaiver, tester: this.isTester(user.email) };
  }

  /**
   * Accounts listed in `WORKSHOP_TESTER_EMAILS` (comma-separated) can book
   * without payment - for testing. Their seats are real.
   */
  private isTester(email: string): boolean {
    const list = this.config.get<string>('WORKSHOP_TESTER_EMAILS') ?? '';
    return list
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)
      .includes(email.toLowerCase());
  }

  /** SB points a non-compliant team loses, from `WORKSHOP_SB_PENALTY`. */
  private sbPenalty(): number {
    const raw = Number(this.config.get('WORKSHOP_SB_PENALTY') ?? 5);
    return Number.isFinite(raw) && raw >= 0 ? raw : 5;
  }

  /**
   * Selected technical challenge teams and who of each is in a workshop -
   * only the one `memberId` is on, when given.
   */
  private async loadDuties(db: Tx, memberId?: string): Promise<TeamDuty[]> {
    const teams = await db.team.findMany({
      where: {
        activity: TeamActivity.CHALLENGE,
        selected: true,
        ...(memberId ? { memberships: { some: { participantId: memberId } } } : {}),
      },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        code: true,
        memberships: {
          select: {
            participant: {
              select: {
                paid: true,
                banned: true,
                sb: true,
                workshopPaymentWaiver: { select: { participantId: true } },
                user: { select: { name: true, lastName: true } },
                _count: { select: { workshopBookings: true } },
              },
            },
          },
        },
      },
    });

    const penalty = this.sbPenalty();
    return teams.map((t) => {
      const members = t.memberships.map((m) => m.participant);
      const inWorkshop = members.filter((p) => p._count.workshopBookings > 0).map((p) => fullName(p.user));
      const compliant = inWorkshop.length > 0;
      return {
        teamId: t.id,
        teamName: t.name,
        code: t.code,
        sbs: [...new Set(members.map((p) => p.sb).filter((sb): sb is NonNullable<typeof sb> => !!sb))],
        bookableMembers: members.filter((p) => !p.banned && (p.paid || !!p.workshopPaymentWaiver)).length,
        inWorkshop,
        compliant,
        sbPenalty: compliant ? 0 : -penalty,
      };
    });
  }

  private handlePrismaError(error: unknown): void {
    // The same participant raced two bookings into one session.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictException('You already have a seat in this session. Bookings are final.');
    }
    // Still queued when the wait ran out: nothing was booked.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2028') {
      throw new ServiceUnavailableException('A lot of people are booking right now. Try again in a moment.');
    }
  }
}
