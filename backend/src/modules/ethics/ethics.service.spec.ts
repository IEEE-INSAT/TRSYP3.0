import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ForbiddenException, ServiceUnavailableException } from '@nestjs/common';
import { EthicsService } from './service';
import { SetEthicsStateSchema } from './dto';
import { PrismaService } from '../../prisma/prisma.service';

describe('EthicsService', () => {
  let service: EthicsService;
  let mockPrismaService: any;
  /** Value of ETHICS_MODERATOR_KEY for the current test. */
  let moderatorKey: string | undefined;

  const row = (overrides: Record<string, any> = {}) => ({
    id: 1,
    step: 2,
    votingOpen: true,
    updatedAt: new Date('2026-10-18T09:00:00Z'),
    ...overrides,
  });

  beforeEach(async () => {
    moderatorKey = 'secret-key';
    mockPrismaService = { ethicsSession: { upsert: jest.fn().mockResolvedValue(row()) } };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EthicsService,
        { provide: PrismaService, useValue: mockPrismaService },
        {
          provide: ConfigService,
          useValue: { get: jest.fn((key: string) => (key === 'ETHICS_MODERATOR_KEY' ? moderatorKey : undefined)) },
        },
      ],
    }).compile();

    service = module.get<EthicsService>(EthicsService);
  });

  describe('getState', () => {
    it('should read the single row', async () => {
      expect(await service.getState()).toEqual({ step: 2, votingOpen: true, updatedAt: row().updatedAt });
      expect(mockPrismaService.ethicsSession.upsert).toHaveBeenCalledWith({ where: { id: 1 }, create: {}, update: {} });
    });

    it('should reuse a fresh read instead of hitting the database again', async () => {
      await service.getState();
      await service.getState();
      expect(mockPrismaService.ethicsSession.upsert).toHaveBeenCalledTimes(1);
    });
  });

  describe('setState', () => {
    it("should move every screen with the moderator's key", async () => {
      mockPrismaService.ethicsSession.upsert.mockResolvedValue(row({ step: 3, votingOpen: false }));

      const state = await service.setState(' secret-key ', { step: 3, votingOpen: false });

      expect(mockPrismaService.ethicsSession.upsert).toHaveBeenCalledWith({
        where: { id: 1 },
        create: { step: 3, votingOpen: false },
        update: { step: 3, votingOpen: false },
      });
      expect(state).toMatchObject({ step: 3, votingOpen: false });
    });

    it('should show the change to the next read at once', async () => {
      await service.getState();
      mockPrismaService.ethicsSession.upsert.mockResolvedValue(row({ step: 4 }));
      await service.setState('secret-key', { step: 4, votingOpen: true });

      expect((await service.getState()).step).toBe(4);
    });

    it('should refuse a wrong or missing key', async () => {
      await expect(service.setState('nope', { step: 1, votingOpen: true })).rejects.toThrow(ForbiddenException);
      await expect(service.setState(undefined, { step: 1, votingOpen: true })).rejects.toThrow(ForbiddenException);
      expect(mockPrismaService.ethicsSession.upsert).not.toHaveBeenCalled();
    });

    it('should refuse everyone while no key is set on the server', async () => {
      moderatorKey = '';
      await expect(service.setState('', { step: 1, votingOpen: true })).rejects.toThrow(ServiceUnavailableException);
    });
  });

  describe('SetEthicsStateSchema', () => {
    it('should take a step and the voting flag', () => {
      expect(SetEthicsStateSchema.parse({ step: 5, votingOpen: false })).toEqual({ step: 5, votingOpen: false });
    });

    it('should refuse a negative or fractional step', () => {
      expect(SetEthicsStateSchema.safeParse({ step: -1, votingOpen: true }).success).toBe(false);
      expect(SetEthicsStateSchema.safeParse({ step: 1.5, votingOpen: true }).success).toBe(false);
    });
  });
});
