import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { resolve } from 'node:path';
import * as Joi from 'joi';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { AdminModule } from './modules/admin/admin.module';
import { RoomingModule } from './modules/rooming/rooming.module';
import { RegistrationModule } from './modules/registration/registration.module';
import { ChallengeModule } from './modules/challenge/challenge.module';
import { PaymentModule } from './modules/payment/payment.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            // npm runs backend scripts with backend/ as the working directory,
            // while the production container starts from the repository root.
            // Support both without maintaining a second environment file.
            envFilePath: [
                resolve(process.cwd(), '.env'),
                resolve(process.cwd(), '../.env'),
            ],
            validationSchema: Joi.object({
                DATABASE_URL: Joi.string().required(),
                SUPABASE_URL: Joi.string().uri().required(),
                SUPABASE_SERVICE_ROLE_KEY: Joi.string().required(),
                SUPABASE_JWT_SECRET: Joi.string().optional(),
                FRONTEND_URL: Joi.string().uri().required(),
                CORS_ORIGINS: Joi.string().optional(),
                COMPETITION_REGISTRATION_PHASE: Joi.string()
                    .valid('soon', 'open', 'closed')
                    .default('closed'),
                CHALLENGE_REGISTRATION_PHASE: Joi.string()
                    .valid('soon', 'open', 'closed')
                    .default('closed'),
                // The one payment-proof switch. Read per request, and
                // reported to the UI by GET /payment/proof/me, so opening
                // submissions needs no frontend rebuild.
                PAYMENT_PROOF_OPEN: Joi.string()
                    .valid('true', 'false')
                    .default('false'),
                FABLAB_REGISTRATION_PHASE: Joi.string()
                    .valid('soon', 'open', 'closed')
                    .default('closed'),
                FABLAB_SUBMISSION_PHASE: Joi.string()
                    .valid('soon', 'open', 'closed')
                    .default('closed'),
                // Creating/joining rooms. Managing an existing room stays
                // available after it closes, like teams.
                ROOMING_PHASE: Joi.string()
                    .valid('soon', 'open', 'closed')
                    .default('closed'),
                // IEEE GetMemberStatus credentials, shared with the admin
                // portal. Without them no membership checks run.
                IEEE_API_BASE_URL: Joi.string().uri().optional(),
                IEEE_CLIENT_ID: Joi.string().optional(),
                IEEE_CLIENT_SECRET: Joi.string().optional(),
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
        PaymentModule,
    ],
    controllers: [AppController],
    providers: [
        { provide: APP_GUARD, useClass: ThrottlerGuard },
    ],
})
export class AppModule {}
