import {
  Injectable,
  ConflictException,
  ForbiddenException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma, Participant, Team, VisaApplication, VisaStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  RegisterLocalDto,
  RegisterInternationalDto,
  UpdateProfileDto,
  RequestVisaDto,
  CreateTeamDto,
  JoinTeamDto,
  UpdateTeamDto,
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

/** Type for team with members and their user info */
type TeamWithMembers = Team & {
  members: (Participant & {
    user: { name: string; lastName: string; email: string };
  })[];
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
   * @throws ConflictException if participant leads a team that still has other members
   */
  async deleteParticipant(participantId: string): Promise<void> {
    try {
      await this.prisma.$transaction(async (tx) => {
        const participant = await tx.participant.findUnique({
          where: { id: participantId },
          select: {
            id: true,
            userId: true,
            paid: true,
            ownedTeam: { select: { id: true, members: { select: { id: true } } } },
          },
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

        // Edge case: Cannot delete a profile that leads a team with other
        // members — the DB-level ON DELETE CASCADE on Team.leaderId would
        // silently delete the team and drop every teammate out with no
        // warning. Force an explicit disband/kick first instead.
        if (participant.ownedTeam) {
          const teammateCount = participant.ownedTeam.members.filter(
            (m) => m.id !== participant.id,
          ).length;

          if (teammateCount > 0) {
            throw new ConflictException(
              `You lead a team with ${teammateCount} other member(s). ` +
                'Disband the team or remove them before deleting your profile.',
            );
          }
        }

        // Cascade delete handled by Prisma schema relations
        // (safe here: either no team, or a solo team with no other members)
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
  // TEAM METHODS
  // ============================================================================

  /**
   * Create a team (leader path).
   * Generates a unique 6-character join code.
   * The creating participant becomes both leader and first member.
   *
   * @param userId  - JWT sub resolved to internal DB user ID
   * @param dto     - Team name and maximum size
   * @throws NotFoundException   if no participant profile exists for this user
   * @throws ForbiddenException  if the participant is banned or has already paid
   * @throws ConflictException   if the participant already leads or belongs to a team
   */
  async createTeam(userId: string, dto: CreateTeamDto): Promise<TeamWithMembers> {
    try {
      const team = await this.prisma.$transaction(async (tx) => {
        const participant = await tx.participant.findUnique({
          where: { userId },
          select: {
            id: true,
            teamId: true,
            paid: true,
            banned: true,
            ownedTeam: { select: { id: true } },
          },
        });

        if (!participant) {
          throw new NotFoundException(
            'Participant profile not found. Complete Step 1 of registration first.',
          );
        }

        // Edge case: Banned participants cannot form teams
        if (participant.banned) {
          throw new ForbiddenException('Banned participants cannot create a team.');
        }

        // Edge case: Team composition is locked once payment is confirmed,
        // same as profile edits (see updateProfile).
        if (participant.paid) {
          throw new ForbiddenException(
            'Your registration is paid and locked. Contact support to change your team.',
          );
        }

        if (participant.ownedTeam) {
          throw new ConflictException('You already lead a team.');
        }

        if (participant.teamId) {
          throw new ConflictException('You are already a member of a team.');
        }

        const code = await this.generateUniqueCode(tx);

        // Create the team and immediately connect the leader as a member
        const created = await tx.team.create({
          data: {
            code,
            name: dto.name,
            size: dto.size,
            leader: { connect: { id: participant.id } },
            members: { connect: { id: participant.id } },
          },
          include: {
            members: { include: { user: { select: { name: true, lastName: true, email: true } } } },
          },
        });

        return created;
      });

      return team;
    } catch (error) {
      this.handlePrismaError(error);
      throw error;
    }
  }

  /**
   * Update a team (leader path).
   * 
   * @param userId - JWT sub resolved to internal DB user ID
   * @param dto - Optional new name and/or size
   * @throws NotFoundException if the user doesn't lead a team
   * @throws ForbiddenException if the user is banned or paid
   * @throws BadRequestException if the new size is smaller than current member count
   */
  async updateTeam(userId: string, dto: UpdateTeamDto): Promise<TeamWithMembers> {
    try {
      const team = await this.prisma.$transaction(async (tx) => {
        const participant = await tx.participant.findUnique({
          where: { userId },
          select: {
            id: true,
            paid: true,
            banned: true,
            ownedTeam: { 
              select: { id: true, members: { select: { id: true } } } 
            },
          },
        });

        if (!participant) {
          throw new NotFoundException('Participant profile not found.');
        }

        if (participant.banned) {
          throw new ForbiddenException('Banned participants cannot update a team.');
        }

        if (participant.paid) {
          throw new ForbiddenException('Your registration is paid and locked.');
        }

        if (!participant.ownedTeam) {
          throw new NotFoundException('You do not lead a team.');
        }

        const currentMemberCount = participant.ownedTeam.members.length;

        if (dto.size !== undefined && dto.size < currentMemberCount) {
          throw new BadRequestException(
            `Cannot reduce team size below current member count (${currentMemberCount}). Remove members first.`
          );
        }

        return tx.team.update({
          where: { id: participant.ownedTeam.id },
          data: {
            ...(dto.name !== undefined && { name: dto.name }),
            ...(dto.size !== undefined && { size: dto.size }),
          },
          include: {
            members: { include: { user: { select: { name: true, lastName: true, email: true } } } },
          },
        });
      });

      return team;
    } catch (error) {
      this.handlePrismaError(error);
      throw error;
    }
  }

  /**
   * Join an existing team using a 6-character code (member path).
   *
   * @param userId  - JWT sub resolved to internal DB user ID
   * @param dto     - The join code
   * @throws NotFoundException   if no participant profile or team with that code exists
   * @throws ForbiddenException  if the participant is banned, has already paid, or the team is full
   * @throws ConflictException   if the participant is already in a team
   */
  async joinTeam(userId: string, dto: JoinTeamDto): Promise<TeamWithMembers> {
    try {
      const team = await this.prisma.$transaction(async (tx) => {
        const participant = await tx.participant.findUnique({
          where: { userId },
          select: {
            id: true,
            teamId: true,
            paid: true,
            banned: true,
            ownedTeam: { select: { id: true } },
          },
        });

        if (!participant) {
          throw new NotFoundException(
            'Participant profile not found. Complete Step 1 of registration first.',
          );
        }

        // Edge case: Banned participants cannot join teams
        if (participant.banned) {
          throw new ForbiddenException('Banned participants cannot join a team.');
        }

        // Edge case: Team composition is locked once payment is confirmed,
        // same as profile edits (see updateProfile).
        if (participant.paid) {
          throw new ForbiddenException(
            'Your registration is paid and locked. Contact support to change your team.',
          );
        }

        if (participant.ownedTeam || participant.teamId) {
          throw new ConflictException('You are already in a team.');
        }

        const target = await tx.team.findUnique({
          where: { code: dto.code.toUpperCase() },
          include: {
            members: { select: { id: true } },
          },
        });

        if (!target) {
          throw new NotFoundException('No team found with that code. Check the code and try again.');
        }

        // Enforce the hard size cap
        if (target.members.length >= target.size) {
          throw new ForbiddenException(
            `This team is already full (${target.size}/${target.size} members).`,
          );
        }

        // Add the participant to the team
        const updated = await tx.team.update({
          where: { id: target.id },
          data: { members: { connect: { id: participant.id } } },
          include: {
            members: { include: { user: { select: { name: true, lastName: true, email: true } } } },
          },
        });

        return updated;
      });

      return team;
    } catch (error) {
      this.handlePrismaError(error);
      throw error;
    }
  }

  /**
   * Get the team the current user belongs to.
   *
   * @param userId - JWT sub resolved to internal DB user ID
   * @throws NotFoundException if the user has no participant profile or is not in a team
   */
  async getMyTeam(userId: string): Promise<TeamWithMembers> {
    const participant = await this.prisma.participant.findUnique({
      where: { userId },
      select: { id: true, teamId: true, ownedTeam: { select: { id: true } } },
    });

    if (!participant) {
      throw new NotFoundException('Participant profile not found.');
    }

    // A participant's team is either one they joined or one they lead
    const teamId = participant.teamId ?? participant.ownedTeam?.id;

    if (!teamId) {
      throw new NotFoundException('You are not part of any team yet.');
    }

    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: { include: { user: { select: { name: true, lastName: true, email: true } } } },
      },
    });

    if (!team) {
      throw new NotFoundException('Team not found.');
    }

    return team;
  }

  /**
   * Leave a team the participant is a member of (member path only).
   * Team leaders cannot use this — they must disband the team instead,
   * since removing the leader would orphan the remaining members.
   *
   * @param userId - JWT sub resolved to internal DB user ID
   * @throws NotFoundException  if no participant profile exists, or the participant isn't in a team
   * @throws ConflictException  if the participant is the team leader
   */
  async leaveTeam(userId: string): Promise<void> {
    try {
      await this.prisma.$transaction(async (tx) => {
        const participant = await tx.participant.findUnique({
          where: { userId },
          select: { id: true, teamId: true, ownedTeam: { select: { id: true } } },
        });

        if (!participant) {
          throw new NotFoundException('Participant profile not found.');
        }

        if (participant.ownedTeam) {
          throw new ConflictException(
            'Team leaders cannot leave their own team. Disband the team instead.',
          );
        }

        if (!participant.teamId) {
          throw new NotFoundException('You are not part of any team.');
        }

        await tx.participant.update({
          where: { id: participant.id },
          data: { team: { disconnect: true } },
        });
      });
    } catch (error) {
      this.handlePrismaError(error);
      throw error;
    }
  }

  /**
   * Remove a member from a team (leader path only).
   * The leader cannot kick themselves — use disbandTeam for that.
   *
   * @param userId        - JWT sub of the caller, resolved to internal DB user ID
   * @param memberId      - Participant ID of the member to remove
   * @throws NotFoundException   if the caller has no profile, doesn't lead a team,
   *                             or the target isn't a member of that team
   * @throws ConflictException   if the leader tries to kick themselves
   */
  async kickMember(userId: string, memberId: string): Promise<TeamWithMembers> {
    try {
      const team = await this.prisma.$transaction(async (tx) => {
        const participant = await tx.participant.findUnique({
          where: { userId },
          select: { id: true, ownedTeam: { select: { id: true } } },
        });

        if (!participant) {
          throw new NotFoundException('Participant profile not found.');
        }

        if (!participant.ownedTeam) {
          throw new NotFoundException('You do not lead a team.');
        }

        if (memberId === participant.id) {
          throw new ConflictException(
            'Leaders cannot kick themselves. Disband the team instead.',
          );
        }

        const target = await tx.team.findFirst({
          where: { id: participant.ownedTeam.id, members: { some: { id: memberId } } },
          select: { id: true },
        });

        if (!target) {
          throw new NotFoundException('That participant is not a member of your team.');
        }

        return tx.team.update({
          where: { id: participant.ownedTeam.id },
          data: { members: { disconnect: { id: memberId } } },
          include: {
            members: { include: { user: { select: { name: true, lastName: true, email: true } } } },
          },
        });
      });

      return team;
    } catch (error) {
      this.handlePrismaError(error);
      throw error;
    }
  }

  /**
   * Disband a team entirely (leader path only).
   * Deletes the Team row. The `team_id` foreign key on Participant is
   * `ON DELETE SET NULL`, so every member (including the ex-leader) is
   * automatically freed from the team at the database level.
   * The leader's own participant profile is untouched — only the team goes away.
   *
   * @param userId - JWT sub resolved to internal DB user ID
   * @throws NotFoundException  if the caller has no participant profile or does not lead a team
   */
  async disbandTeam(userId: string): Promise<void> {
    try {
      await this.prisma.$transaction(async (tx) => {
        const participant = await tx.participant.findUnique({
          where: { userId },
          select: { id: true, ownedTeam: { select: { id: true } } },
        });

        if (!participant) {
          throw new NotFoundException('Participant profile not found.');
        }

        if (!participant.ownedTeam) {
          throw new NotFoundException('You do not lead a team.');
        }

        await tx.team.delete({ where: { id: participant.ownedTeam.id } });
      });
    } catch (error) {
      this.handlePrismaError(error);
      throw error;
    }
  }

  /**
   * List all teams with optional pagination and search (Admin only).
   * Search matches against team name or join code (case-insensitive).
   *
   * @param options - Filter/pagination options
   * @returns List of teams including members
   */
  async listTeams(options?: {
    search?: string;
    skip?: number;
    take?: number;
  }): Promise<TeamWithMembers[]> {
    const where: Prisma.TeamWhereInput = {};
    if (options?.search) {
      where.OR = [
        { name: { contains: options.search, mode: 'insensitive' } },
        { code: { contains: options.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.team.findMany({
      where,
      skip: options?.skip,
      take: options?.take,
      include: {
        members: { include: { user: { select: { name: true, lastName: true, email: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Count teams matching optional search (Admin only).
   *
   * @param options - Filter options
   * @returns Count of teams
   */
  async countTeams(options?: { search?: string }): Promise<number> {
    const where: Prisma.TeamWhereInput = {};
    if (options?.search) {
      where.OR = [
        { name: { contains: options.search, mode: 'insensitive' } },
        { code: { contains: options.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.team.count({ where });
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  /**
   * Generate a unique 6-character alphanumeric team code.
   * Uses an unambiguous character set (no 0/O, 1/I/L).
   * Retries up to 5 times before giving up (practically impossible to exhaust).
   */
  private async generateUniqueCode(tx: Prisma.TransactionClient): Promise<string> {
    const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = Array.from(
        { length: 6 },
        () => CHARS[Math.floor(Math.random() * CHARS.length)],
      ).join('');

      const existing = await tx.team.findUnique({
        where: { code },
        select: { id: true },
      });

      if (!existing) return code;
    }

    throw new Error('Failed to generate a unique team code. Please try again.');
  }

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
      const target = error.meta?.target;
      const fields = Array.isArray(target) ? target.join(', ') : String(target ?? '');

      const fieldMessages: Record<string, string> = {
        ieee_id: 'This IEEE ID is already registered to another participant',
        phone: 'This phone number is already registered to another participant',
        passport_number: 'This passport number is already registered to another participant',
        email: 'This email is already registered',
        code: 'This team code is already in use',
      };

      const matchedField = Object.keys(fieldMessages).find((f) => fields.includes(f));

      throw new ConflictException(
        matchedField
          ? fieldMessages[matchedField]
          : `A record with this data already exists (${fields || 'unknown field'})`,
      );
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