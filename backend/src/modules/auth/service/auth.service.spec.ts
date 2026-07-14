import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

// Mock the supabase module
jest.mock('@supabase/supabase-js', () => ({
    createClient: jest.fn(() => ({
        auth: {},
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

});
