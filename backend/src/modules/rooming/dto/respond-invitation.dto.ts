import { z } from 'zod';
import { IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export const RespondInvitationSchema = z.object({
  accept: z.boolean(),
});

export type RespondInvitationInput = z.infer<typeof RespondInvitationSchema>;

export class RespondInvitationDto {
  @ApiProperty({
    description: 'Whether to accept or reject the invitation',
    example: true,
  })
  @IsBoolean()
  accept!: boolean;
}
