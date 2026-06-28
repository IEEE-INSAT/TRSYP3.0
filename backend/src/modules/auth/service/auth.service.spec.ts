import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

// Mock the supabase module
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      resetPasswordForEmail: jest.fn(),
      admin: {
        getUserById: jest.fn(),
      },
    },
  })),
}));

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let configService: ConfigService;

  const mockPrismaService = {
    user: {
      upsert: jest.fn<any>(),
      findUnique: jest.fn<any>(),
    },
  };

  const mockConfigService = {
    get: jest.fn<any>((key: string) => {
      if (key === 'SUPABASE_URL') return 'http://localhost:54321';
      if (key === 'SUPABASE_SERVICE_ROLE_KEY') return 'test-key';
      if (key === 'FRONTEND_URL') return 'https://rtc.ieee.tn';
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    configService = module.get<ConfigService>(ConfigService);
    
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('syncUser', () => {
    it('should upsert the user into the database', async () => {
      const dto = { email: 'test@test.com', name: 'Test', lastName: 'User', provider: 'google' };
      const supabaseId = 'supa-123';
      const expectedUser = { id: '1', supabaseId, ...dto };
      
      mockPrismaService.user.upsert.mockResolvedValue(expectedUser);

      const getUserByIdMock = service['supabase'].auth.admin.getUserById as jest.Mock<any>;
      getUserByIdMock.mockResolvedValue({ data: { user: { email_confirmed_at: '2026-01-01' } }, error: null });

      const result = await service.syncUser(supabaseId, dto as any);

      expect(prisma.user.upsert).toHaveBeenCalledWith({
        where: { supabaseId },
        update: {
          email: dto.email,
          name: dto.name,
          lastName: dto.lastName,
          provider: dto.provider,
          active: true,
        },
        create: {
          supabaseId,
          email: dto.email,
          name: dto.name,
          lastName: dto.lastName,
          provider: dto.provider,
          active: true,
        },
      });
      expect(result).toEqual(expectedUser);
    });
  });

  describe('findbySupabaseId', () => {
    it('should return the user if found', async () => {
      const supabaseId = 'supa-123';
      const expectedUser = { id: '1', supabaseId, email: 'test@test.com' };
      
      mockPrismaService.user.findUnique.mockResolvedValue(expectedUser);

      const result = await service.findbySupabaseId(supabaseId);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { supabaseId } });
      expect(result).toEqual(expectedUser);
    });
  });

  describe('resetPassword', () => {
    const genericResponse = { message: 'If an account exists, a password reset email has been sent' };

    it('should return the generic message even if the user is not found (no enumeration)', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.resetPassword('unknown@test.com');

      expect(result).toEqual(genericResponse);
    });

    it('should send a password reset email if the user exists', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: '1', email: 'test@test.com' });
      
      const resetMock = service['supabase'].auth.resetPasswordForEmail as jest.Mock<any>;
      resetMock.mockResolvedValue({ data: {}, error: null });

      const result = await service.resetPassword('test@test.com');

      expect(resetMock).toHaveBeenCalledWith('test@test.com', { redirectTo: 'https://rtc.ieee.tn' });
      expect(result).toEqual(genericResponse);
    });

    it('should return the generic message even if supabase fails (no error leakage)', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: '1', email: 'test@test.com' });
      
      const resetMock = service['supabase'].auth.resetPasswordForEmail as jest.Mock<any>;
      resetMock.mockResolvedValue({ data: null, error: { message: 'Supabase error' } });

      const result = await service.resetPassword('test@test.com');

      // The error is swallowed — the response is still the generic message.
      expect(result).toEqual(genericResponse);
    });
  });
});
