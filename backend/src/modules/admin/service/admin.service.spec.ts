import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { AdminService } from './admin.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

// Mock the supabase module
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      admin: {
        createUser: jest.fn<any>(),
        updateUserById: jest.fn<any>(),
        deleteUser: jest.fn<any>(),
      },
    },
  })),
}));

describe('AdminService', () => {
  let service: AdminService;
  let prisma: PrismaService;
  let configService: ConfigService;

  const mockPrismaService = {
    admin: {
      create: jest.fn<any>(),
      findUnique: jest.fn<any>(),
    },
    user: {
      delete: jest.fn<any>(),
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
        AdminService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
    prisma = module.get<PrismaService>(PrismaService);
    configService = module.get<ConfigService>(ConfigService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createAdmin', () => {
    it('should throw an error if supabase create user fails', async () => {
      const createUserMock = service['supabaseAdmin'].auth.admin.createUser as jest.Mock<any>;
      createUserMock.mockResolvedValue({ data: null, error: { message: 'Creation failed' } });

      const dto = { email: 'admin@test.com', password: 'password', name: 'Test', lastName: 'Admin', position: 'Manager' };
      
      await expect(service.createAdmin(dto as any)).rejects.toThrow('Failed to create admin in Supabase: Creation failed');
    });

    it('should throw an error if supabase returns no user data', async () => {
      const createUserMock = service['supabaseAdmin'].auth.admin.createUser as jest.Mock<any>;
      createUserMock.mockResolvedValue({ data: { user: null }, error: null });

      const dto = { email: 'admin@test.com', password: 'password', name: 'Test', lastName: 'Admin', position: 'Manager' };
      
      await expect(service.createAdmin(dto as any)).rejects.toThrow('Supabase returned no user data');
    });

    it('should create an admin in supabase and prisma and return it', async () => {
      const supabaseUser = { id: 'supa-admin-123' };
      const createUserMock = service['supabaseAdmin'].auth.admin.createUser as jest.Mock<any>;
      createUserMock.mockResolvedValue({ data: { user: supabaseUser }, error: null });

      const updateUserMock = service['supabaseAdmin'].auth.admin.updateUserById as jest.Mock<any>;
      updateUserMock.mockResolvedValue({ data: { user: supabaseUser }, error: null });

      const dto = { email: 'admin@test.com', password: 'password', name: 'Test', lastName: 'Admin', position: 'Manager' };
      const expectedAdmin = { id: '1', supabaseId: supabaseUser.id, email: dto.email };
      
      mockPrismaService.admin.create.mockResolvedValue(expectedAdmin);

      const result = await service.createAdmin(dto as any);

      expect(createUserMock).toHaveBeenCalledWith({
        email: dto.email,
        password: dto.password,
        email_confirm: true,
        user_metadata: {
          name: dto.name,
          lastName: dto.lastName,
          position: dto.position,
        },
      });

      expect(prisma.admin.create).toHaveBeenCalledWith({
        data: {
          supabaseId: supabaseUser.id,
          email: dto.email,
          name: dto.name,
          lastName: dto.lastName,
          position: dto.position,
        },
      });

      expect(updateUserMock).toHaveBeenCalledWith(supabaseUser.id, {
        app_metadata: { role: 'admin' },
      });

      expect(result).toEqual(expectedAdmin);
    });
  });

  describe('findBySupabaseId', () => {
    it('should return admin by supabaseId', async () => {
      const supabaseId = 'supa-123';
      const expectedAdmin = { id: '1', supabaseId };
      mockPrismaService.admin.findUnique.mockResolvedValue(expectedAdmin);

      const result = await service.findBySupabaseId(supabaseId);
      
      expect(prisma.admin.findUnique).toHaveBeenCalledWith({ where: { supabaseId } });
      expect(result).toEqual(expectedAdmin);
    });
  });

  describe('deleteAccount', () => {
    it('should throw an error if deleting from supabase fails', async () => {
      const deleteUserMock = service['supabaseAdmin'].auth.admin.deleteUser as jest.Mock<any>;
      deleteUserMock.mockResolvedValue({ error: { message: 'Delete failed' } });

      await expect(service.deleteAccount('supa-123')).rejects.toThrow('Failed to delete user from Supabase: Delete failed');
    });

    it('should delete from supabase and prisma', async () => {
      const deleteUserMock = service['supabaseAdmin'].auth.admin.deleteUser as jest.Mock<any>;
      deleteUserMock.mockResolvedValue({ error: null });

      const expectedDeletedUser = { id: '1', supabaseId: 'supa-123' };
      mockPrismaService.user.delete.mockResolvedValue(expectedDeletedUser);

      const result = await service.deleteAccount('supa-123');

      expect(deleteUserMock).toHaveBeenCalledWith('supa-123');
      expect(prisma.user.delete).toHaveBeenCalledWith({ where: { supabaseId: 'supa-123' } });
      expect(result).toEqual({ message: 'Account deleted successfully', user: expectedDeletedUser });
    });
  });
});
