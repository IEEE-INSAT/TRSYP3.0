import { z } from 'zod';
import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export const InviteParticipantSchema = z.object({
  guestId: z.string().uuid(),
});

export type InviteParticipantInput = z.infer<typeof InviteParticipantSchema>;

export class InviteParticipantDto {
  @ApiProperty({
    description: 'The UUID of the participant to invite',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  guestId!: string;
}
