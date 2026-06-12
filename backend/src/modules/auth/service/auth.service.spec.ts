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

      const result = await service.syncUser(supabaseId, dto as any);

      expect(prisma.user.upsert).toHaveBeenCalledWith({
        where: { supabaseId },
        update: {
          email: dto.email,
          name: dto.name,
          lastName: dto.lastName,
          provider: dto.provider,
        },
        create: {
          supabaseId,
          email: dto.email,
          name: dto.name,
          lastName: dto.lastName,
          provider: dto.provider,
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
    it('should throw an error if the user is not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.resetPassword('test@test.com')).rejects.toThrow('User not found');
    });

    it('should send a password reset email if the user exists', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: '1', email: 'test@test.com' });
      
      // We can access the mocked supabase client from the service instance
      const resetMock = service['supabase'].auth.resetPasswordForEmail as jest.Mock<any>;
      resetMock.mockResolvedValue({ data: {}, error: null });

      const result = await service.resetPassword('test@test.com');

      expect(resetMock).toHaveBeenCalledWith('test@test.com', { redirectTo: 'http://localhost:3000' });
      expect(result).toEqual({ message: 'If an account exists, a password reset email has been sent' });
    });

    it('should throw an error if supabase resetPasswordForEmail fails', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: '1', email: 'test@test.com' });
      
      const resetMock = service['supabase'].auth.resetPasswordForEmail as jest.Mock<any>;
      resetMock.mockResolvedValue({ data: null, error: { message: 'Supabase error' } });

      await expect(service.resetPassword('test@test.com')).rejects.toThrow('Supabase error');
    });
  });
});
