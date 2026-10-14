import {
  Injectable,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, TeamActivity, Workshop } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { WorkshopBookingPhase } from '../domain';

type Tx = Prisma.TransactionClient;

/** One workshop as the caller sees it. */
export type WorkshopView = Workshop & {
  booked: number;
  /**
   * Seats the caller could still take. On a workshop that holds seats for
   * challenge teams this excludes the held ones, unless the caller's own team
   * is the one waiting for its seat.
   */
  seatsLeft: number;
  bookedByMe: boolean;
};

export type WorkshopOverview = {
  phase: WorkshopBookingPhase;
  /** Only paid, non-banned participants may book. */
  canBook: boolean;
  workshops: WorkshopView[];
  /**
   * The caller's selected technical challenge team, with the members already
   * booked on the workshop that holds a seat for it. Null when not on one.
   */
  challengeTeam: { id: string; name: string; reservedWorkshopBookers: string[] } | null;
};

export type WorkshopRoster = Workshop & {
  attendees: { participantId: string; name: string; lastName: string; email: string; phone: string; bookedAt: Date }[];
};

export type WorkshopAdminOverview = {
  workshops: WorkshopRoster[];
  /** Selected technical challenge teams nobody has booked the held seat for yet. */
  teamsWithoutReservedSeat: { id: string; name: string; code: string }[];
};

/**
 * Day-3 workshop booking. Two rules:
 *
 * - One workshop per session - a unique index on (participant, session).
 * - Capacity, checked under `SELECT ... FOR UPDATE` on the workshop row, so
 *   concurrent bookings of the same workshop run one after another and the
 *   count each one reads is final. Every booking locks exactly one row, so
 *   they cannot deadlock.
 *
 * On a workshop with `reservesChallengeSeats` (Pitching), each selected
 * technical challenge team with a paid member keeps one seat held until one
 * of its members books. Anyone else may only take a seat that leaves enough
 * for every team still waiting.
 */
@Injectable()
export class WorkshopService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  /** The workshop list, the caller's bookings and their team's held seat. */
  async getOverview(userId: string): Promise<WorkshopOverview> {
    const participant = await this.findParticipant(this.prisma, userId);
    const team = await this.findChallengeTeam(this.prisma, participant.id);

    const workshops = await this.prisma.workshop.findMany({
      orderBy: [{ session: 'asc' }, { sortOrder: 'asc' }],
      include: {
        _count: { select: { bookings: true } },
        bookings: { where: { participantId: participant.id }, select: { id: true } },
      },
    });

    const reserved = workshops.find((w) => w.reservesChallengeSeats);
    const unsecured = reserved ? await this.countUnsecuredTeams(this.prisma, reserved.id) : 0;
    const teamSecured = team && reserved ? await this.isTeamSecured(this.prisma, team.id, reserved.id) : false;

    // A member of a team still waiting may take any free seat - one is theirs.
    const holdsMySeat = !!team && !teamSecured;

    const views = workshops.map(({ _count, bookings, ...w }) => {
      const held = w.reservesChallengeSeats && !holdsMySeat ? unsecured : 0;
      return {
        ...w,
        booked: _count.bookings,
        seatsLeft: Math.max(0, w.capacity - _count.bookings - held),
        bookedByMe: bookings.length > 0,
      };
    });

    return {
      phase: this.getPhase(),
      canBook: participant.paid && !participant.banned,
      workshops: views,
      challengeTeam: team
        ? {
            id: team.id,
            name: team.name,
            reservedWorkshopBookers: reserved ? await this.teamBookers(this.prisma, team.id, reserved.id) : [],
          }
        : null,
    };
  }

  /**
   * Book a seat. Booking a workshop in a session where the caller already
   * holds another seat moves them, in the same transaction.
   *
   * @throws NotFoundException  no participant profile, or no such workshop
   * @throws ForbiddenException booking closed, not paid, banned, or no seat left
   * @throws ConflictException  already booked on this workshop
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
        if (current?.workshopId === workshop.id) {
          throw new ConflictException('You already have a seat in this workshop.');
        }

        const booked = await tx.workshopBooking.count({ where: { workshopId: workshop.id } });
        if (booked >= workshop.capacity) {
          throw new ForbiddenException('This workshop is full.');
        }

        if (workshop.reservesChallengeSeats) {
          const team = await this.findChallengeTeam(tx, participant.id);
          const securesOwnTeam = !!team && !(await this.isTeamSecured(tx, team.id, workshop.id));
          // A member of a team still waiting takes that team's held seat.
          // Anyone else needs a seat beyond all the held ones.
          if (!securesOwnTeam) {
            const unsecured = await this.countUnsecuredTeams(tx, workshop.id);
            if (workshop.capacity - booked - 1 < unsecured) {
              throw new ForbiddenException(
                'The remaining seats are held for technical challenge teams that have not booked yet.',
              );
            }
          }
        }

        // Moving within a session: drop the old seat first (the unique index
        // allows one per session). Its workshop isn't locked - freeing a seat
        // can only make other bookings' checks more conservative.
        if (current) await tx.workshopBooking.delete({ where: { id: current.id } });

        await tx.workshopBooking.create({
          data: { participantId: participant.id, workshopId: workshop.id, session: workshop.session },
        });
      });
    } catch (error) {
      this.handlePrismaError(error);
      throw error;
    }
  }

  /**
   * Give a seat back.
   *
   * @throws ForbiddenException booking closed
   * @throws NotFoundException  no participant profile, or no seat in that workshop
   */
  async cancel(userId: string, workshopId: string): Promise<void> {
    this.assertOpen();
    const participant = await this.findParticipant(this.prisma, userId);

    const { count } = await this.prisma.workshopBooking.deleteMany({
      where: { participantId: participant.id, workshopId },
    });
    if (count === 0) throw new NotFoundException('You do not have a seat in this workshop.');
  }

  /** Attendance lists, plus the challenge teams still missing from Pitching. */
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

    const reserved = workshops.find((w) => w.reservesChallengeSeats);
    const teamsWithoutReservedSeat = reserved
      ? await this.prisma.team.findMany({
          where: this.unsecuredTeamWhere(reserved.id),
          select: { id: true, name: true, code: true },
          orderBy: { name: 'asc' },
        })
      : [];

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
      teamsWithoutReservedSeat,
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

  private assertCanBook(p: { paid: boolean; banned: boolean }): void {
    if (p.banned) throw new ForbiddenException('Banned participants cannot book workshops.');
    if (!p.paid) {
      throw new ForbiddenException('Workshop seats are for participants whose payment is confirmed.');
    }
  }

  private async findParticipant(db: Tx, userId: string) {
    const participant = await db.participant.findUnique({
      where: { userId },
      select: { id: true, paid: true, banned: true },
    });
    if (!participant) {
      throw new NotFoundException('Participant profile not found. Complete your registration first.');
    }
    return participant;
  }

  /** The caller's technical challenge team, if it made the selection. */
  private async findChallengeTeam(db: Tx, participantId: string) {
    const membership = await db.teamMembership.findUnique({
      where: { participantId_activity: { participantId, activity: TeamActivity.CHALLENGE } },
      select: { team: { select: { id: true, name: true, selected: true } } },
    });
    return membership?.team.selected ? membership.team : null;
  }

  /**
   * Teams that are owed a held seat: selected technical challenge teams with
   * at least one member able to book, none of whom has booked yet.
   */
  private unsecuredTeamWhere(workshopId: string): Prisma.TeamWhereInput {
    return {
      activity: TeamActivity.CHALLENGE,
      selected: true,
      memberships: {
        some: { participant: { paid: true, banned: false } },
        none: { participant: { workshopBookings: { some: { workshopId } } } },
      },
    };
  }

  private countUnsecuredTeams(db: Tx, workshopId: string): Promise<number> {
    return db.team.count({ where: this.unsecuredTeamWhere(workshopId) });
  }

  private async isTeamSecured(db: Tx, teamId: string, workshopId: string): Promise<boolean> {
    const found = await db.workshopBooking.findFirst({
      where: { workshopId, participant: { memberships: { some: { teamId } } } },
      select: { id: true },
    });
    return !!found;
  }

  private async teamBookers(db: Tx, teamId: string, workshopId: string): Promise<string[]> {
    const bookings = await db.workshopBooking.findMany({
      where: { workshopId, participant: { memberships: { some: { teamId } } } },
      select: { participant: { select: { user: { select: { name: true, lastName: true } } } } },
      orderBy: { createdAt: 'asc' },
    });
    return bookings.map((b) => `${b.participant.user.name} ${b.participant.user.lastName}`.trim());
  }

  private handlePrismaError(error: unknown): void {
    // The same participant raced two bookings into one session.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictException('You already have a seat in this session. Refresh and try again.');
    }
  }
}
