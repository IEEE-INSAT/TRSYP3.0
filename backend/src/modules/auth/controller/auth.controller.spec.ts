import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from '../service/auth.service';
import { UnauthorizedException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    syncUser: jest.fn<any>(),
    findbySupabaseId: jest.fn<any>(),
    resetPassword: jest.fn<any>(),
  };

  const mockResponse = () => {
    const res: Partial<Response> = {};
    res.status = jest.fn<any>().mockReturnValue(res) as any;
    res.json = jest.fn<any>().mockReturnValue(res) as any;
    return res as Response;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
    
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('syncUser', () => {
    it('should throw UnauthorizedException if supabaseId is missing from req.user', async () => {
      const req = { user: {} } as Request;
      const res = mockResponse();
      const dto = { email: 'test@test.com', name: 'Test', lastName: 'User', provider: 'google' } as any;

      await expect(controller.syncUser(dto, res, req)).rejects.toThrow(UnauthorizedException);
      await expect(controller.syncUser(dto, res, req)).rejects.toThrow('User not found');
    });

    it('should sync user and return 200 OK', async () => {
      const req = { user: { _supabaseId: 'supa-123', email_confirmed_at: '2026-01-01' } } as unknown as Request;
      const res = mockResponse();
      const dto = { email: 'test@test.com', name: 'Test', lastName: 'User', provider: 'google' } as any;
      const expectedUser = { id: '1', email: 'test@test.com' };

      mockAuthService.syncUser.mockResolvedValue(expectedUser);

      await controller.syncUser(dto, res, req);

      expect(authService.syncUser).toHaveBeenCalledWith('supa-123', dto);
      expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(res.json).toHaveBeenCalledWith(expectedUser);
    });
  });

  describe('getMe', () => {
    it('should return the current user profile with 200 OK', async () => {
      const req = { user: { _supabaseId: 'supa-123', sub: 'db-id-123' } } as unknown as Request;
      const res = mockResponse();
      const expectedUser = { id: '1', email: 'test@test.com' };

      mockAuthService.findbySupabaseId.mockResolvedValue(expectedUser);

      await controller.getMe(req, res);

      expect(authService.findbySupabaseId).toHaveBeenCalledWith('supa-123');
      expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(res.json).toHaveBeenCalledWith(expectedUser);
    });
  });

  describe('Password_reset', () => {
    it('should initiate password reset and return 200 OK', async () => {
      const dto = { email: 'test@test.com' };
      const res = mockResponse();
      const expectedResult = { message: 'If an account exists, a password reset email has been sent' };

      mockAuthService.resetPassword.mockResolvedValue(expectedResult);

      await controller.Password_reset(dto, res);

      expect(authService.resetPassword).toHaveBeenCalledWith('test@test.com');
      expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(res.json).toHaveBeenCalledWith(expectedResult);
    });
  });
});
