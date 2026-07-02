import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, ForbiddenException, BadRequestException, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RegistrationService } from './service';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterLocalDto } from './dto/register-local.dto';
import { RegisterInternationalDto } from './dto/register-international.dto';
import { RequestVisaDto } from './dto/request-visa.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ParticipantType, SB, COUNTRY, VisaStatus } from '@prisma/client';

describe('RegistrationService', () => {
  let service: RegistrationService;
  let mockPrismaService: any;
  let mockEventEmitter: any;

  const mockParticipant = {
    id: 'participant-1',
    accountId: 'account-1',
    ieeeId: null,
    phone: '+21612345678',
    gender: 'male',
    paid: false,
    isInternational: false,
    banned: false,
    participantType: ParticipantType.Student,
    sb: SB.INSAT,
    country: COUNTRY.Tunisia,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockInternationalParticipant = {
    ...mockParticipant,
    id: 'participant-2',
    accountId: 'account-2',
    isInternational: true,
    internationalInfo: {
      id: 'intl-1',
      participantId: 'participant-2',
      dateOfBirth: new Date('1995-06-15'),
      countryOfResidence: 'Algeria',
      cityOfResidence: 'Algiers',
      affiliation: 'University of Algiers',
      expectedArrivalDate: new Date('2026-07-15'),
      expectedDepartureDate: new Date('2026-07-20'),
      requiresVisaLetter: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };

  const mockVisaApplication = {
    id: 'visa-1',
    internationalInfoId: 'intl-1',
    passportNumber: 'AB1234567',
    passportIssuanceCountry: 'Algeria',
    issuingOffice: 'Algiers Central',
    passportIssuanceDate: new Date('2020-01-15'),
    passportExpiryDate: new Date('2030-01-15'),
    embassyAddress: '18 Avenue de la République, Tunis 1000, Tunisia',
    residenceAddress: '123 Rue Didouche Mourad, Algiers 16000, Algeria',
    status: VisaStatus.Pending,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    mockPrismaService = {
      participant: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      internationalInfo: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      visaApplication: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn((cb) => cb(mockPrismaService)),
    };

    mockEventEmitter = {
      emit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegistrationService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
      ],
    }).compile();

    service = module.get<RegistrationService>(RegistrationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a local participant successfully', async () => {
      const dto: RegisterLocalDto = {
        phone: '+21612345678',
        gender: 'male',
        participantType: ParticipantType.Student,
        sb: SB.INSAT,
        country: COUNTRY.Tunisia,
      };

      mockPrismaService.participant.findUnique.mockResolvedValue(null);
      mockPrismaService.participant.create.mockResolvedValue(mockParticipant);

      const result = await service.register('account-1', dto);

      expect(result).toEqual(mockParticipant);
      expect(mockPrismaService.participant.create).toHaveBeenCalled();
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('participant.registered', expect.any(Object));
    });

    it('should register an international participant with InternationalInfo', async () => {
      const dto: RegisterInternationalDto = {
        phone: '+21612345678',
        gender: 'male',
        participantType: ParticipantType.Student,
        sb: SB.INSAT,
        country: COUNTRY.Tunisia,
        internationalInfo: {
          dateOfBirth: '1995-06-15',
          countryOfResidence: 'Algeria',
          cityOfResidence: 'Algiers',
          affiliation: 'University of Algiers',
          expectedArrivalDate: '2026-07-15',
          expectedDepartureDate: '2026-07-20',
          requiresVisaLetter: true,
        },
      };

      mockPrismaService.participant.findUnique.mockResolvedValue(null);
      mockPrismaService.participant.create.mockResolvedValue(mockInternationalParticipant);

      const result = await service.register('account-2', dto);

      expect(result).toEqual(mockInternationalParticipant);
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('participant.registered', expect.any(Object));
    });

    it('should throw ConflictException if participant already exists', async () => {
      const dto: RegisterLocalDto = {
        phone: '+21612345678',
        gender: 'male',
        participantType: ParticipantType.Student,
        sb: SB.INSAT,
        country: COUNTRY.Tunisia,
      };

      mockPrismaService.participant.findUnique.mockResolvedValue(mockParticipant);

      await expect(service.register('account-1', dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('updateProfile', () => {
    it('should throw ForbiddenException if participant is already paid', async () => {
      const paidParticipant = { ...mockParticipant, paid: true };
      const dto: UpdateProfileDto = { phone: '+21612345678' };

      mockPrismaService.participant.findUnique.mockResolvedValue(paidParticipant);

      await expect(service.updateProfile('participant-1', dto)).rejects.toThrow(ForbiddenException);
    });

    it('should throw ConflictException if visa is not in Pending status', async () => {
      const approvedVisa = { ...mockVisaApplication, status: VisaStatus.Approved };
      const intlParticipant = {
        ...mockInternationalParticipant,
        internationalInfo: {
          ...mockInternationalParticipant.internationalInfo,
          visaApplication: approvedVisa,
        },
      };
      const dto: UpdateProfileDto = {
        internationalInfo: {
          countryOfResidence: 'France',
        },
      };

      mockPrismaService.participant.findUnique.mockResolvedValue(intlParticipant);

      await expect(service.updateProfile('participant-2', dto)).rejects.toThrow(ConflictException);
    });

    it('should update profile successfully for unpaid participant', async () => {
      const updated = { ...mockParticipant, phone: '+21687654321' };
      const dto: UpdateProfileDto = { phone: '+21687654321' };

      mockPrismaService.participant.findUnique.mockResolvedValue(mockParticipant);
      mockPrismaService.participant.update.mockResolvedValue(updated);

      const result = await service.updateProfile('participant-1', dto);

      expect(result).toEqual(updated);
      expect(mockPrismaService.participant.update).toHaveBeenCalled();
    });
  });

  describe('requestVisaLetter', () => {
    it('should throw BadRequestException if participant is not international', async () => {
      const dto: RequestVisaDto = {
        passportNumber: 'AB1234567',
        passportIssuanceCountry: 'Algeria',
        issuingOffice: 'Algiers',
        passportIssuanceDate: '2020-01-15',
        passportExpiryDate: '2030-01-15',
        embassyAddress: '18 Avenue de la République, Tunis 1000, Tunisia',
        residenceAddress: '123 Rue Didouche Mourad, Algiers 16000, Algeria',
      };

      mockPrismaService.participant.findUnique.mockResolvedValue(mockParticipant);

      await expect(service.requestVisaLetter('participant-1', dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw ConflictException if VisaApplication already exists', async () => {
      const intlWithVisa = {
        ...mockInternationalParticipant,
        internationalInfo: {
          ...mockInternationalParticipant.internationalInfo,
          visaApplication: mockVisaApplication,
        },
      };
      const dto: RequestVisaDto = {
        passportNumber: 'AB1234567',
        passportIssuanceCountry: 'Algeria',
        issuingOffice: 'Algiers',
        passportIssuanceDate: '2020-01-15',
        passportExpiryDate: '2030-01-15',
        embassyAddress: '18 Avenue de la République, Tunis 1000, Tunisia',
        residenceAddress: '123 Rue Didouche Mourad, Algiers 16000, Algeria',
      };

      mockPrismaService.participant.findUnique.mockResolvedValue(intlWithVisa);

      await expect(service.requestVisaLetter('participant-2', dto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should create VisaApplication for international participant', async () => {
      const dto: RequestVisaDto = {
        passportNumber: 'AB1234567',
        passportIssuanceCountry: 'Algeria',
        issuingOffice: 'Algiers',
        passportIssuanceDate: '2020-01-15',
        passportExpiryDate: '2030-01-15',
        embassyAddress: '18 Avenue de la République, Tunis 1000, Tunisia',
        residenceAddress: '123 Rue Didouche Mourad, Algiers 16000, Algeria',
      };

      mockPrismaService.participant.findUnique.mockResolvedValue(mockInternationalParticipant);
      mockPrismaService.visaApplication.create.mockResolvedValue(mockVisaApplication);

      const result = await service.requestVisaLetter('participant-2', dto);

      expect(result).toEqual(mockVisaApplication);
      expect(mockPrismaService.visaApplication.create).toHaveBeenCalled();
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('visa.requested', expect.any(Object));
    });
  });

  describe('Error handling', () => {
    it('should rethrow non-Prisma errors', async () => {
      const unknownError = new Error('Unknown database error');
      mockPrismaService.participant.findUnique.mockResolvedValue(null);
      mockPrismaService.$transaction.mockImplementation(async (cb: any) => {
        throw unknownError;
      });

      await expect(service.deleteParticipant('participant-1')).rejects.toThrow(unknownError);
    });
  });

  describe('Query methods', () => {
    it('should find participant by userId', async () => {
      mockPrismaService.participant.findUnique.mockResolvedValue(mockParticipant);

      const result = await service.findByUserId('account-1');

      expect(result).toEqual(mockParticipant);
      expect(mockPrismaService.participant.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'account-1' },
        }),
      );
    });

    it('should find participant by id', async () => {
      mockPrismaService.participant.findUnique.mockResolvedValue(mockParticipant);

      const result = await service.findById('participant-1');

      expect(result).toEqual(mockParticipant);
      expect(mockPrismaService.participant.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'participant-1' },
        }),
      );
    });

    it('should list participants with pagination', async () => {
      const participants = [mockParticipant];
      mockPrismaService.participant.findMany.mockResolvedValue(participants);

      const result = await service.listParticipants({ skip: 0, take: 10 });

      expect(result).toEqual(participants);
      expect(mockPrismaService.participant.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 10,
        include: { internationalInfo: true },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should count participants', async () => {
      mockPrismaService.participant.count.mockResolvedValue(42);

      const result = await service.countParticipants();

      expect(result).toBe(42);
      expect(mockPrismaService.participant.count).toHaveBeenCalled();
    });
  });

  describe('Admin methods', () => {
    it('should ban a participant', async () => {
      const bannedParticipant = { ...mockParticipant, banned: true };
      mockPrismaService.$transaction.mockImplementation(async (cb: any) => {
        const mockTx = {
          participant: {
            findUnique: jest.fn().mockResolvedValue(mockParticipant),
            update: jest.fn().mockResolvedValue(bannedParticipant),
          },
        };
        return cb(mockTx);
      });

      const result = await service.banParticipant('participant-1', 'Violation');

      expect(result.banned).toBe(true);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('participant.banned', expect.any(Object));
    });

    it('should unban a participant', async () => {
      const bannedParticipant = { ...mockParticipant, banned: true };
      const unbannedParticipant = { ...bannedParticipant, banned: false };
      mockPrismaService.$transaction.mockImplementation(async (cb: any) => {
        const mockTx = {
          participant: {
            findUnique: jest.fn().mockResolvedValue(bannedParticipant),
            update: jest.fn().mockResolvedValue(unbannedParticipant),
          },
        };
        return cb(mockTx);
      });

      const result = await service.unbanParticipant('participant-1');

      expect(result.banned).toBe(false);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('participant.unbanned', expect.any(Object));
    });

    it('should approve visa application', async () => {
      // Mock: visa found, internationalInfo relationship
      mockPrismaService.$transaction.mockImplementation(async (cb: any) => {
        const mockTx = {
          visaApplication: {
            findUnique: jest
              .fn()
              .mockResolvedValue({
                ...mockVisaApplication,
                internationalInfo: { participantId: 'participant-2' },
              }),
            update: jest.fn().mockResolvedValue({
              ...mockVisaApplication,
              status: VisaStatus.Approved,
            }),
          },
        };
        return cb(mockTx);
      });

      const result = await service.approveVisaApplication('visa-1');

      expect(result.status).toBe(VisaStatus.Approved);
      expect(mockEventEmitter.emit).toHaveBeenCalled();
    });

    it('should reject visa application', async () => {
      // Mock: visa found, internationalInfo relationship
      mockPrismaService.$transaction.mockImplementation(async (cb: any) => {
        const mockTx = {
          visaApplication: {
            findUnique: jest
              .fn()
              .mockResolvedValue({
                ...mockVisaApplication,
                internationalInfo: { participantId: 'participant-2' },
              }),
            update: jest.fn().mockResolvedValue({
              ...mockVisaApplication,
              status: VisaStatus.Rejected,
            }),
          },
        };
        return cb(mockTx);
      });

      const result = await service.rejectVisaApplication('visa-1');

      expect(result.status).toBe(VisaStatus.Rejected);
      expect(mockEventEmitter.emit).toHaveBeenCalled();
    });
  });

  describe('createTeam', () => {
    const createDto = { name: 'RoboTeam Alpha', size: 4 };

    it('should let an eligible participant create a team', async () => {
      const createdTeam = {
        id: 'team-1',
        code: 'A3KX9Z',
        name: 'RoboTeam Alpha',
        size: 4,
        leaderId: 'participant-1',
        members: [
          { id: 'participant-1', user: { name: 'A', lastName: 'B', email: 'a@b.com' } },
        ],
      };
      mockPrismaService.$transaction.mockImplementation(async (cb: any) => {
        const mockTx = {
          participant: {
            findUnique: jest.fn().mockResolvedValue({
              id: 'participant-1',
              teamId: null,
              paid: false,
              banned: false,
              ownedTeam: null,
            }),
          },
          team: {
            findUnique: jest.fn().mockResolvedValue(null), // code uniqueness check
            create: jest.fn().mockResolvedValue(createdTeam),
          },
        };
        return cb(mockTx);
      });

      const result = await service.createTeam('user-1', createDto as any);

      expect(result.id).toBe('team-1');
      expect(result.members).toHaveLength(1);
    });

    it('should throw NotFoundException if the caller has no profile', async () => {
      mockPrismaService.$transaction.mockImplementation(async (cb: any) => {
        const mockTx = { participant: { findUnique: jest.fn().mockResolvedValue(null) } };
        return cb(mockTx);
      });

      await expect(service.createTeam('user-1', createDto as any)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if the participant is banned', async () => {
      mockPrismaService.$transaction.mockImplementation(async (cb: any) => {
        const mockTx = {
          participant: {
            findUnique: jest.fn().mockResolvedValue({
              id: 'participant-1',
              teamId: null,
              paid: false,
              banned: true,
              ownedTeam: null,
            }),
          },
        };
        return cb(mockTx);
      });

      await expect(service.createTeam('user-1', createDto as any)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ForbiddenException if the participant has already paid', async () => {
      mockPrismaService.$transaction.mockImplementation(async (cb: any) => {
        const mockTx = {
          participant: {
            findUnique: jest.fn().mockResolvedValue({
              id: 'participant-1',
              teamId: null,
              paid: true,
              banned: false,
              ownedTeam: null,
            }),
          },
        };
        return cb(mockTx);
      });

      await expect(service.createTeam('user-1', createDto as any)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ConflictException if the participant already leads a team', async () => {
      mockPrismaService.$transaction.mockImplementation(async (cb: any) => {
        const mockTx = {
          participant: {
            findUnique: jest.fn().mockResolvedValue({
              id: 'participant-1',
              teamId: null,
              paid: false,
              banned: false,
              ownedTeam: { id: 'team-1' },
            }),
          },
        };
        return cb(mockTx);
      });

      await expect(service.createTeam('user-1', createDto as any)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw ConflictException if the participant already belongs to a team', async () => {
      mockPrismaService.$transaction.mockImplementation(async (cb: any) => {
        const mockTx = {
          participant: {
            findUnique: jest.fn().mockResolvedValue({
              id: 'participant-1',
              teamId: 'team-2',
              paid: false,
              banned: false,
              ownedTeam: null,
            }),
          },
        };
        return cb(mockTx);
      });

      await expect(service.createTeam('user-1', createDto as any)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('joinTeam', () => {
    const joinDto = { code: 'A3KX9Z' };

    it('should let an eligible participant join a team with spots left', async () => {
      const updatedTeam = {
        id: 'team-1',
        code: 'A3KX9Z',
        size: 4,
        members: [
          { id: 'leader-participant', user: { name: 'A', lastName: 'B', email: 'a@b.com' } },
          { id: 'participant-1', user: { name: 'C', lastName: 'D', email: 'c@d.com' } },
        ],
      };
      mockPrismaService.$transaction.mockImplementation(async (cb: any) => {
        const mockTx = {
          participant: {
            findUnique: jest.fn().mockResolvedValue({
              id: 'participant-1',
              teamId: null,
              paid: false,
              banned: false,
              ownedTeam: null,
            }),
          },
          team: {
            findUnique: jest.fn().mockResolvedValue({
              id: 'team-1',
              size: 4,
              members: [{ id: 'leader-participant' }],
            }),
            update: jest.fn().mockResolvedValue(updatedTeam),
          },
        };
        return cb(mockTx);
      });

      const result = await service.joinTeam('user-1', joinDto as any);

      expect(result.members).toHaveLength(2);
    });

    it('should throw NotFoundException if the caller has no profile', async () => {
      mockPrismaService.$transaction.mockImplementation(async (cb: any) => {
        const mockTx = { participant: { findUnique: jest.fn().mockResolvedValue(null) } };
        return cb(mockTx);
      });

      await expect(service.joinTeam('user-1', joinDto as any)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if the participant is banned', async () => {
      mockPrismaService.$transaction.mockImplementation(async (cb: any) => {
        const mockTx = {
          participant: {
            findUnique: jest.fn().mockResolvedValue({
              id: 'participant-1',
              teamId: null,
              paid: false,
              banned: true,
              ownedTeam: null,
            }),
          },
        };
        return cb(mockTx);
      });

      await expect(service.joinTeam('user-1', joinDto as any)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ForbiddenException if the participant has already paid', async () => {
      mockPrismaService.$transaction.mockImplementation(async (cb: any) => {
        const mockTx = {
          participant: {
            findUnique: jest.fn().mockResolvedValue({
              id: 'participant-1',
              teamId: null,
              paid: true,
              banned: false,
              ownedTeam: null,
            }),
          },
        };
        return cb(mockTx);
      });

      await expect(service.joinTeam('user-1', joinDto as any)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ConflictException if the participant is already in a team', async () => {
      mockPrismaService.$transaction.mockImplementation(async (cb: any) => {
        const mockTx = {
          participant: {
            findUnique: jest.fn().mockResolvedValue({
              id: 'participant-1',
              teamId: 'team-2',
              paid: false,
              banned: false,
              ownedTeam: null,
            }),
          },
        };
        return cb(mockTx);
      });

      await expect(service.joinTeam('user-1', joinDto as any)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw NotFoundException if no team matches the code', async () => {
      mockPrismaService.$transaction.mockImplementation(async (cb: any) => {
        const mockTx = {
          participant: {
            findUnique: jest.fn().mockResolvedValue({
              id: 'participant-1',
              teamId: null,
              paid: false,
              banned: false,
              ownedTeam: null,
            }),
          },
          team: { findUnique: jest.fn().mockResolvedValue(null) },
        };
        return cb(mockTx);
      });

      await expect(service.joinTeam('user-1', joinDto as any)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if the team is already full', async () => {
      mockPrismaService.$transaction.mockImplementation(async (cb: any) => {
        const mockTx = {
          participant: {
            findUnique: jest.fn().mockResolvedValue({
              id: 'participant-1',
              teamId: null,
              paid: false,
              banned: false,
              ownedTeam: null,
            }),
          },
          team: {
            findUnique: jest.fn().mockResolvedValue({
              id: 'team-1',
              size: 2,
              members: [{ id: 'a' }, { id: 'b' }],
            }),
          },
        };
        return cb(mockTx);
      });

      await expect(service.joinTeam('user-1', joinDto as any)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('leaveTeam', () => {
    it('should let a member leave their team', async () => {
      mockPrismaService.$transaction.mockImplementation(async (cb: any) => {
        const mockTx = {
          participant: {
            findUnique: jest.fn().mockResolvedValue({
              id: 'participant-1',
              teamId: 'team-1',
              ownedTeam: null,
            }),
            update: jest.fn().mockResolvedValue({}),
          },
        };
        return cb(mockTx);
      });

      await expect(service.leaveTeam('user-1')).resolves.toBeUndefined();
    });

    it('should throw NotFoundException if the participant profile does not exist', async () => {
      mockPrismaService.$transaction.mockImplementation(async (cb: any) => {
        const mockTx = {
          participant: { findUnique: jest.fn().mockResolvedValue(null) },
        };
        return cb(mockTx);
      });

      await expect(service.leaveTeam('user-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if the participant is the team leader', async () => {
      mockPrismaService.$transaction.mockImplementation(async (cb: any) => {
        const mockTx = {
          participant: {
            findUnique: jest.fn().mockResolvedValue({
              id: 'participant-1',
              teamId: null,
              ownedTeam: { id: 'team-1' },
            }),
          },
        };
        return cb(mockTx);
      });

      await expect(service.leaveTeam('user-1')).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException if the participant is not in any team', async () => {
      mockPrismaService.$transaction.mockImplementation(async (cb: any) => {
        const mockTx = {
          participant: {
            findUnique: jest.fn().mockResolvedValue({
              id: 'participant-1',
              teamId: null,
              ownedTeam: null,
            }),
          },
        };
        return cb(mockTx);
      });

      await expect(service.leaveTeam('user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('kickMember', () => {
    it('should let the leader remove a member', async () => {
      const updatedTeam = {
        id: 'team-1',
        size: 4,
        members: [
          { id: 'leader-participant', user: { name: 'A', lastName: 'B', email: 'a@b.com' } },
        ],
      };
      mockPrismaService.$transaction.mockImplementation(async (cb: any) => {
        const mockTx = {
          participant: {
            findUnique: jest.fn().mockResolvedValue({
              id: 'leader-participant',
              ownedTeam: { id: 'team-1' },
            }),
          },
          team: {
            findFirst: jest.fn().mockResolvedValue({ id: 'team-1' }),
            update: jest.fn().mockResolvedValue(updatedTeam),
          },
        };
        return cb(mockTx);
      });

      const result = await service.kickMember('user-1', 'member-participant');

      expect(result.members).toHaveLength(1);
    });

    it('should throw NotFoundException if the caller has no profile', async () => {
      mockPrismaService.$transaction.mockImplementation(async (cb: any) => {
        const mockTx = { participant: { findUnique: jest.fn().mockResolvedValue(null) } };
        return cb(mockTx);
      });

      await expect(service.kickMember('user-1', 'member-participant')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if the caller does not lead a team', async () => {
      mockPrismaService.$transaction.mockImplementation(async (cb: any) => {
        const mockTx = {
          participant: {
            findUnique: jest.fn().mockResolvedValue({ id: 'participant-1', ownedTeam: null }),
          },
        };
        return cb(mockTx);
      });

      await expect(service.kickMember('user-1', 'member-participant')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException if the leader tries to kick themselves', async () => {
      mockPrismaService.$transaction.mockImplementation(async (cb: any) => {
        const mockTx = {
          participant: {
            findUnique: jest.fn().mockResolvedValue({
              id: 'leader-participant',
              ownedTeam: { id: 'team-1' },
            }),
          },
        };
        return cb(mockTx);
      });

      await expect(service.kickMember('user-1', 'leader-participant')).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw NotFoundException if the target is not a member of the team', async () => {
      mockPrismaService.$transaction.mockImplementation(async (cb: any) => {
        const mockTx = {
          participant: {
            findUnique: jest.fn().mockResolvedValue({
              id: 'leader-participant',
              ownedTeam: { id: 'team-1' },
            }),
          },
          team: { findFirst: jest.fn().mockResolvedValue(null) },
        };
        return cb(mockTx);
      });

      await expect(service.kickMember('user-1', 'stranger-participant')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('disbandTeam', () => {
    it('should let the leader disband their team', async () => {
      mockPrismaService.$transaction.mockImplementation(async (cb: any) => {
        const mockTx = {
          participant: {
            findUnique: jest.fn().mockResolvedValue({
              id: 'leader-participant',
              ownedTeam: { id: 'team-1' },
            }),
          },
          team: {
            delete: jest.fn().mockResolvedValue({ id: 'team-1' }),
          },
        };
        return cb(mockTx);
      });

      await expect(service.disbandTeam('user-1')).resolves.toBeUndefined();
    });

    it('should throw NotFoundException if the caller has no profile', async () => {
      mockPrismaService.$transaction.mockImplementation(async (cb: any) => {
        const mockTx = { participant: { findUnique: jest.fn().mockResolvedValue(null) } };
        return cb(mockTx);
      });

      await expect(service.disbandTeam('user-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if the caller does not lead a team', async () => {
      mockPrismaService.$transaction.mockImplementation(async (cb: any) => {
        const mockTx = {
          participant: {
            findUnique: jest.fn().mockResolvedValue({ id: 'participant-1', ownedTeam: null }),
          },
        };
        return cb(mockTx);
      });

      await expect(service.disbandTeam('user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteParticipant', () => {
    it('should delete a participant who does not lead a team', async () => {
      mockPrismaService.$transaction.mockImplementation(async (cb: any) => {
        const mockTx = {
          participant: {
            findUnique: jest.fn().mockResolvedValue({
              id: 'participant-1',
              userId: 'user-1',
              paid: false,
              ownedTeam: null,
            }),
            delete: jest.fn().mockResolvedValue({}),
          },
        };
        return cb(mockTx);
      });

      await expect(service.deleteParticipant('participant-1')).resolves.toBeUndefined();
    });

    it('should delete a leader whose team has no other members (solo team)', async () => {
      mockPrismaService.$transaction.mockImplementation(async (cb: any) => {
        const mockTx = {
          participant: {
            findUnique: jest.fn().mockResolvedValue({
              id: 'leader-participant',
              userId: 'user-1',
              paid: false,
              ownedTeam: { id: 'team-1', members: [{ id: 'leader-participant' }] },
            }),
            delete: jest.fn().mockResolvedValue({}),
          },
        };
        return cb(mockTx);
      });

      await expect(service.deleteParticipant('leader-participant')).resolves.toBeUndefined();
    });

    it('should throw ConflictException if the leader has other teammates', async () => {
      mockPrismaService.$transaction.mockImplementation(async (cb: any) => {
        const mockTx = {
          participant: {
            findUnique: jest.fn().mockResolvedValue({
              id: 'leader-participant',
              userId: 'user-1',
              paid: false,
              ownedTeam: {
                id: 'team-1',
                members: [{ id: 'leader-participant' }, { id: 'member-1' }],
              },
            }),
            delete: jest.fn(),
          },
        };
        return cb(mockTx);
      });

      await expect(service.deleteParticipant('leader-participant')).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw ForbiddenException if the participant has paid', async () => {
      mockPrismaService.$transaction.mockImplementation(async (cb: any) => {
        const mockTx = {
          participant: {
            findUnique: jest.fn().mockResolvedValue({
              id: 'participant-1',
              userId: 'user-1',
              paid: true,
              ownedTeam: null,
            }),
            delete: jest.fn(),
          },
        };
        return cb(mockTx);
      });

      await expect(service.deleteParticipant('participant-1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw NotFoundException if the participant does not exist', async () => {
      mockPrismaService.$transaction.mockImplementation(async (cb: any) => {
        const mockTx = {
          participant: { findUnique: jest.fn().mockResolvedValue(null) },
        };
        return cb(mockTx);
      });

      await expect(service.deleteParticipant('participant-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});