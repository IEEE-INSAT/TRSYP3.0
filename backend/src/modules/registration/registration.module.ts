import { Module } from '@nestjs/common';
import { RegistrationService } from './service';
import { RegistrationController } from './controller';

/**
 * Registration module handles participant registration, profile management,
 * and visa application workflows.
 *
 * Exports RegistrationService for use by other modules (Payment, Rooming).
 */
@Module({
  controllers: [RegistrationController],
  providers: [RegistrationService],
  exports: [RegistrationService],
})
export class RegistrationModule {}
