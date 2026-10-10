import { z } from 'zod';
import { IsString, Length } from 'class-validator';
import { Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

// ============================================================================
// JOIN ROOM
// ============================================================================

export const JoinRoomSchema = z.object({
  code: z
    .string()
    .length(6, { message: 'Room code must be exactly 6 characters' })
    .toUpperCase(),
});

export type JoinRoomInput = z.infer<typeof JoinRoomSchema>;

export class JoinRoomDto {
  @ApiProperty({
    description: 'The 6-character room code shared by the room owner',
    example: 'A3KX9Z',
    minLength: 6,
    maxLength: 6,
  })
  @IsString()
  @Length(6, 6, { message: 'Room code must be exactly 6 characters' })
  code!: string;
}

// ============================================================================
// RESPONSE DTOs
// ============================================================================

export class RoomMemberResponseDto {
  @ApiProperty({ description: 'Participant ID', format: 'uuid' })
  @Expose()
  id!: string;

  @ApiProperty({ description: 'First name' })
  @Expose()
  name!: string;

  @ApiProperty({ description: 'Last name' })
  @Expose()
  lastName!: string;

  @ApiProperty({ description: 'Email address' })
  @Expose()
  email!: string;
}

export class RoomResponseDto {
  @ApiProperty({ description: 'Room ID', format: 'uuid' })
  @Expose()
  id!: string;

  @ApiProperty({ description: '6-character join code (shown to the owner)' })
  @Expose()
  code!: string;

  @ApiProperty({ description: 'Gender of both occupants', enum: ['male', 'female'] })
  @Expose()
  gender!: string;

  @ApiProperty({ description: 'Owner participant ID', format: 'uuid' })
  @Expose()
  ownerId!: string;

  @ApiProperty({ description: 'Maximum occupants - every room is a double', example: 2 })
  @Expose()
  capacity!: number;

  @ApiProperty({ description: 'Current occupant count' })
  @Expose()
  memberCount!: number;

  @ApiProperty({ description: 'Available spots remaining' })
  @Expose()
  spotsLeft!: number;

  @ApiProperty({ description: 'Creation timestamp', format: 'date-time' })
  @Expose()
  createdAt!: Date;

  @ApiProperty({ description: 'Last update timestamp', format: 'date-time' })
  @Expose()
  updatedAt!: Date;

  @ApiProperty({ description: 'Occupants, owner first', type: [RoomMemberResponseDto] })
  @Expose()
  @Type(() => RoomMemberResponseDto)
  members!: RoomMemberResponseDto[];
}

/** The caller's room, `null` when they are not in one - no 404 to handle. */
export class MyRoomResponseDto {
  @ApiProperty({ description: 'The caller\'s room', type: RoomResponseDto, nullable: true })
  @Expose()
  @Type(() => RoomResponseDto)
  room!: RoomResponseDto | null;
}

/**
 * Response DTO for admin room list operations with pagination
 */
export class RoomListResponseDto {
  @ApiProperty({ description: 'List of rooms', type: [RoomResponseDto] })
  @Expose()
  @Type(() => RoomResponseDto)
  data!: RoomResponseDto[];

  @ApiProperty({ description: 'Total number of rooms matching filters' })
  @Expose()
  total!: number;

  @ApiProperty({ description: 'Number of items skipped' })
  @Expose()
  skip!: number;

  @ApiProperty({ description: 'Number of items returned' })
  @Expose()
  take!: number;
}
