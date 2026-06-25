import {
  Injectable,
  ConflictException,
  ForbiddenException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma, Participant, VisaApplication, VisaStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  RegisterLocalDto,
  RegisterInternationalDto,
  UpdateProfileDto,
  RequestVisaDto,
} from '../dto';
import {
  ParticipantRegisteredEvent,
  ParticipantDeletedEvent,
  ParticipantBannedEvent,
  ParticipantUnbannedEvent,
  ParticipantPaidEvent,
  VisaRequestedEvent,
  VisaStatusChangedEvent,
  REGISTRATION_EVENTS,
} from '../events';

/** Type for participant with full relations */
type ParticipantWithRelations = Participant & {
  internationalInfo?: {
    id: string;
    visaApplication?: VisaApplication | null;
  } | null;
};

/**
 * Service handling participant registration, profile management, and visa operations
 */
@Injectable()
export class RegistrationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ============================================================================
  // REGISTRATION METHODS
  // ============================================================================

  /**
   * Register a new participant
   * @param userId - The user ID from JWT token
   * @param dto - Registration data (local or international)
   * @returns The created participant
   * @throws ConflictException if participant already exists for this user
   */
  async register(
    userId: string,
    dto: RegisterLocalDto | RegisterInternationalDto,
  ): Promise<Participant> {
    const isInternational = 'internationalInfo' in dto;

    try {
      const participant = await this.prisma.$transaction(async (tx) => {
        // Edge case: Check if participant already exists for this user
        const existingParticipant = await tx.participant.findUnique({
          where: { userId },
          select: { id: true },
        });

        if (existingParticipant) {
          throw new ConflictException(
            'A participant profile already exists for this account',
          );
        }

        // Create participant with optional international info
        // Note: userId is the internal DB ID, resolved by SupabaseJwtStrategy
        const createdParticipant = await tx.participant.create({
          data: {
            userId,
            ieeeId: dto.ieeeId,
            phone: dto.phone,
            gender: dto.gender,
            participantType: dto.participantType,
            sb: dto.sb,
            country: dto.country,
            paid: false,
            banned: false,
            isInternational,
            ...(isInternational && {
              internationalInfo: {
                create: {
                  dateOfBirth: new Date(
                    (dto as RegisterInternationalDto).internationalInfo.dateOfBirth,
                  ),
                  countryOfResidence: (dto as RegisterInternationalDto)
                    .internationalInfo.countryOfResidence,
                  cityOfResidence: (dto as RegisterInternationalDto)
                    .internationalInfo.cityOfResidence,
                  affiliation: (dto as RegisterInternationalDto)
                    .internationalInfo.affiliation,
                  expectedArrivalDate: new Date(
                    (dto as RegisterInternationalDto).internationalInfo.expectedArrivalDate,
                  ),
                  expectedDepartureDate: new Date(
                    (dto as RegisterInternationalDto).internationalInfo.expectedDepartureDate,
                  ),
                  requiresVisaLetter:
                    (dto as RegisterInternationalDto).internationalInfo.requiresVisaLetter ??
                    false,
                },
              },
            }),
          },
          include: { internationalInfo: true },
        });

        return createdParticipant;
      });

      this.eventEmitter.emit(
        REGISTRATION_EVENTS.PARTICIPANT_REGISTERED,
        new ParticipantRegisteredEvent(participant.id, userId, isInternational),
      );

      return participant;
    } catch (error) {
      this.handlePrismaError(error);
      throw error;
    }
  }

  /**
   * Update participant profile
   * @param participantId - The participant ID
   * @param dto - Profile update data
   * @returns The updated participant
   * @throws ForbiddenException if participant has already paid (profile locked)
   * @throws ConflictException if trying to update visa info when visa is not pending
   * @throws BadRequestException if trying to change immutable fields
   */
  async updateProfile(
    participantId: string,
    dto: UpdateProfileDto,
  ): Promise<Participant> {
    try {
      const participant = await this.prisma.$transaction(async (tx) => {
        const current = await tx.participant.findUnique({
          where: { id: participantId },
          include: {
            internationalInfo: {
              include: { visaApplication: { select: { status: true } } },
            },
          },
        });

        if (!current) {
          throw new NotFoundException('Participant not found');
        }

        // Edge case: Profile locked after payment
        if (current.paid) {
          throw new ForbiddenException(
            'Profile is locked after payment. Contact support for changes.',
          );
        }

        // Edge case: Cannot change immutable fields after registration
        if (
          dto.participantType !== undefined ||
          dto.sb !== undefined ||
          dto.country !== undefined
        ) {
          throw new BadRequestException(
            'Cannot change participantType, sb, or country after registration',
          );
        }

        // Edge case: Cannot update international info if not international
        if (dto.internationalInfo && !current.isInternational) {
          throw new BadRequestException(
            'Cannot update international info for local participants',
          );
        }

        // Edge case: Cannot update visa-related info if visa is not pending
        if (
          dto.internationalInfo &&
          current.internationalInfo?.visaApplication &&
          current.internationalInfo.visaApplication.status !== 'Pending'
        ) {
          throw new ConflictException(
            'Cannot update profile while visa application is being processed',
          );
        }

        const updateData: Prisma.ParticipantUpdateInput = {};
        if (dto.ieeeId !== undefined) updateData.ieeeId = dto.ieeeId;
        if (dto.phone !== undefined) updateData.phone = dto.phone;
        if (dto.gender !== undefined) updateData.gender = dto.gender;

        if (dto.internationalInfo && current.internationalInfo) {
          const intlUpdate: Prisma.InternationalInfoUpdateInput = {};
          if (dto.internationalInfo.dateOfBirth !== undefined) {
            intlUpdate.dateOfBirth = new Date(dto.internationalInfo.dateOfBirth);
          }
          if (dto.internationalInfo.countryOfResidence !== undefined) {
            intlUpdate.countryOfResidence = dto.internationalInfo.countryOfResidence;
          }
          if (dto.internationalInfo.cityOfResidence !== undefined) {
            intlUpdate.cityOfResidence = dto.internationalInfo.cityOfResidence;
          }
          if (dto.internationalInfo.affiliation !== undefined) {
            intlUpdate.affiliation = dto.internationalInfo.affiliation;
          }
          if (dto.internationalInfo.expectedArrivalDate !== undefined) {
            intlUpdate.expectedArrivalDate = new Date(
              dto.internationalInfo.expectedArrivalDate,
            );
          }
          if (dto.internationalInfo.expectedDepartureDate !== undefined) {
            intlUpdate.expectedDepartureDate = new Date(
              dto.internationalInfo.expectedDepartureDate,
            );
          }
          if (dto.internationalInfo.requiresVisaLetter !== undefined) {
            intlUpdate.requiresVisaLetter = dto.internationalInfo.requiresVisaLetter;
          }
          if (Object.keys(intlUpdate).length > 0) {
            updateData.internationalInfo = { update: intlUpdate };
          }
        }

        return tx.participant.update({
          where: { id: participantId },
          data: updateData,
          include: { internationalInfo: true },
        });
      });

      return participant;
    } catch (error) {
      this.handlePrismaError(error);
      throw error;
    }
  }

  /**
   * Delete a participant and all related data (cascade)
   * @param participantId - The participant ID
   * @throws NotFoundException if participant not found
   * @throws ForbiddenException if participant has paid (refund required first)
   */
  async deleteParticipant(participantId: string): Promise<void> {
    try {
      await this.prisma.$transaction(async (tx) => {
        const participant = await tx.participant.findUnique({
          where: { id: participantId },
          select: { id: true, userId: true, paid: true },
        });

        if (!participant) {
          throw new NotFoundException('Participant not found');
        }

        // Edge case: Cannot delete paid participant without refund
        if (participant.paid) {
          throw new ForbiddenException(
            'Cannot delete participant with confirmed payment. Process refund first.',
          );
        }

        // Cascade delete handled by Prisma schema relations
        await tx.participant.delete({ where: { id: participantId } });

        this.eventEmitter.emit(
          REGISTRATION_EVENTS.PARTICIPANT_DELETED,
          new ParticipantDeletedEvent(participantId, participant.userId),
        );
      });
    } catch (error) {
      this.handlePrismaError(error);
      throw error;
    }
  }

  // ============================================================================
  // BAN/UNBAN METHODS (Admin operations)
  // ============================================================================

  /**
   * Ban a participant
   * @param participantId - The participant ID
   * @param reason - Reason for the ban
   * @throws NotFoundException if participant not found
   * @throws ConflictException if participant is already banned
   */
  async banParticipant(participantId: string, reason: string): Promise<Participant> {
    try {
      const participant = await this.prisma.$transaction(async (tx) => {
        const current = await tx.participant.findUnique({
          where: { id: participantId },
          select: { id: true, banned: true },
        });

        if (!current) {
          throw new NotFoundException('Participant not found');
        }

        // Edge case: Already banned
        if (current.banned) {
          throw new ConflictException('Participant is already banned');
        }

        return tx.participant.update({
          where: { id: participantId },
          data: { banned: true },
          include: { internationalInfo: true },
        });
      });

      this.eventEmitter.emit(
        REGISTRATION_EVENTS.PARTICIPANT_BANNED,
        new ParticipantBannedEvent(participantId, reason),
      );

      return participant;
    } catch (error) {
      this.handlePrismaError(error);
      throw error;
    }
  }

  /**
   * Unban a participant
   * @param participantId - The participant ID
   * @throws NotFoundException if participant not found
   * @throws ConflictException if participant is not banned
   */
  async unbanParticipant(participantId: string): Promise<Participant> {
    try {
      const participant = await this.prisma.$transaction(async (tx) => {
        const current = await tx.participant.findUnique({
          where: { id: participantId },
          select: { id: true, banned: true },
        });

        if (!current) {
          throw new NotFoundException('Participant not found');
        }

        // Edge case: Not banned
        if (!current.banned) {
          throw new ConflictException('Participant is not banned');
        }

        return tx.participant.update({
          where: { id: participantId },
          data: { banned: false },
          include: { internationalInfo: true },
        });
      });

      this.eventEmitter.emit(
        REGISTRATION_EVENTS.PARTICIPANT_UNBANNED,
        new ParticipantUnbannedEvent(participantId),
      );

      return participant;
    } catch (error) {
      this.handlePrismaError(error);
      throw error;
    }
  }

  // ============================================================================
  // PAYMENT STATUS METHODS (For PaymentModule integration)
  // ============================================================================

  /**
   * Mark participant as paid
   * @param participantId - The participant ID
   * @throws NotFoundException if participant not found
   * @throws ConflictException if already paid
   */
  async markAsPaid(participantId: string): Promise<Participant> {
    try {
      const participant = await this.prisma.$transaction(async (tx) => {
        const current = await tx.participant.findUnique({
          where: { id: participantId },
          select: { id: true, paid: true, banned: true },
        });

        if (!current) {
          throw new NotFoundException('Participant not found');
        }

        // Edge case: Already paid
        if (current.paid) {
          throw new ConflictException('Participant has already paid');
        }

        // Edge case: Banned participants cannot pay
        if (current.banned) {
          throw new ForbiddenException('Banned participants cannot complete payment');
        }

        return tx.participant.update({
          where: { id: participantId },
          data: { paid: true },
          include: { internationalInfo: true },
        });
      });

      this.eventEmitter.emit(
        REGISTRATION_EVENTS.PARTICIPANT_PAID,
        new ParticipantPaidEvent(participantId, true),
      );

      return participant;
    } catch (error) {
      this.handlePrismaError(error);
      throw error;
    }
  }

  /**
   * Mark participant as unpaid (refund scenario)
   * @param participantId - The participant ID
   * @throws NotFoundException if participant not found
   * @throws ConflictException if not paid
   */
  async markAsUnpaid(participantId: string): Promise<Participant> {
    try {
      const participant = await this.prisma.$transaction(async (tx) => {
        const current = await tx.participant.findUnique({
          where: { id: participantId },
          select: { id: true, paid: true },
        });

        if (!current) {
          throw new NotFoundException('Participant not found');
        }

        // Edge case: Not paid
        if (!current.paid) {
          throw new ConflictException('Participant has not paid');
        }

        return tx.participant.update({
          where: { id: participantId },
          data: { paid: false },
          include: { internationalInfo: true },
        });
      });

      this.eventEmitter.emit(
        REGISTRATION_EVENTS.PARTICIPANT_PAID,
        new ParticipantPaidEvent(participantId, false),
      );

      return participant;
    } catch (error) {
      this.handlePrismaError(error);
      throw error;
    }
  }

  // ============================================================================
  // VISA METHODS
  // ============================================================================

  /**
   * Request a visa invitation letter
   * @param participantId - The participant ID
   * @param dto - Visa application data
   * @returns The created visa application
   * @throws BadRequestException if participant is not international
   * @throws ConflictException if visa application already exists
   */
  async requestVisaLetter(
    participantId: string,
    dto: RequestVisaDto,
  ): Promise<VisaApplication> {
    try {
      const visaApplication = await this.prisma.$transaction(async (tx) => {
        const participant = await tx.participant.findUnique({
          where: { id: participantId },
          select: {
            id: true,
            isInternational: true,
            banned: true,
            internationalInfo: {
              select: { id: true, visaApplication: { select: { id: true } } },
            },
          },
        });

        if (!participant) {
          throw new NotFoundException('Participant not found');
        }

        // Edge case: Banned participants cannot request visa
        if (participant.banned) {
          throw new ForbiddenException('Banned participants cannot request visa letters');
        }

        // Edge case: Participant must be international
        if (!participant.isInternational) {
          throw new BadRequestException(
            'Only international participants can request visa letters',
          );
        }

        if (!participant.internationalInfo) {
          throw new BadRequestException(
            'International info not found. Please complete registration first.',
          );
        }

        // Edge case: Visa application already exists
        if (participant.internationalInfo.visaApplication) {
          throw new ConflictException(
            'A visa application already exists for this participant',
          );
        }

        const createdVisaApplication = await tx.visaApplication.create({
          data: {
            internationalInfoId: participant.internationalInfo.id,
            passportNumber: dto.passportNumber,
            passportIssuanceCountry: dto.passportIssuanceCountry,
            issuingOffice: dto.issuingOffice,
            passportIssuanceDate: new Date(dto.passportIssuanceDate),
            passportExpiryDate: new Date(dto.passportExpiryDate),
            embassyAddress: dto.embassyAddress,
            residenceAddress: dto.residenceAddress,
            status: 'Pending',
          },
        });

        await tx.internationalInfo.update({
          where: { id: participant.internationalInfo.id },
          data: { requiresVisaLetter: true },
        });

        return createdVisaApplication;
      });

      this.eventEmitter.emit(
        REGISTRATION_EVENTS.VISA_REQUESTED,
        new VisaRequestedEvent(participantId, visaApplication.id),
      );

      return visaApplication;
    } catch (error) {
      this.handlePrismaError(error);
      throw error;
    }
  }

  /**
   * Update visa application (only when status is Pending)
   * @param visaApplicationId - The visa application ID
   * @param dto - Updated visa data
   * @throws NotFoundException if visa application not found
   * @throws ConflictException if visa is not in Pending status
   */
  async updateVisaApplication(
    visaApplicationId: string,
    dto: Partial<RequestVisaDto>,
  ): Promise<VisaApplication> {
    try {
      const visaApplication = await this.prisma.$transaction(async (tx) => {
        const current = await tx.visaApplication.findUnique({
          where: { id: visaApplicationId },
          select: { id: true, status: true },
        });

        if (!current) {
          throw new NotFoundException('Visa application not found');
        }

        // Edge case: Can only update pending applications
        if (current.status !== 'Pending') {
          throw new ConflictException(
            'Can only update visa applications with Pending status',
          );
        }

        const updateData: Prisma.VisaApplicationUpdateInput = {};
        if (dto.passportNumber !== undefined) updateData.passportNumber = dto.passportNumber;
        if (dto.passportIssuanceCountry !== undefined) {
          updateData.passportIssuanceCountry = dto.passportIssuanceCountry;
        }
        if (dto.issuingOffice !== undefined) updateData.issuingOffice = dto.issuingOffice;
        if (dto.passportIssuanceDate !== undefined) {
          updateData.passportIssuanceDate = new Date(dto.passportIssuanceDate);
        }
        if (dto.passportExpiryDate !== undefined) {
          updateData.passportExpiryDate = new Date(dto.passportExpiryDate);
        }
        if (dto.embassyAddress !== undefined) updateData.embassyAddress = dto.embassyAddress;
        if (dto.residenceAddress !== undefined) updateData.residenceAddress = dto.residenceAddress;

        return tx.visaApplication.update({
          where: { id: visaApplicationId },
          data: updateData,
        });
      });

      return visaApplication;
    } catch (error) {
      this.handlePrismaError(error);
      throw error;
    }
  }

  /**
   * Approve visa application (Admin only)
   * @param visaApplicationId - The visa application ID
   * @throws NotFoundException if visa application not found
   * @throws ConflictException if visa is not in Pending status
   */
  async approveVisaApplication(visaApplicationId: string): Promise<VisaApplication> {
    return this.changeVisaStatus(visaApplicationId, 'Approved', ['Pending']);
  }

  /**
   * Reject visa application (Admin only)
   * @param visaApplicationId - The visa application ID
   * @throws NotFoundException if visa application not found
   * @throws ConflictException if visa is not in Pending status
   */
  async rejectVisaApplication(visaApplicationId: string): Promise<VisaApplication> {
    return this.changeVisaStatus(visaApplicationId, 'Rejected', ['Pending']);
  }

  /**
   * Mark visa letter as sent (Admin only)
   * @param visaApplicationId - The visa application ID
   * @throws NotFoundException if visa application not found
   * @throws ConflictException if visa is not in Approved status
   */
  async markVisaLetterSent(visaApplicationId: string): Promise<VisaApplication> {
    return this.changeVisaStatus(visaApplicationId, 'LetterSent', ['Approved']);
  }

  /**
   * Get visa application by participant ID
   * @param participantId - The participant ID
   * @returns The visa application or null
   */
  async getVisaApplication(participantId: string): Promise<VisaApplication | null> {
    const participant = await this.prisma.participant.findUnique({
      where: { id: participantId },
      select: {
        internationalInfo: {
          select: { visaApplication: true },
        },
      },
    });

    return participant?.internationalInfo?.visaApplication ?? null;
  }

  // ============================================================================
  // QUERY METHODS
  // ============================================================================

  /**
   * Find participant by user ID
   * @param userId - The user ID
   * @returns The participant or null
   */
  async findByUserId(userId: string): Promise<ParticipantWithRelations | null> {
    return this.prisma.participant.findUnique({
      where: { userId },
      include: {
        internationalInfo: {
          include: { visaApplication: true },
        },
      },
    });
  }

  /**
   * Find participant by ID
   * @param id - The participant ID
   * @returns The participant or null
   */
  async findById(id: string): Promise<ParticipantWithRelations | null> {
    return this.prisma.participant.findUnique({
      where: { id },
      include: {
        internationalInfo: {
          include: { visaApplication: true },
        },
      },
    });
  }

  /**
   * Get participant profile (throws if not found)
   * @param participantId - The participant ID
   * @returns The participant
   * @throws NotFoundException if not found
   */
  async getProfile(participantId: string): Promise<ParticipantWithRelations> {
    const participant = await this.findById(participantId);
    if (!participant) {
      throw new NotFoundException('Participant not found');
    }
    return participant;
  }

  /**
   * List all participants with optional filters
   * @param options - Filter options
   * @returns List of participants
   */
  async listParticipants(options?: {
    paid?: boolean;
    banned?: boolean;
    isInternational?: boolean;
    skip?: number;
    take?: number;
  }): Promise<Participant[]> {
    const where: Prisma.ParticipantWhereInput = {};
    if (options?.paid !== undefined) where.paid = options.paid;
    if (options?.banned !== undefined) where.banned = options.banned;
    if (options?.isInternational !== undefined) where.isInternational = options.isInternational;

    return this.prisma.participant.findMany({
      where,
      skip: options?.skip,
      take: options?.take,
      include: { internationalInfo: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Count participants with optional filters
   * @param options - Filter options
   * @returns Count of participants
   */
  async countParticipants(options?: {
    paid?: boolean;
    banned?: boolean;
    isInternational?: boolean;
  }): Promise<number> {
    const where: Prisma.ParticipantWhereInput = {};
    if (options?.paid !== undefined) where.paid = options.paid;
    if (options?.banned !== undefined) where.banned = options.banned;
    if (options?.isInternational !== undefined) where.isInternational = options.isInternational;

    return this.prisma.participant.count({ where });
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  /**
   * Change visa application status with validation
   * @param visaApplicationId - The visa application ID
   * @param newStatus - The new status
   * @param allowedFromStatuses - Statuses that can transition to newStatus
   */
  private async changeVisaStatus(
    visaApplicationId: string,
    newStatus: VisaStatus,
    allowedFromStatuses: VisaStatus[],
  ): Promise<VisaApplication> {
    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const current = await tx.visaApplication.findUnique({
          where: { id: visaApplicationId },
          include: {
            internationalInfo: {
              select: { participantId: true },
            },
          },
        });

        if (!current) {
          throw new NotFoundException('Visa application not found');
        }

        // Edge case: Invalid status transition
        if (!allowedFromStatuses.includes(current.status)) {
          throw new ConflictException(
            `Cannot change status from ${current.status} to ${newStatus}`,
          );
        }

        const updated = await tx.visaApplication.update({
          where: { id: visaApplicationId },
          data: { status: newStatus },
        });

        return { updated, participantId: current.internationalInfo.participantId, oldStatus: current.status };
      });

      this.eventEmitter.emit(
        REGISTRATION_EVENTS.VISA_STATUS_CHANGED,
        new VisaStatusChangedEvent(
          visaApplicationId,
          result.participantId,
          result.oldStatus,
          newStatus,
        ),
      );

      return result.updated;
    } catch (error) {
      this.handlePrismaError(error);
      throw error;
    }
  }

  /**
   * Handle Prisma errors and convert to appropriate NestJS exceptions
   * @param error - The error to handle
   * @throws ConflictException for unique constraint violations (P2002)
   * @throws NotFoundException for record not found errors (P2025)
   */
  private handlePrismaError(error: unknown): void {
    // Edge case: Prisma unique constraint violation
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException('A record with this data already exists');
    }

    // Edge case: Prisma record not found
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    ) {
      throw new NotFoundException('Record not found');
    }

    // Re-throw NestJS exceptions as-is
    if (
      error instanceof ConflictException ||
      error instanceof ForbiddenException ||
      error instanceof BadRequestException ||
      error instanceof NotFoundException
    ) {
      throw error;
    }
  }
}
