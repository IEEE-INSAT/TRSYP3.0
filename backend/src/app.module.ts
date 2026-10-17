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
import { WorkshopModule } from './modules/workshop/workshop.module';
import { SmashRoomModule } from './modules/smash-room/smash-room.module';
import { EthicsModule } from './modules/ethics/ethics.module';

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
                // Distinct marker IDs a team may try per ArUco round. The
                // challenge itself opens and closes from the admin portal.
                ARUCO_SCAN_LIMIT: Joi.number().integer().min(1).default(20),
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
                // Booking/cancelling workshop seats. Read per request and
                // reported by GET /workshops, so no frontend rebuild.
                WORKSHOP_BOOKING_PHASE: Joi.string()
                    .valid('soon', 'open', 'closed')
                    .default('closed'),
                // SB points lost by a pitching team with nobody in a workshop.
                // Only reported (GET /workshops, /workshops/admin).
                WORKSHOP_SB_PENALTY: Joi.number().integer().min(0).default(5),
                // Comma-separated emails that may book without payment -
                // for testing. Their seats are real.
                WORKSHOP_TESTER_EMAILS: Joi.string().allow('').optional(),
                // Smash Room form. Read per request and reported by
                // GET /smash-room, so no frontend rebuild.
                SMASH_ROOM_PHASE: Joi.string()
                    .valid('soon', 'open', 'closed')
                    .default('closed'),
                // Key the moderators type on /ethics-control to pace the
                // Ethical Decision Test. Without it the control page refuses.
                ETHICS_MODERATOR_KEY: Joi.string().allow('').optional(),
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
        WorkshopModule,
        SmashRoomModule,
        EthicsModule,
    ],
    controllers: [AppController],
    providers: [
        { provide: APP_GUARD, useClass: ThrottlerGuard },
    ],
})
export class AppModule {}
