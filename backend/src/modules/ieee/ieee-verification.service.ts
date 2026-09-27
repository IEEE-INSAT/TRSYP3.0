import { Injectable, Logger, OnApplicationBootstrap, OnModuleDestroy } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import {
  IeeeMatch,
  IeeeRecord,
  SYSTEM_CHECKER,
  checkStatusOf,
  isLookupableMemberNumber,
  membershipFrom,
} from '../registration/domain/ieee-membership';
import {
  ParticipantIeeeDetailsChangedEvent,
  ParticipantRegisteredEvent,
  REGISTRATION_EVENTS,
} from '../registration/events';
import { IeeeApiClient, IeeeApiError, IeeeLookupResult } from './ieee-api.client';

/** How often the background sweep looks for participants to (re-)check. */
const SWEEP_INTERVAL_MS = 5 * 60_000;
/** Checks per sweep. IEEE is slow, and they run one after another. */
const SWEEP_BATCH = 20;
/** Retry delay after a failed check: doubles per failure, up to the cap. */
const RETRY_BASE_MS = 5 * 60_000;
const RETRY_MAX_MS = 6 * 60 * 60_000;

export type VerifyOutcome =
  /** A result was recorded and the participant updated from it. */
  | 'CHECKED'
  /** Nothing could be looked up yet (no usable member number, account not activated). */
  | 'NOT_READY'
  /** The member number or email changed during the call; the result was dropped. */
  | 'SUPERSEDED'
  /** The participant no longer exists. */
  | 'GONE';

/**
 * Verifies participants against IEEE and makes the result the source of
 * truth for their `participantType` and `isRas` (and so their fee).
 *
 * Checks run off the request path: on registration, when the member number
 * changes, from a periodic sweep of unverified or stale participants, and
 * when the participant asks for one. A failed call writes nothing and is
 * retried later.
 */
@Injectable()
export class IeeeVerificationService implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(IeeeVerificationService.name);
  private readonly inFlight = new Map<string, Promise<VerifyOutcome>>();
  /** Participants whose details changed while a check was already running. */
  private readonly rerun = new Set<string>();
  private readonly retry = new Map<string, { failures: number; at: number }>();
  private sweepTimer: NodeJS.Timeout | null = null;
  private sweeping = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly ieee: IeeeApiClient,
  ) {}

  onApplicationBootstrap(): void {
    if (!this.ieee.isConfigured()) {
      this.logger.warn('IEEE API credentials are not set: membership checks are disabled');
      return;
    }
    this.sweepTimer = setInterval(() => void this.sweep(), SWEEP_INTERVAL_MS);
    this.sweepTimer.unref();
  }

  onModuleDestroy(): void {
    if (this.sweepTimer) clearInterval(this.sweepTimer);
  }

  isEnabled(): boolean {
    return this.ieee.isConfigured();
  }

  @OnEvent(REGISTRATION_EVENTS.PARTICIPANT_REGISTERED)
  onParticipantRegistered(event: ParticipantRegisteredEvent): void {
    this.verifyInBackground(event.participantId);
  }

  @OnEvent(REGISTRATION_EVENTS.PARTICIPANT_IEEE_DETAILS_CHANGED)
  onIeeeDetailsChanged(event: ParticipantIeeeDetailsChangedEvent): void {
    this.retry.delete(event.participantId);
    // A check already running read the old details: run again once it ends.
    if (this.inFlight.has(event.participantId)) this.rerun.add(event.participantId);
    else this.verifyInBackground(event.participantId);
  }

  /** Start a check without waiting for it, unless a recent failure is still backing off. */
  verifyInBackground(participantId: string): void {
    if (!this.isEnabled()) return;
    const backoff = this.retry.get(participantId);
    if (backoff && Date.now() < backoff.at) return;
    this.verify(participantId).catch(() => {
      // Already logged and scheduled for a retry.
    });
  }

  /**
   * Check a participant now. Throws `IeeeApiError` when IEEE couldn't be
   * asked; nothing is recorded then.
   */
  verify(participantId: string): Promise<VerifyOutcome> {
    const running = this.inFlight.get(participantId);
    if (running) return running;
    const check = this.runCheck(participantId).finally(() => {
      this.inFlight.delete(participantId);
      if (this.rerun.delete(participantId)) this.verifyInBackground(participantId);
    });
    this.inFlight.set(participantId, check);
    return check;
  }

  private async runCheck(participantId: string): Promise<VerifyOutcome> {
    const participant = await this.prisma.participant.findUnique({
      where: { id: participantId },
      select: { ieeeId: true, user: { select: { email: true, active: true } } },
    });
    if (!participant) return 'GONE';
    const { ieeeId } = participant;
    const { email, active } = participant.user;

    try {
      let lookup: IeeeLookupResult = { found: false };
      let matchedBy: IeeeMatch | null = null;

      // The member number is the precise key; email is the fallback.
      if (isLookupableMemberNumber(ieeeId)) {
        lookup = await this.ieee.getStatus(String(ieeeId));
        if (lookup.found) matchedBy = 'IEEE_ID';
      }
      if (!lookup.found) {
        // An email match only means something once the participant has
        // proved they own the address.
        if (!active) return 'NOT_READY';
        lookup = await this.ieee.getStatus(email);
        if (lookup.found) matchedBy = 'EMAIL';
      }

      const outcome = await this.record(participantId, { ieeeId, email }, lookup, matchedBy);
      this.retry.delete(participantId);
      return outcome;
    } catch (error) {
      if (error instanceof IeeeApiError) this.scheduleRetry(participantId, error);
      else this.logger.error(`IEEE check for participant ${participantId} failed`, error as Error);
      throw error;
    }
  }

  /**
   * Store the result and set the participant's pricing from it, together.
   * The `claimed*` columns hold the participant's values *after* the update,
   * which is what keeps the row fresh in the admin portal's eyes.
   */
  private async record(
    participantId: string,
    lookedUp: { ieeeId: number | null; email: string },
    lookup: IeeeLookupResult,
    matchedBy: IeeeMatch | null,
  ): Promise<VerifyOutcome> {
    const found = lookup.found ? lookup : null;
    const ieee: IeeeRecord & {
      grade: string | null;
      firstInitial: string | null;
      lastInitial: string | null;
    } = {
      memberStatus: found?.memberStatus ?? null,
      grade: found?.grade ?? null,
      societies: found?.societies ?? [],
      firstInitial: found?.firstInitial ?? null,
      lastInitial: found?.lastInitial ?? null,
    };

    return this.prisma.$transaction(async (tx) => {
      const current = await tx.participant.findUnique({
        where: { id: participantId },
        select: { ieeeId: true, careerStage: true, sb: true, user: { select: { email: true } } },
      });
      if (!current) return 'GONE';
      if (current.ieeeId !== lookedUp.ieeeId || current.user.email !== lookedUp.email) {
        // A newer check follows the change; this result describes old details.
        return 'SUPERSEDED';
      }

      const { participantType, isRas } = membershipFrom(ieee, current);
      await tx.participant.update({
        where: { id: participantId },
        data: { participantType, isRas },
      });

      const row = {
        status: checkStatusOf(ieee),
        ...ieee,
        matchedBy,
        issues: [],
        claimedIeeeId: current.ieeeId,
        claimedType: participantType,
        claimedIsRas: isRas,
        claimedEmail: current.user.email,
        checkedAt: new Date(),
        checkedBy: SYSTEM_CHECKER,
      };
      await tx.ieeeVerification.upsert({
        where: { participantId },
        create: { participantId, ...row },
        update: row,
      });
      return 'CHECKED';
    });
  }

  private scheduleRetry(participantId: string, error: IeeeApiError): void {
    const failures = (this.retry.get(participantId)?.failures ?? 0) + 1;
    const delay = Math.min(RETRY_BASE_MS * 2 ** (failures - 1), RETRY_MAX_MS);
    this.retry.set(participantId, { failures, at: Date.now() + delay });
    this.logger.warn(
      `IEEE check for participant ${participantId} failed (${error.message}); retrying in ${Math.round(delay / 60_000)} min`,
    );
  }

  /**
   * Check participants that have no result yet, or whose result no longer
   * matches their details (the admin portal's staleness rule).
   */
  async sweep(): Promise<void> {
    if (this.sweeping || !this.isEnabled()) return;
    this.sweeping = true;
    try {
      const due = await this.prisma.$queryRaw<{ id: string }[]>`
        SELECT p.id
        FROM participants p
        JOIN users u ON u.id = p.user_id
        LEFT JOIN ieee_verifications v ON v.participant_id = p.id
        WHERE u.active
          AND (
            v.id IS NULL
            OR v.claimed_ieee_id IS DISTINCT FROM p.ieee_id
            OR v.claimed_email <> u.email
            OR v.claimed_type <> p.participant_type::text
            OR v.claimed_is_ras <> p.is_ras
          )
        ORDER BY p.created_at
      `;
      let checked = 0;
      for (const { id } of due) {
        if (checked >= SWEEP_BATCH) break;
        const backoff = this.retry.get(id);
        if (backoff && Date.now() < backoff.at) continue;
        checked++;
        await this.verify(id).catch(() => undefined);
      }
    } catch (error) {
      this.logger.error('IEEE verification sweep failed', error as Error);
    } finally {
      this.sweeping = false;
    }
  }
}
