import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { AdminController } from './admin.controller';
import { AdminService } from '../service/admin.service';
import { HttpStatus } from '@nestjs/common';
import { Response } from 'express';

describe('AdminController', () => {
  let controller: AdminController;
  let adminService: AdminService;

  const mockAdminService = {
    createAdmin: jest.fn<any>(),
    deleteAccount: jest.fn<any>(),
  };

  const mockResponse = () => {
    const res: Partial<Response> = {};
    res.status = jest.fn<any>().mockReturnValue(res) as any;
    res.json = jest.fn<any>().mockReturnValue(res) as any;
    return res as Response;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        { provide: AdminService, useValue: mockAdminService },
      ],
    }).compile();

    controller = module.get<AdminController>(AdminController);
    adminService = module.get<AdminService>(AdminService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createAdmin', () => {
    it('should create an admin and return 200 OK', async () => {
      const dto = { email: 'admin@test.com', password: 'password', name: 'Test', lastName: 'Admin', position: 'Manager' } as any;
      const res = mockResponse();
      const expectedAdmin = { id: '1', email: 'admin@test.com' };

      mockAdminService.createAdmin.mockResolvedValue(expectedAdmin);

      await controller.createAdmin(dto, res);

      expect(adminService.createAdmin).toHaveBeenCalledWith(dto);
      expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(res.json).toHaveBeenCalledWith(expectedAdmin);
    });
  });

  describe('deleteAccount', () => {
    it('should delete an account and return 200 OK', async () => {
      const dto = { supabaseId: 'supa-123' };
      const res = mockResponse();
      const expectedResult = { message: 'Account deleted successfully', user: { id: '1' } };

      mockAdminService.deleteAccount.mockResolvedValue(expectedResult);

      await controller.deleteAccount(dto as any, res);

      expect(adminService.deleteAccount).toHaveBeenCalledWith('supa-123');
      expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(res.json).toHaveBeenCalledWith(expectedResult);
    });
  });
});
