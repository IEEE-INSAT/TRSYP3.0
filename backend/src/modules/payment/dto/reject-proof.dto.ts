import { z } from 'zod';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Body of `POST /payment/admin/proofs/:id/reject`.
 *
 * The reason is required and shown to the participant verbatim, so it has to
 * say what to fix - "unreadable screenshot", "amount does not match", and so
 * on. They can resubmit as soon as they have it.
 */
export const RejectProofSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(5, 'Give the participant a reason they can act on')
    .max(500, 'Keep the reason under 500 characters'),
});

export class RejectProofDto {
  @ApiProperty({
    description: 'Why the proof was rejected - shown to the participant',
    minLength: 5,
    maxLength: 500,
  })
  reason!: string;
}
