import {
  Injectable,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, Workshop } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { WorkshopBookingPhase } from '../domain';

type Tx = Prisma.TransactionClient;

/** One workshop as the caller sees it. */
export type WorkshopView = Workshop & {
  booked: number;
  /** Seats the caller could still take - seats held for teams excluded. */
  seatsLeft: number;
  bookedByMe: boolean;
  /** A challenge pitching slot: only its teams see and book it. */
  teamOnly: boolean;
};

/**
 * Where a pitching team stands. At least one member must attend a workshop -
 * in either session - or the team's SB loses points.
 */
export type TeamDuty = {
  teamId: string;
  teamName: string;
  code: string;
  /** Student branches of the team's members. */
  sbs: string[];
  /** The session the team pitches in. */
  pitchSession: number;
  /** Members able to book: not banned, and paid or with a payment waiver. */
  bookableMembers: number;
  pitching: string[];
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
  /** Pitching slots are left out for everyone outside their teams. */
  workshops: WorkshopView[];
  /** The caller's pitching team, null when not on one. */
  team: TeamDuty | null;
};

export type WorkshopRoster = Workshop & {
  attendees: { participantId: string; name: string; lastName: string; email: string; phone: string; bookedAt: Date }[];
};

export type WorkshopAdminOverview = {
  workshops: WorkshopRoster[];
  /** Every pitching team, for the SB point deductions. */
  teamDuties: TeamDuty[];
};

/** A duty plus what only the service needs. */
type DutyState = TeamDuty & { memberIds: string[]; slotIds: string[] };

const WITH_TEAMS = { teams: { select: { teamId: true } } } satisfies Prisma.WorkshopInclude;

const fullName = (u: { name: string; lastName: string }) => `${u.name} ${u.lastName}`.trim();

/**
 * Bookings in a session take turns, so when booking opens most of them queue
 * for a connection or the session lock. Prisma's defaults (2s to start, 5s to
 * finish) fail a large share of a rush; these let the queue drain instead.
 */
const BOOKING_TX_OPTIONS = { maxWait: 20_000, timeout: 20_000 };

/**
 * Day-3 workshop booking. Bookings are final: no cancelling, no moving.
 *
 * - One seat per session - a unique index on (participant, session).
 * - Capacity. Every booking first locks all the workshop rows of its session,
 *   in id order, so bookings in a session run one after another and every
 *   count they read is final; the fixed order means they cannot deadlock.
 *
 * A pitching slot (a workshop with `teams`) is booked by its teams' members
 * only, and keeps one seat held per team until a member books it, so every
 * team can pitch.
 *
 * Each pitching team must also have a member in a workshop, in either
 * session, or its SB loses `WORKSHOP_SB_PENALTY` points. Until one books, a
 * team with a member able to book keeps a seat held across the workshops of
 * the session it does not pitch in, where every member is free - so the rule
 * can always be met without giving up the pitch. The seat is held for teams pitching in another session only, so with
 * more than two sessions it would be held in each of the others.
 */
@Injectable()
export class WorkshopService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  /** The workshops the caller can see, their seats and their team's standing. */
  async getOverview(userId: string): Promise<WorkshopOverview> {
    const participant = await this.findParticipant(this.prisma, userId);

    const workshops = await this.prisma.workshop.findMany({
      orderBy: [{ session: 'asc' }, { sortOrder: 'asc' }],
      include: {
        ...WITH_TEAMS,
        _count: { select: { bookings: true } },
        bookings: { where: { participantId: participant.id }, select: { id: true } },
      },
    });

    const duties = await this.loadDuties(this.prisma);
    const myDuty = duties.find((d) => d.memberIds.includes(participant.id));

    const views: WorkshopView[] = [];
    for (const { _count, bookings, teams, ...w } of workshops) {
      const free = w.capacity - _count.bookings;
      const teamOnly = teams.length > 0;
      let seatsLeft = free;

      if (teamOnly) {
        if (!myDuty || !teams.some((t) => t.teamId === myDuty.teamId)) continue; // not for this caller
        if (myDuty.pitching.length > 0) seatsLeft = free - this.teamsWaitingForSlot(duties, w.id).length;
      } else {
        const held = this.teamsHeldIn(duties, w.session);
        if (held.length > 0 && !(myDuty && held.includes(myDuty))) {
          const regular = workshops.filter((x) => x.session === w.session && x.teams.length === 0);
          const sessionFree = regular.reduce((sum, x) => sum + x.capacity - x._count.bookings, 0);
          seatsLeft = Math.min(free, sessionFree - held.length);
        }
      }

      views.push({ ...w, booked: _count.bookings, seatsLeft: Math.max(0, seatsLeft), bookedByMe: bookings.length > 0, teamOnly });
    }

    return {
      phase: this.getPhase(),
      canBook: this.mayBook(participant),
      workshops: views,
      team: myDuty ? this.publicDuty(myDuty) : null,
    };
  }

  /**
   * Book a seat. Final: a participant who has a seat in the session cannot
   * book another one there.
   *
   * @throws NotFoundException  no participant profile, or no such workshop
   * @throws ForbiddenException booking closed, not allowed to book, not on one
   *                            of a pitching slot's teams, or no seat left
   * @throws ConflictException  already has a seat in this session
   */
  async book(userId: string, workshopId: string): Promise<void> {
    this.assertOpen();

    try {
      await this.prisma.$transaction(async (tx) => {
        const participant = await this.findParticipant(tx, userId);
        this.assertCanBook(participant);

        // Serialise every booking of this session from here to commit.
        const locked = await tx.$queryRaw<{ id: string }[]>`
          SELECT id FROM workshops
          WHERE session = (SELECT session FROM workshops WHERE id = ${workshopId})
          ORDER BY id
          FOR UPDATE`;
        if (!locked.some((r) => r.id === workshopId)) throw new NotFoundException('Workshop not found.');

        const sessionWorkshops = await tx.workshop.findMany({
          where: { id: { in: locked.map((r) => r.id) } },
          include: { ...WITH_TEAMS, _count: { select: { bookings: true } } },
        });
        const workshop = sessionWorkshops.find((w) => w.id === workshopId)!;

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

        const duties = await this.loadDuties(tx);
        const myDuty = duties.find((d) => d.memberIds.includes(participant.id));

        if (workshop.teams.length > 0 && !(myDuty && workshop.teams.some((t) => t.teamId === myDuty.teamId))) {
          throw new ForbiddenException('This session is only for the teams pitching in it.');
        }

        const booked = workshop._count.bookings;
        if (booked >= workshop.capacity) {
          throw new ForbiddenException('This workshop is full.');
        }

        if (workshop.teams.length > 0) {
          // A team with nobody pitching yet takes its held seat; anyone else
          // needs a seat beyond the ones held for the other teams.
          if (myDuty!.pitching.length > 0) {
            const waiting = this.teamsWaitingForSlot(duties, workshop.id).length;
            if (workshop.capacity - booked - 1 < waiting) {
              throw new ForbiddenException('The remaining seats are held for the other teams pitching in this session.');
            }
          }
        } else {
          // Same for the seats held across this session's workshops for teams
          // pitching in another session with nobody in a workshop yet.
          const held = this.teamsHeldIn(duties, workshop.session);
          if (held.length > 0 && !(myDuty && held.includes(myDuty))) {
            const regular = sessionWorkshops.filter((w) => w.teams.length === 0);
            const sessionFree = regular.reduce((sum, w) => sum + w.capacity - w._count.bookings, 0);
            if (sessionFree - 1 < held.length) {
              throw new ForbiddenException(
                'The remaining seats in this session are held for pitching teams that have nobody in a workshop yet.',
              );
            }
          }
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

  /** Attendance lists, and where every pitching team stands. */
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
      teamDuties: (await this.loadDuties(this.prisma)).map((d) => this.publicDuty(d)),
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

  private mayBook(p: { paid: boolean; banned: boolean; waived: boolean }): boolean {
    return !p.banned && (p.paid || p.waived);
  }

  private assertCanBook(p: { paid: boolean; banned: boolean; waived: boolean }): void {
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
      },
    });
    if (!participant) {
      throw new NotFoundException('Participant profile not found. Complete your registration first.');
    }
    const { workshopPaymentWaiver, ...rest } = participant;
    return { ...rest, waived: !!workshopPaymentWaiver };
  }

  /** SB points a non-compliant team loses, from `WORKSHOP_SB_PENALTY`. */
  private sbPenalty(): number {
    const raw = Number(this.config.get('WORKSHOP_SB_PENALTY') ?? 5);
    return Number.isFinite(raw) && raw >= 0 ? raw : 5;
  }

  /** Every pitching team, and who of each is pitching or in a workshop. */
  private async loadDuties(db: Tx): Promise<DutyState[]> {
    const teams = await db.team.findMany({
      where: { workshopAccess: { some: {} } },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        code: true,
        workshopAccess: { select: { workshopId: true, workshop: { select: { session: true } } } },
        memberships: {
          select: {
            participant: {
              select: {
                id: true,
                paid: true,
                banned: true,
                sb: true,
                workshopPaymentWaiver: { select: { participantId: true } },
                user: { select: { name: true, lastName: true } },
                workshopBookings: { select: { workshop: { select: { _count: { select: { teams: true } } } } } },
              },
            },
          },
        },
      },
    });

    const penalty = this.sbPenalty();
    return teams.map((t) => {
      const members = t.memberships.map((m) => m.participant);
      const bookableMembers = members.filter((p) => !p.banned && (p.paid || !!p.workshopPaymentWaiver)).length;
      const has = (p: (typeof members)[number], pitch: boolean) =>
        p.workshopBookings.some((b) => (b.workshop._count.teams > 0) === pitch);
      const inWorkshop = members.filter((p) => has(p, false)).map((p) => fullName(p.user));
      const compliant = inWorkshop.length > 0;

      return {
        teamId: t.id,
        teamName: t.name,
        code: t.code,
        sbs: [...new Set(members.map((p) => p.sb).filter((sb): sb is NonNullable<typeof sb> => !!sb))],
        pitchSession: Math.min(...t.workshopAccess.map((a) => a.workshop.session)),
        bookableMembers,
        pitching: members.filter((p) => has(p, true)).map((p) => fullName(p.user)),
        inWorkshop,
        compliant,
        sbPenalty: compliant ? 0 : -penalty,
        memberIds: members.map((p) => p.id),
        slotIds: t.workshopAccess.map((a) => a.workshopId),
      };
    });
  }

  /** Teams of a pitching slot with someone able to pitch but nobody booked yet. */
  private teamsWaitingForSlot(duties: DutyState[], slotId: string): DutyState[] {
    return duties.filter((d) => d.slotIds.includes(slotId) && d.bookableMembers > 0 && d.pitching.length === 0);
  }

  /**
   * Teams owed a seat among a session's workshops: pitching elsewhere, with a
   * member able to book, nobody in a workshop yet.
   */
  private teamsHeldIn(duties: DutyState[], session: number): DutyState[] {
    return duties.filter((d) => !d.compliant && d.bookableMembers > 0 && d.pitchSession !== session);
  }

  private publicDuty({ memberIds: _m, slotIds: _s, ...duty }: DutyState): TeamDuty {
    return duty;
  }

  private handlePrismaError(error: unknown): void {
    // The same participant raced two bookings into one session.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictException('You already have a seat in this session. Refresh and try again.');
    }
    // Still queued when the wait ran out: nothing was booked.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2028') {
      throw new ServiceUnavailableException('A lot of people are booking right now. Try again in a moment.');
    }
  }
}
