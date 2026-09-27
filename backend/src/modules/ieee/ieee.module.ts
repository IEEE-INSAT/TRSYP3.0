import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { IeeeApiClient } from './ieee-api.client';
import { IeeeVerificationService } from './ieee-verification.service';

/**
 * Verifies participants' IEEE and RAS membership against IEEE's
 * GetMemberStatus API. Server-side only: the credentials never leave it.
 */
@Module({
  imports: [PrismaModule],
  providers: [IeeeApiClient, IeeeVerificationService],
  exports: [IeeeVerificationService],
})
export class IeeeModule {}
