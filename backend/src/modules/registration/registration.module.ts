import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { RegistrationService } from './service';
import { RegistrationController } from './controller';

/**
 * Registration module handles participant registration, profile management,
 * and visa application workflows.
 *
 * Exports RegistrationService for use by other modules (Payment, Rooming).
 */
@Module({
  imports: [PrismaModule],
  controllers: [RegistrationController],
  providers: [RegistrationService],
  exports: [RegistrationService],
})
export class RegistrationModule {}
