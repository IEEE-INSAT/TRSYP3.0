import { Test, TestingModule } from '@nestjs/testing';
import {
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
  COUNTRY,
  ParticipantType,
  PaymentMethod,
  PaymentProofStatus,
  SB,
} from '@prisma/client';
import { PaymentService, UploadedProof } from './service';
import { ProofStorageService } from './service/storage.service';
import { RegistrationService } from '../registration/service';
import { AdminService } from '../admin/service/admin.service';
import { PrismaService } from '../../prisma/prisma.service';
import { MAX_PROOF_BYTES } from './domain';

describe('PaymentService', () => {
  let service: PaymentService;
  let mockPrismaService: any;
  let mockRegistrationService: any;
  let mockAdminService: any;
  let mockStorage: any;
  let mockEventEmitter: any;
  let mockConfigService: any;

  /** A non-IEEE visitor with no team: 185 TND by the fee table. */
  const mockParticipant = {
    id: 'participant-1',
    userId: 'user-1',
    phone: '+21612345678',
    gender: 'male',
    paid: false,
    banned: false,
    isRas: false,
    isInternational: false,
    participantType: ParticipantType.NonIEEE,
    sb: SB.INSAT,
    country: COUNTRY.Tunisia,
    _count: { memberships: 0 },
  };

  const mockProof = {
    id: 'proof-1',
    participantId: 'participant-1',
    method: PaymentMethod.BANK_TRANSFER,
    storagePath: null,
    fileName: null,
    mimeType: null,
    sizeBytes: null,
    amountSnapshot: 185,
    status: PaymentProofStatus.PENDING,
    rejectionReason: null,
    reviewedAt: null,
    createdAt: new Date(),
  };

  const receipt = (overrides: Partial<UploadedProof> = {}): UploadedProof => ({
    buffer: Buffer.from('receipt'),
    originalname: 'receipt.png',
    mimetype: 'image/png',
    size: 1024,
    ...overrides,
  });

  beforeEach(async () => {
    mockPrismaService = {
      paymentProof: {
        create: jest.fn().mockResolvedValue(mockProof),
        findFirst: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn(),
        update: jest.fn().mockResolvedValue(mockProof),
        delete: jest.fn().mockResolvedValue(mockProof),
        count: jest.fn().mockResolvedValue(0),
      },
    };

    mockRegistrationService = {
      findByUserId: jest.fn().mockResolvedValue(mockParticipant),
      markAsPaid: jest.fn().mockResolvedValue({ ...mockParticipant, paid: true }),
      markAsUnpaid: jest.fn().mockResolvedValue({ ...mockParticipant, paid: false }),
    };

    mockAdminService = { findBySupabaseId: jest.fn().mockResolvedValue(null) };

    mockStorage = {
      upload: jest.fn().mockResolvedValue('participant-1/proof-1.png'),
      signedUrl: jest.fn().mockResolvedValue({ url: 'https://signed', expiresIn: 60 }),
      remove: jest.fn().mockResolvedValue(undefined),
    };

    mockEventEmitter = { emit: jest.fn() };

    // Submission open by default; the closed case is its own spec.
    mockConfigService = { get: jest.fn().mockReturnValue('true') };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: RegistrationService, useValue: mockRegistrationService },
        { provide: AdminService, useValue: mockAdminService },
        { provide: ProofStorageService, useValue: mockStorage },
        { provide: EventEmitter2, useValue: mockEventEmitter },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);

    // Every submit path re-reads the row it just wrote.
    mockPrismaService.paymentProof.findUnique.mockResolvedValue({
      ...mockProof,
      participant: {
        ...mockParticipant,
        user: { name: 'A', lastName: 'B', email: 'a@b.com' },
      },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('feeFor', () => {
    it('prices a non-IEEE visitor at 185', () => {
      expect(service.feeFor(mockParticipant)).toBe(185);
    });

    it('prices an IEEE RAS member on a team as a challenger', () => {
      const fee = service.feeFor({
        ...mockParticipant,
        participantType: ParticipantType.Student,
        isRas: true,
        _count: { memberships: 1 },
      });
      expect(fee).toBe(175);
    });
  });

  describe('submitProof', () => {
    it('stores the receipt and snapshots the fee', async () => {
      await service.submitProof('user-1', PaymentMethod.BANK_TRANSFER, receipt());

      expect(mockPrismaService.paymentProof.create).toHaveBeenCalledWith({
        data: {
          participantId: 'participant-1',
          method: PaymentMethod.BANK_TRANSFER,
          amountSnapshot: 185,
        },
      });
      expect(mockStorage.upload).toHaveBeenCalledWith(
        'participant-1',
        'proof-1',
        'png',
        expect.any(Buffer),
        'image/png',
      );
    });

    it('refuses a method that is not currently offered', async () => {
      // Cash is the sharp edge: it is the one method allowed to skip the
      // receipt, so accepting it while unoffered would let a crafted request
      // register a pending payment with no proof.
      await expect(
        service.submitProof('user-1', PaymentMethod.CASH, undefined),
      ).rejects.toThrow(BadRequestException);
      expect(mockPrismaService.paymentProof.create).not.toHaveBeenCalled();
    });

    it('requires a receipt for bank transfer', async () => {
      await expect(
        service.submitProof('user-1', PaymentMethod.BANK_TRANSFER, undefined),
      ).rejects.toThrow(BadRequestException);
    });

    it('refuses a file over the size cap', async () => {
      await expect(
        service.submitProof(
          'user-1',
          PaymentMethod.BANK_TRANSFER,
          receipt({ size: MAX_PROOF_BYTES + 1 }),
        ),
      ).rejects.toThrow(PayloadTooLargeException);
    });

    it('refuses a file type that is not an image or a PDF', async () => {
      await expect(
        service.submitProof(
          'user-1',
          PaymentMethod.BANK_TRANSFER,
          receipt({ mimetype: 'text/html' }),
        ),
      ).rejects.toThrow(UnsupportedMediaTypeException);
    });

    it('refuses when submission is closed', async () => {
      mockConfigService.get.mockReturnValue('false');

      await expect(
        service.submitProof('user-1', PaymentMethod.BANK_TRANSFER, receipt()),
      ).rejects.toThrow(ForbiddenException);
    });

    it('refuses a banned participant', async () => {
      mockRegistrationService.findByUserId.mockResolvedValue({
        ...mockParticipant,
        banned: true,
      });

      await expect(
        service.submitProof('user-1', PaymentMethod.BANK_TRANSFER, receipt()),
      ).rejects.toThrow(ForbiddenException);
    });

    it('refuses when the participant is already paid', async () => {
      mockRegistrationService.findByUserId.mockResolvedValue({
        ...mockParticipant,
        paid: true,
      });

      await expect(
        service.submitProof('user-1', PaymentMethod.BANK_TRANSFER, receipt()),
      ).rejects.toThrow(ConflictException);
    });

    it('refuses a second proof while one is under review', async () => {
      mockPrismaService.paymentProof.findFirst.mockResolvedValue(mockProof);

      await expect(
        service.submitProof('user-1', PaymentMethod.BANK_TRANSFER, receipt()),
      ).rejects.toThrow(ConflictException);
    });

    it('rolls the row back when the upload fails', async () => {
      mockStorage.upload.mockRejectedValue(new Error('bucket down'));

      await expect(
        service.submitProof('user-1', PaymentMethod.BANK_TRANSFER, receipt()),
      ).rejects.toThrow('bucket down');

      // A fileless PENDING row would read as a cash payment to a reviewer.
      expect(mockPrismaService.paymentProof.delete).toHaveBeenCalledWith({
        where: { id: 'proof-1' },
      });
    });

    it('deletes the object left by a superseded proof', async () => {
      mockPrismaService.paymentProof.findMany.mockResolvedValue([
        { id: 'proof-0', storagePath: 'participant-1/proof-0.png' },
      ]);

      await service.submitProof('user-1', PaymentMethod.BANK_TRANSFER, receipt());

      expect(mockStorage.remove).toHaveBeenCalledWith('participant-1/proof-0.png');
      expect(mockPrismaService.paymentProof.update).toHaveBeenCalledWith({
        where: { id: 'proof-0' },
        data: { storagePath: null },
      });
    });

    it('throws when the user has no participant profile', async () => {
      mockRegistrationService.findByUserId.mockResolvedValue(null);

      await expect(
        service.submitProof('user-1', PaymentMethod.BANK_TRANSFER, receipt()),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('approveProof', () => {
    it('settles the participant through markAsPaid', async () => {
      await service.approveProof('proof-1');

      expect(mockRegistrationService.markAsPaid).toHaveBeenCalledWith('participant-1');
      expect(mockPrismaService.paymentProof.update).toHaveBeenCalledWith({
        where: { id: 'proof-1' },
        data: { status: PaymentProofStatus.APPROVED, reviewedAt: expect.any(Date) },
      });
    });

    it('refuses to review the same proof twice', async () => {
      mockPrismaService.paymentProof.findUnique.mockResolvedValue({
        ...mockProof,
        status: PaymentProofStatus.APPROVED,
        participant: {
          ...mockParticipant,
          user: { name: 'A', lastName: 'B', email: 'a@b.com' },
        },
      });

      await expect(service.approveProof('proof-1')).rejects.toThrow(ConflictException);
      expect(mockRegistrationService.markAsPaid).not.toHaveBeenCalled();
    });

    it('throws when the proof does not exist', async () => {
      mockPrismaService.paymentProof.findUnique.mockResolvedValue(null);

      await expect(service.approveProof('nope')).rejects.toThrow(NotFoundException);
    });
  });

  describe('rejectProof', () => {
    it('records the reason and leaves the participant unpaid', async () => {
      await service.rejectProof('proof-1', 'Amount does not match');

      expect(mockRegistrationService.markAsPaid).not.toHaveBeenCalled();
      expect(mockPrismaService.paymentProof.update).toHaveBeenCalledWith({
        where: { id: 'proof-1' },
        data: {
          status: PaymentProofStatus.REJECTED,
          rejectionReason: 'Amount does not match',
          reviewedAt: expect.any(Date),
        },
      });
    });
  });

  describe('rejectProof reconciliation', () => {
    it('leaves an unpaid participant alone', async () => {
      await service.rejectProof('proof-1', 'Amount does not match');
      expect(mockRegistrationService.markAsUnpaid).not.toHaveBeenCalled();
    });

    it('undoes `paid` when the two would otherwise contradict', async () => {
      mockPrismaService.paymentProof.findUnique.mockResolvedValue({
        ...mockProof,
        participant: {
          ...mockParticipant,
          paid: true,
          user: { name: 'A', lastName: 'B', email: 'a@b.com' },
        },
      });

      await service.rejectProof('proof-1', 'Receipt is unreadable');

      expect(mockRegistrationService.markAsUnpaid).toHaveBeenCalledWith('participant-1');
    });
  });

  describe('fileUrl', () => {
    it('signs a stored receipt', async () => {
      const signed = await service.fileUrl({
        ...mockProof,
        storagePath: 'participant-1/proof-1.png',
      });

      expect(signed).toEqual({ url: 'https://signed', expiresIn: 60 });
    });

    it('404s a cash payment, which has nothing to open', async () => {
      await expect(service.fileUrl(mockProof)).rejects.toThrow(NotFoundException);
    });
  });

  describe('isAdmin', () => {
    it('is true when the account has an admins row', async () => {
      mockAdminService.findBySupabaseId.mockResolvedValue({ id: 'admin-1' });
      await expect(service.isAdmin('supabase-1')).resolves.toBe(true);
    });

    it('is false for a normal account, and for no account at all', async () => {
      await expect(service.isAdmin('supabase-1')).resolves.toBe(false);
      await expect(service.isAdmin(undefined)).resolves.toBe(false);
    });
  });

  describe('isSubmissionOpen', () => {
    it('is closed unless the env var is exactly "true"', () => {
      mockConfigService.get.mockReturnValue('yes');
      expect(service.isSubmissionOpen()).toBe(false);

      mockConfigService.get.mockReturnValue('true');
      expect(service.isSubmissionOpen()).toBe(true);
    });
  });
});
