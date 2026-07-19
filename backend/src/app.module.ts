

import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as Joi from 'joi';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AdminModule } from './modules/admin/admin.module';
import { RoomingModule } from './modules/rooming/rooming.module';
import { RegistrationModule } from './modules/registration/registration.module';
import { ChallengeModule } from './modules/challenge/challenge.module';
// import { NotificationModule } from './modules/notification/notification.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AppController } from './app.controller';
@Module({
    imports:[ConfigModule.forRoot({
        isGlobal:true,
        validationSchema:Joi.object({
            DATABASE_URL:Joi.string().required(),
            SUPABASE_JWT_SECRET:Joi.string().required(),
            JWT_EXPIRES_IN:Joi.string().required(),
            GOOGLE_CLIENT_ID:Joi.string().optional(),
            GOOGLE_CLIENT_SECRET:Joi.string().optional(),
            GOOGLE_CALLBACK_URL:Joi.string().optional(),
            SUPABASE_URL:Joi.string().required(),
            SUPABASE_SERVICE_ROLE_KEY:Joi.string().required(),
            FRONTEND_URL: Joi.string().uri().required(),
            RIDDLE_CODE_SECRET: Joi.string().required(),
        })
    }),
        PassportModule,
        JwtModule.registerAsync({
            global:true,
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: async (configService: ConfigService) => ({
                secret: configService.get<string>('JWT_SECRET'),
                signOptions: { expiresIn: configService.get<string>('JWT_EXPIRES_IN') as any },
            }),
        }),
        // Global rate limiting: 50 requests per 60 seconds per IP.
        // Individual endpoints can override with @Throttle() for stricter limits.
        ThrottlerModule.forRoot({
            throttlers: [{
                ttl: 60000,
                limit: 50,
            }],
        }),
        EventEmitterModule.forRoot(),
        PrismaModule, AuthModule, AdminModule, RoomingModule, RegistrationModule, ChallengeModule, /* NotificationModule */],
    controllers: [AppController],
    providers: [
        AppService,
        AppService,
        // Apply ThrottlerGuard globally to all endpoints
        { provide: APP_GUARD, useClass: ThrottlerGuard },
    ],
})
export class AppModule {}