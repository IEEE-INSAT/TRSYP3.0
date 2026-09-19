import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { RegistrationModule } from '../registration/registration.module';
import { PaymentService } from './service';
import { ProofStorageService } from './service/storage.service';
import { PaymentController } from './controller';

/**
 * Payment module: proof submission, the admin review queue, and the receipts
 * behind both.
 *
 * Depends on RegistrationModule for two things it deliberately does not own -
 * pricing a participant, and flipping `Participant.paid` through
 * `markAsPaid`, which stays the single place that settles a registration.
 */
@Module({
  imports: [PrismaModule, RegistrationModule],
  controllers: [PaymentController],
  providers: [PaymentService, ProofStorageService],
  exports: [PaymentService],
})
export class PaymentModule {}
