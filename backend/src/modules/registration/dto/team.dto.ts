import { z } from 'zod';
import { IsString, IsInt, Min, Max, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

// ============================================================================
// CREATE TEAM
// ============================================================================

export const CreateTeamSchema = z.object({
  name: z
    .string()
    .min(2, { message: 'Team name must be at least 2 characters' })
    .max(50, { message: 'Team name must be at most 50 characters' })
    .trim(),
  size: z
    .number()
    .int({ message: 'Team size must be an integer' })
    .min(1, { message: 'Team size must be at least 1' })
    .max(6, { message: 'Team size must be at most 6' }),
});

export type CreateTeamInput = z.infer<typeof CreateTeamSchema>;

export class CreateTeamDto {
  @ApiProperty({
    description: 'Team name',
    example: 'RoboTeam Alpha',
    minLength: 2,
    maxLength: 50,
  })
  @IsString()
  name!: string;

  @ApiProperty({
    description: 'Maximum number of members (including the leader). Use 1 for solo.',
    example: 4,
    minimum: 1,
    maximum: 6,
  })
  @IsInt({ message: 'Team size must be an integer' })
  @Min(1, { message: 'Team size must be at least 1' })
  @Max(6, { message: 'Team size must be at most 6' })
  size!: number;
}

// ============================================================================
// JOIN TEAM
// ============================================================================

export const JoinTeamSchema = z.object({
  code: z
    .string()
    .length(6, { message: 'Team code must be exactly 6 characters' })
    .toUpperCase(),
});

export type JoinTeamInput = z.infer<typeof JoinTeamSchema>;

export class JoinTeamDto {
  @ApiProperty({
    description: 'The 6-character team code shared by the team leader',
    example: 'A3KX9Z',
    minLength: 6,
    maxLength: 6,
  })
  @IsString()
  @Length(6, 6, { message: 'Team code must be exactly 6 characters' })
  code!: string;
}

// ============================================================================
// RESPONSE DTOs
// ============================================================================

export class TeamMemberResponseDto {
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

export class TeamResponseDto {
  @ApiProperty({ description: 'Team ID', format: 'uuid' })
  @Expose()
  id!: string;

  @ApiProperty({ description: '6-character join code (only visible to the leader)' })
  @Expose()
  code!: string;

  @ApiProperty({ description: 'Team name' })
  @Expose()
  name!: string;

  @ApiProperty({ description: 'Maximum team capacity' })
  @Expose()
  size!: number;

  @ApiProperty({ description: 'Leader participant ID', format: 'uuid' })
  @Expose()
  leaderId!: string;

  @ApiProperty({ description: 'Current member count' })
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

  @ApiProperty({ description: 'Team members', type: [TeamMemberResponseDto] })
  @Expose()
  @Type(() => TeamMemberResponseDto)
  members!: TeamMemberResponseDto[];
}

/**
 * Response DTO for admin team list operations with pagination
 */
export class TeamListResponseDto {
  @ApiProperty({ description: 'List of teams', type: [TeamResponseDto] })
  @Expose()
  @Type(() => TeamResponseDto)
  data!: TeamResponseDto[];

  @ApiProperty({ description: 'Total number of teams matching filters' })
  @Expose()
  total!: number;

  @ApiProperty({ description: 'Number of items skipped' })
  @Expose()
  skip!: number;

  @ApiProperty({ description: 'Number of items returned' })
  @Expose()
  take!: number;
}