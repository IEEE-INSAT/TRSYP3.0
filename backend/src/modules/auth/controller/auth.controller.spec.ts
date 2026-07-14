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
        findbySupabaseId: jest.fn<any>(),
        signUp: jest.fn<any>(),
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
            providers: [{ provide: AuthService, useValue: mockAuthService }],
        }).compile();

        controller = module.get<AuthController>(AuthController);
        authService = module.get<AuthService>(AuthService);

        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('getMe', () => {
        it('should return the current user profile with 200 OK', async () => {
            const req = {
                user: { _supabaseId: 'supa-123', sub: 'db-id-123' },
            } as unknown as Request;
            const res = mockResponse();
            const expectedUser = { id: '1', email: 'test@test.com' };

            mockAuthService.findbySupabaseId.mockResolvedValue(expectedUser);

            await controller.getMe(req, res);

            expect(authService.findbySupabaseId).toHaveBeenCalledWith(
                'supa-123',
            );
            expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
            expect(res.json).toHaveBeenCalledWith(expectedUser);
        });
    });

    it('keeps the legacy signup endpoint available during frontend rollout', async () => {
        const dto = {
            email: 'new@test.com',
            password: 'Valid!123',
            name: 'New',
            lastName: 'Member',
        };
        const expected = {
            message: 'Check your inbox to verify your TRSYP 3.0 account.',
        };
        mockAuthService.signUp.mockResolvedValue(expected);

        await expect(controller.signUp(dto)).resolves.toEqual(expected);
        expect(authService.signUp).toHaveBeenCalledWith(dto);
    });
});
