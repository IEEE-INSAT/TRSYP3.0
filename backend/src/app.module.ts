import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { PrismaModule } from './prisma/prisma.module';
import { RegistrationModule } from './modules/registration/registration.module';

@Module({
  imports: [
    // Load environment variables globally
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Event emitter for domain events
    EventEmitterModule.forRoot(),

    // Database
    PrismaModule,

    // Feature modules
    RegistrationModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
