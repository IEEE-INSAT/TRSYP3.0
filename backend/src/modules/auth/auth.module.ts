import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthService } from './service/auth.service';
import { SupabaseJwtStrategy } from './supabase-jwt.strategy';
import { AuthController } from './controller/auth.controller';

@Module({
    imports: [PrismaModule, PassportModule],
    controllers: [AuthController],
    providers: [AuthService, SupabaseJwtStrategy],
    exports: [AuthService],
})
export class AuthModule {}
