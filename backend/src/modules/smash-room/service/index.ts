import { Injectable, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ParticipantType, Prisma, SB, SmashRoomEntry } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { SubmitSmashRoomInput } from '../dto';

/** Window for submissions, from `SMASH_ROOM_PHASE`. */
export type SmashRoomPhase = 'soon' | 'open' | 'closed';

export type SmashRoomOverview = {
  phase: SmashRoomPhase;
  /** Not banned, and paid or with a payment waiver. */
  canSubmit: boolean;
  /** The caller's submission, null until they send one. */
  entry: SmashRoomEntry | null;
  /** What the profile already says, to start the form from. */
  prefill: SmashRoomPrefill;
};

export type SmashRoomPrefill = {
  firstName: string;
  lastName: string;
  isIeee: boolean;
  sb: SB | null;
  /**
   * For non-members: their international affiliation, else the school they
   * picked from the branch list at registration.
   */
  university: string | null;
};

export type SmashRoomAdminEntry = SmashRoomEntry & { email: string; phone: string };

/**
 * Smash Room: each participant sends one form - name, surname, SB or
 * university, riddle solution and pass type. Final once sent: the unique
 * participant id means a double submit, even a concurrent one, stores one.
 * The riddle answer is kept as typed for the organisers to judge.
 *
 * Who may submit follows workshop booking: paid, or with a workshop payment
 * waiver, or listed in `WORKSHOP_TESTER_EMAILS`.
 */
@Injectable()
export class SmashRoomService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async getOverview(userId: string): Promise<SmashRoomOverview> {
    const participant = await this.findParticipant(userId);
    return {
      phase: this.getPhase(),
      canSubmit: participant.canSubmit,
      entry: participant.entry,
      prefill: participant.prefill,
    };
  }

  /**
   * @throws ForbiddenException closed, banned or not paid
   * @throws ConflictException  already submitted
   */
  async submit(userId: string, input: SubmitSmashRoomInput): Promise<SmashRoomEntry> {
    const phase = this.getPhase();
    if (phase !== 'open') {
      throw new ForbiddenException(phase === 'soon' ? 'The Smash Room form has not opened yet.' : 'The Smash Room form is closed.');
    }

    const participant = await this.findParticipant(userId);
    if (participant.banned) throw new ForbiddenException('Banned participants cannot submit.');
    if (!participant.canSubmit) {
      throw new ForbiddenException('The Smash Room is for participants whose payment is confirmed.');
    }
    if (participant.entry) throw new ConflictException('You have already submitted. Submissions are final.');

    try {
      return await this.prisma.smashRoomEntry.create({ data: { ...input, participantId: participant.id } });
    } catch (error) {
      // A second request raced this one in.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('You have already submitted. Submissions are final.');
      }
      throw error;
    }
  }

  /** Every submission, oldest first. */
  async listAll(): Promise<SmashRoomAdminEntry[]> {
    const entries = await this.prisma.smashRoomEntry.findMany({
      orderBy: { createdAt: 'asc' },
      include: { participant: { select: { phone: true, user: { select: { email: true } } } } },
    });
    return entries.map(({ participant, ...e }) => ({ ...e, email: participant.user.email, phone: participant.phone }));
  }

  /** Unrecognised values mean closed rather than accidentally opening it. */
  getPhase(): SmashRoomPhase {
    const raw = this.config.get<string>('SMASH_ROOM_PHASE')?.trim().toLowerCase();
    return raw === 'open' || raw === 'soon' || raw === 'closed' ? raw : 'closed';
  }

  private async findParticipant(userId: string) {
    const p = await this.prisma.participant.findUnique({
      where: { userId },
      select: {
        id: true,
        paid: true,
        banned: true,
        workshopPaymentWaiver: { select: { participantId: true } },
        participantType: true,
        sb: true,
        user: { select: { email: true, name: true, lastName: true } },
        internationalInfo: { select: { affiliation: true } },
        smashRoomEntry: true,
      },
    });
    if (!p) throw new NotFoundException('Participant profile not found. Complete your registration first.');

    const testers = (this.config.get<string>('WORKSHOP_TESTER_EMAILS') ?? '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    const allowed = p.paid || !!p.workshopPaymentWaiver || testers.includes(p.user.email.toLowerCase());

    const isIeee = p.participantType !== ParticipantType.NonIEEE;
    return {
      id: p.id,
      banned: p.banned,
      canSubmit: !p.banned && allowed,
      entry: p.smashRoomEntry,
      prefill: {
        firstName: p.user.name,
        lastName: p.user.lastName,
        isIeee,
        sb: isIeee ? p.sb : null,
        university: isIeee
          ? null
          : p.internationalInfo?.affiliation?.trim() || (p.sb && p.sb !== SB.Other ? p.sb : null),
      },
    };
  }
}
