import {
  Injectable,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  PayloadTooLargeException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  Participant,
  PaymentMethod,
  PaymentProof,
  PaymentProofStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { RegistrationService } from '../../registration/service';
import { computeFee } from '../../registration/domain';
import { DomainEvents } from '../../../common/events/event-names';
import {
  ALLOWED_PROOF_MIME,
  MAX_PROOF_BYTES,
  PROOF_EXTENSION,
} from '../domain';
import { ProofStorageService } from './storage.service';

type AllowedMime = (typeof ALLOWED_PROOF_MIME)[number];

/** An uploaded receipt, or nothing at all when the participant paid in cash. */
export type UploadedProof = {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
};

/** A proof row joined to the identity an admin needs to review it. */
export type ProofWithParticipant = PaymentProof & {
  participant: Participant & {
    user: { name: string; lastName: string; email: string };
    _count: { memberships: number };
  };
};

@Injectable()
export class PaymentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly registrationService: RegistrationService,
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
    private readonly storage: ProofStorageService,
  ) {}

  // ==========================================================================
  // PARTICIPANT
  // ==========================================================================

  /**
   * Whether the committee is accepting proofs right now.
   *
   * The only switch: this refuses the submission, and the UI mirrors it by
   * reading `submissionOpen` off `GET /payment/proof/me` rather than holding
   * a build-time flag of its own.
   */
  isSubmissionOpen(): boolean {
    return this.configService.get<string>('PAYMENT_PROOF_OPEN') === 'true';
  }

  /**
   * The fee this participant owes right now, priced like the dashboard does.
   *
   * Takes only the three facts pricing depends on rather than a whole
   * participant, so callers that hold a partial row can still ask.
   */
  feeFor(
    participant: Pick<Participant, 'participantType' | 'isRas'> & {
      _count?: { memberships: number };
    },
  ): number {
    return computeFee({
      isIeee: participant.participantType !== 'NonIEEE',
      isRas: participant.isRas,
      isChallenger: (participant._count?.memberships ?? 0) > 0,
    }).fee;
  }

  /**
   * Submit a proof of payment.
   *
   * A file is required for every method except cash, which is handed to a
   * committee member in person and has no receipt to show - those land as
   * PENDING for an admin to confirm against their own records.
   *
   * Resubmitting after a rejection replaces the previous row's object so the
   * bucket holds at most one file per participant.
   */
  async submitProof(
    userId: string,
    method: PaymentMethod,
    file: UploadedProof | undefined,
  ): Promise<PaymentProof> {
    if (!this.isSubmissionOpen()) {
      throw new ForbiddenException('Payment proof submission is not open yet');
    }

    const participant = await this.registrationService.findByUserId(userId);
    if (!participant) {
      throw new NotFoundException('Profile not found');
    }
    if (participant.banned) {
      throw new ForbiddenException('Banned participants cannot submit a payment');
    }
    if (participant.paid) {
      throw new ConflictException('Your payment is already confirmed');
    }

    const pending = await this.prisma.paymentProof.findFirst({
      where: { participantId: participant.id, status: PaymentProofStatus.PENDING },
    });
    if (pending) {
      throw new ConflictException('A payment proof is already under review');
    }

    const validated = this.validateFile(method, file);

    // Insert first so the object can be keyed by the row's own id, then fill
    // the storage columns in. A failed upload leaves a fileless PENDING row,
    // which would read as a cash payment to a reviewer - so it is rolled back.
    const proof = await this.prisma.paymentProof.create({
      data: {
        participantId: participant.id,
        method,
        amountSnapshot: this.feeFor(participant),
      },
    });

    if (validated) {
      try {
        const storagePath = await this.storage.upload(
          participant.id,
          proof.id,
          validated.extension,
          validated.file.buffer,
          validated.file.mimetype,
        );

        await this.prisma.paymentProof.update({
          where: { id: proof.id },
          data: {
            storagePath,
            fileName: validated.file.originalname,
            mimeType: validated.file.mimetype,
            sizeBytes: validated.file.size,
          },
        });
      } catch (error) {
        await this.prisma.paymentProof.delete({ where: { id: proof.id } });
        throw error;
      }
    }

    // Only one object per participant is kept: everything older than the row
    // just created is superseded the moment this one exists.
    await this.purgeSupersededFiles(participant.id, proof.id);

    this.eventEmitter.emit(DomainEvents.PAYMENT_PROOF_SUBMITTED, {
      participantId: participant.id,
      proofId: proof.id,
      method,
    });

    return this.getProofOrThrow(proof.id);
  }

  /** Latest proof for a participant, or null when they have never submitted. */
  async latestProofForUser(userId: string): Promise<{
    participant: Participant & { _count?: { memberships: number } };
    proof: PaymentProof | null;
  }> {
    const participant = await this.registrationService.findByUserId(userId);
    if (!participant) {
      throw new NotFoundException('Profile not found');
    }

    const proof = await this.prisma.paymentProof.findFirst({
      where: { participantId: participant.id },
      orderBy: { createdAt: 'desc' },
    });

    return { participant, proof };
  }

  // ==========================================================================
  // ADMIN
  // ==========================================================================

  async listProofs(options: {
    status?: PaymentProofStatus;
    skip: number;
    take: number;
  }): Promise<[ProofWithParticipant[], number]> {
    const where: Prisma.PaymentProofWhereInput = options.status
      ? { status: options.status }
      : {};

    return Promise.all([
      this.prisma.paymentProof.findMany({
        where,
        skip: options.skip,
        take: options.take,
        // Oldest first: the review queue is a queue, and whoever has been
        // waiting longest should be looked at first.
        orderBy: { createdAt: 'asc' },
        include: {
          participant: {
            include: {
              user: { select: { name: true, lastName: true, email: true } },
              _count: { select: { memberships: true } },
            },
          },
        },
      }),
      this.prisma.paymentProof.count({ where }),
    ]);
  }

  async getProofOrThrow(id: string): Promise<ProofWithParticipant> {
    const proof = await this.prisma.paymentProof.findUnique({
      where: { id },
      include: {
        participant: {
          include: {
            user: { select: { name: true, lastName: true, email: true } },
            _count: { select: { memberships: true } },
          },
        },
      },
    });

    if (!proof) {
      throw new NotFoundException('Payment proof not found');
    }
    return proof;
  }

  /**
   * Approve a proof and settle the participant.
   *
   * `markAsPaid` stays the one place that flips `Participant.paid`, so the
   * PARTICIPANT_PAID event and its guards (banned, already paid) still apply.
   */
  async approveProof(id: string): Promise<ProofWithParticipant> {
    const proof = await this.getProofOrThrow(id);

    if (proof.status !== PaymentProofStatus.PENDING) {
      throw new ConflictException(`This proof was already ${proof.status.toLowerCase()}`);
    }

    await this.registrationService.markAsPaid(proof.participantId);

    await this.prisma.paymentProof.update({
      where: { id },
      data: { status: PaymentProofStatus.APPROVED, reviewedAt: new Date() },
    });

    this.eventEmitter.emit(DomainEvents.PAYMENT_STATUS_UPDATED, {
      participantId: proof.participantId,
      proofId: id,
      status: PaymentProofStatus.APPROVED,
    });

    return this.getProofOrThrow(id);
  }

  /**
   * Reject a proof. The participant drops back to "not paid" and can submit
   * a replacement; the row is kept so the next one can be compared with it.
   */
  async rejectProof(id: string, reason: string): Promise<ProofWithParticipant> {
    const proof = await this.getProofOrThrow(id);

    if (proof.status !== PaymentProofStatus.PENDING) {
      throw new ConflictException(`This proof was already ${proof.status.toLowerCase()}`);
    }

    await this.prisma.paymentProof.update({
      where: { id },
      data: {
        status: PaymentProofStatus.REJECTED,
        rejectionReason: reason,
        reviewedAt: new Date(),
      },
    });

    this.eventEmitter.emit(DomainEvents.PAYMENT_STATUS_UPDATED, {
      participantId: proof.participantId,
      proofId: id,
      status: PaymentProofStatus.REJECTED,
    });

    return this.getProofOrThrow(id);
  }

  /** Short-lived link to a stored receipt. */
  async fileUrl(proof: PaymentProof): Promise<{ url: string; expiresIn: number }> {
    if (!proof.storagePath) {
      throw new NotFoundException('This payment has no receipt attached');
    }
    return this.storage.signedUrl(proof.storagePath);
  }

  // ==========================================================================
  // INTERNALS
  // ==========================================================================

  /**
   * Enforce the upload rules the frontend also applies, because the frontend
   * is not the one that gets to decide them.
   */
  private validateFile(
    method: PaymentMethod,
    file: UploadedProof | undefined,
  ): { file: UploadedProof; extension: string } | null {
    if (!file) {
      if (method === PaymentMethod.CASH) return null;
      throw new BadRequestException('A receipt is required for this payment method');
    }

    if (file.size > MAX_PROOF_BYTES) {
      throw new PayloadTooLargeException('The receipt must be 3 MB or smaller');
    }

    if (!ALLOWED_PROOF_MIME.includes(file.mimetype as AllowedMime)) {
      throw new UnsupportedMediaTypeException('The receipt must be a JPG, PNG or PDF');
    }

    return { file, extension: PROOF_EXTENSION[file.mimetype as AllowedMime] };
  }

  /**
   * Delete every stored object for this participant except the current one.
   *
   * Keeps the bucket at one file per participant, which is what makes 3 MB a
   * sane cap against a 1 GB plan. The rows stay - only the bytes go.
   */
  private async purgeSupersededFiles(
    participantId: string,
    keepProofId: string,
  ): Promise<void> {
    const superseded = await this.prisma.paymentProof.findMany({
      where: {
        participantId,
        id: { not: keepProofId },
        storagePath: { not: null },
      },
      select: { id: true, storagePath: true },
    });

    for (const old of superseded) {
      if (!old.storagePath) continue;
      await this.storage.remove(old.storagePath);
      await this.prisma.paymentProof.update({
        where: { id: old.id },
        data: { storagePath: null },
      });
    }
  }
}
