import { z } from 'zod';
import { IsInt, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export const CreateRoomSchema = z.object({
  size: z.number().int().min(1).max(6),
});

export type CreateRoomInput = z.infer<typeof CreateRoomSchema>;

export class CreateRoomDto {
  @ApiProperty({
    description: 'Maximum capacity of the room (1-6)',
    example: 4,
    minimum: 1,
    maximum: 6,
  })
  @IsInt()
  @Min(1)
  @Max(6)
  size!: number;
}
