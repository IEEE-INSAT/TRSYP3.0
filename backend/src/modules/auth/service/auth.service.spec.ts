import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

// Mock the supabase module
jest.mock('@supabase/supabase-js', () => ({
    createClient: jest.fn(() => ({
        auth: {
            signUp: jest.fn(),
            resetPasswordForEmail: jest.fn(),
        },
    })),
}));

describe('AuthService', () => {
    let service: AuthService;
    let prisma: any;

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

        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('findbySupabaseId', () => {
        it('should return the user if found', async () => {
            const supabaseId = 'supa-123';
            const expectedUser = {
                id: '1',
                supabaseId,
                email: 'test@test.com',
            };

            mockPrismaService.user.findUnique.mockResolvedValue(expectedUser);

            const result = await service.findbySupabaseId(supabaseId);

            expect(prisma.user.findUnique).toHaveBeenCalledWith({
                where: { supabaseId },
            });
            expect(result).toEqual(expectedUser);
        });
    });

    describe('legacy auth endpoints', () => {
        it('uses Supabase signup for deployed clients that still post to the backend', async () => {
            mockPrismaService.user.findUnique.mockResolvedValue(null);
            const signUpMock = service['supabase'].auth
                .signUp as jest.Mock<any>;
            signUpMock.mockResolvedValue({
                data: { user: { id: 'supabase-user-id' } },
                error: null,
            });

            await expect(
                service.signUp({
                    email: 'new@test.com',
                    password: 'Valid!123',
                    name: 'New',
                    lastName: 'Member',
                }),
            ).resolves.toEqual({
                message: 'Check your inbox to verify your TRSYP 3.0 account.',
            });
            expect(signUpMock).toHaveBeenCalledWith({
                email: 'new@test.com',
                password: 'Valid!123',
                options: {
                    data: { name: 'New', lastName: 'Member' },
                    emailRedirectTo: 'https://rtc.ieee.tn/verify-email/',
                },
            });
        });

        it('keeps a password-reset response generic for legacy clients', async () => {
            mockPrismaService.user.findUnique.mockResolvedValue(null);

            await expect(
                service.resetPassword('missing@test.com'),
            ).resolves.toEqual({
                message:
                    'If an account exists, a password reset email has been sent',
            });
        });
    });
});
