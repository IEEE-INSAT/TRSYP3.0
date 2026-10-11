import { z } from 'zod';
import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentType } from '@prisma/client';

/**
 * Body of `PATCH /payment/admin/proofs/:id/type`: how the money actually
 * arrived, as the treasurer confirms it.
 */
export const SetPaymentTypeSchema = z.object({
  paymentType: z.nativeEnum(PaymentType, {
    message: 'paymentType must be BANK_TRANSFER, INTERNAL_FUND or CASH',
  }),
});

export class SetPaymentTypeDto {
  // Both validators on purpose - see RejectProofDto.
  @ApiProperty({ description: 'How the payment arrived', enum: PaymentType })
  @IsEnum(PaymentType)
  paymentType!: PaymentType;
}
