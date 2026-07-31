import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { EventEmitterModule } from '@nestjs/event-emitter';
import * as Joi from 'joi';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { AdminModule } from './modules/admin/admin.module';
import { RoomingModule } from './modules/rooming/rooming.module';
import { RegistrationModule } from './modules/registration/registration.module';
import { ChallengeModule } from './modules/challenge/challenge.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            validationSchema: Joi.object({
                DATABASE_URL: Joi.string().required(),
                SUPABASE_URL: Joi.string().uri().required(),
                SUPABASE_SERVICE_ROLE_KEY: Joi.string().required(),
                FRONTEND_URL: Joi.string().uri().required(),
                CORS_ORIGINS: Joi.string().optional(),
                RIDDLE_CODE_SECRET: Joi.string().required(),
                COMPETITION_REGISTRATION_PHASE: Joi.string()
                    .valid('soon', 'open', 'closed')
                    .default('open'),
                CHALLENGE_REGISTRATION_PHASE: Joi.string()
                    .valid('soon', 'open', 'closed')
                    .default('soon'),
            }),
        }),
        ThrottlerModule.forRoot({
            throttlers: [{
                ttl: 60000,
                limit: 50,
            }],
        }),
        EventEmitterModule.forRoot(),
        PrismaModule,
        AuthModule,
        AdminModule,
        RoomingModule,
        RegistrationModule,
        ChallengeModule,
    ],
    controllers: [AppController],
    providers: [
        { provide: APP_GUARD, useClass: ThrottlerGuard },
    ],
})
export class AppModule {}
