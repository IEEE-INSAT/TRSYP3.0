import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { RegistrationModule } from '../registration/registration.module';
import { AdminModule } from '../admin/admin.module';
import { PaymentService } from './service';
import { ProofStorageService } from './service/storage.service';
import { PaymentController } from './controller';

/**
 * Payment module: proof submission, the admin review queue, and the receipts
 * behind both.
 *
 * Depends on RegistrationModule for two things it deliberately does not own -
 * pricing a participant, and flipping `Participant.paid` through
 * `markAsPaid`, which stays the single place that settles a registration -
 * and on AdminModule for `AdminGuard`.
 *
 * `AdminGuard` rather than `RolesGuard`: admin-ness here is a row in the
 * `admins` table, not a JWT claim. Supabase issues `role: "authenticated"` to
 * every signed-in user and never `"admin"`, so the claim check rejected real
 * admins with "Insufficient permissions". Confirmed against a live admin
 * account. `AdminController` already guards itself this way.
 */
@Module({
  imports: [PrismaModule, RegistrationModule, AdminModule],
  controllers: [PaymentController],
  providers: [PaymentService, ProofStorageService],
  exports: [PaymentService],
})
export class PaymentModule {}
