import { z } from 'zod';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethod } from '@prisma/client';

/**
 * Body of `POST /payment/proof`.
 *
 * The request is multipart, so this validates the text part only - the file
 * itself is checked in the service, where its absence is legal for a cash
 * payment. Nothing here carries an amount: the fee is derived server-side
 * from the participant's own record, never taken from the client.
 */
export const SubmitProofSchema = z.object({
  method: z.nativeEnum(PaymentMethod, {
    message: 'method must be BANK_TRANSFER, D17, FLOUCI or CASH',
  }),
});

export class SubmitProofDto {
  @ApiProperty({
    description: 'How the participant paid',
    enum: PaymentMethod,
  })
  method!: PaymentMethod;
}
