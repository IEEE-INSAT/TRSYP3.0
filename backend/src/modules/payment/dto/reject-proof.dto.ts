import { z } from 'zod';
import { IsString, Length } from 'class-validator';
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
  /**
   * The class-validator decorators are not redundant with the Zod schema
   * above: `main.ts` installs a global `ValidationPipe({ whitelist: true })`,
   * which deletes every property that carries no class-validator decorator.
   * Without them `reason` was stripped before the Zod pipe ran, and a
   * perfectly good body failed as "expected string, received undefined".
   * Every DTO in this codebase declares both for that reason.
   */
  @ApiProperty({
    description: 'Why the proof was rejected - shown to the participant',
    minLength: 5,
    maxLength: 500,
  })
  @IsString()
  @Length(5, 500)
  reason!: string;
}
