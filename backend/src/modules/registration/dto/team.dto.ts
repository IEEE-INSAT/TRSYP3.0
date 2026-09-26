import { z } from 'zod';
import { IsString, IsInt, Min, Max, Length, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { FablabAxis, TeamActivity } from '@prisma/client';

/**
 * Which event a team belongs to. Omitting it anywhere in the API means
 * `COMPETITION`, so clients written before the technical challenge existed keep
 * working unchanged.
 */
export const DEFAULT_TEAM_ACTIVITY = TeamActivity.COMPETITION;

export const ACTIVITY_ENUM_MESSAGE = 'activity must be COMPETITION, CHALLENGE or FABLAB';

/** Human-readable name of each activity, used in validation messages. */
export const TEAM_ACTIVITY_LABELS: Record<TeamActivity, string> = {
  [TeamActivity.COMPETITION]: 'Competition',
  [TeamActivity.CHALLENGE]: 'Technical challenge',
  [TeamActivity.FABLAB]: 'Fablab challenge',
};

/** Human-readable name of each Fablab axis. */
export const FABLAB_AXIS_LABELS: Record<FablabAxis, string> = {
  [FablabAxis.SAMPLE_PREPARATION]: 'Automated Sample Preparation',
  [FablabAxis.WEIGHING_DOSING]: 'Automated Weighing & Dosing Station',
};

const AXIS_ENUM_MESSAGE = 'axis must be SAMPLE_PREPARATION or WEIGHING_DOSING';

export const TeamActivitySchema = z
  .nativeEnum(TeamActivity)
  .default(DEFAULT_TEAM_ACTIVITY);

// ============================================================================
// ACTIVITY SELECTOR (query string)
// ============================================================================

/** `?activity=COMPETITION|CHALLENGE|FABLAB` for the read/leave/disband routes. */
export class TeamActivityQueryDto {
  @ApiPropertyOptional({
    description: 'Which event the team belongs to. Defaults to COMPETITION.',
    enum: TeamActivity,
    default: DEFAULT_TEAM_ACTIVITY,
  })
  @IsOptional()
  @IsEnum(TeamActivity, { message: ACTIVITY_ENUM_MESSAGE })
  activity?: TeamActivity;
}

// ============================================================================
// CREATE TEAM
// ============================================================================

/**
 * Competition teams need at least 3 members (leader + 2); technical challenge
 * and Fablab teams can be as small as a pair.
 */
const MIN_TEAM_SIZE: Record<TeamActivity, number> = {
  [TeamActivity.COMPETITION]: 3,
  [TeamActivity.CHALLENGE]: 2,
  [TeamActivity.FABLAB]: 2,
};

/** Per-activity cap, on top of the global max of 6 checked by the schema. */
const MAX_TEAM_SIZE: Record<TeamActivity, number> = {
  [TeamActivity.COMPETITION]: 6,
  [TeamActivity.CHALLENGE]: 6,
  [TeamActivity.FABLAB]: 4,
};

/** Adds an issue when `size` falls outside the activity's min/max. */
function checkTeamSize(size: number, activity: TeamActivity, ctx: z.RefinementCtx) {
  const label = TEAM_ACTIVITY_LABELS[activity];
  if (size < MIN_TEAM_SIZE[activity]) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `${label} team size must be at least ${MIN_TEAM_SIZE[activity]}`,
      path: ['size'],
    });
  } else if (size > MAX_TEAM_SIZE[activity]) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `${label} team size must be at most ${MAX_TEAM_SIZE[activity]}`,
      path: ['size'],
    });
  }
}

const TeamFieldsSchema = z.object({
  name: z
    .string()
    .min(2, { message: 'Team name must be at least 2 characters' })
    .max(50, { message: 'Team name must be at most 50 characters' })
    .trim(),
  size: z
    .number()
    .int({ message: 'Team size must be an integer' })
    .min(2, { message: 'Team size must be at least 2' })
    .max(6, { message: 'Team size must be at most 6' }),
  activity: TeamActivitySchema,
  axis: z.nativeEnum(FablabAxis, { error: AXIS_ENUM_MESSAGE }).optional(),
});

/** An axis is required on a Fablab team and meaningless on any other. */
function checkAxis(axis: FablabAxis | undefined, activity: TeamActivity, required: boolean, ctx: z.RefinementCtx) {
  if (activity === TeamActivity.FABLAB) {
    if (required && axis === undefined) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Choose an axis for your Fablab team', path: ['axis'] });
    }
  } else if (axis !== undefined) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Only Fablab teams have an axis', path: ['axis'] });
  }
}

export const CreateTeamSchema = TeamFieldsSchema.superRefine((data, ctx) => {
  checkTeamSize(data.size, data.activity, ctx);
  checkAxis(data.axis, data.activity, true, ctx);
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
  @Min(2, { message: 'Team size must be at least 2' })
  @Max(6, { message: 'Team size must be at most 6' })
  size!: number;

  @ApiPropertyOptional({
    description: 'Which event this team competes in. Defaults to COMPETITION.',
    enum: TeamActivity,
    default: DEFAULT_TEAM_ACTIVITY,
  })
  @IsOptional()
  @IsEnum(TeamActivity, { message: ACTIVITY_ENUM_MESSAGE })
  activity?: TeamActivity;

  @ApiPropertyOptional({
    description: 'Fablab axis - required for FABLAB teams, rejected for any other activity.',
    enum: FablabAxis,
  })
  @IsOptional()
  @IsEnum(FablabAxis, { message: AXIS_ENUM_MESSAGE })
  axis?: FablabAxis;
}

// ============================================================================
// UPDATE TEAM
// ============================================================================

export const UpdateTeamSchema = TeamFieldsSchema.partial().superRefine((data, ctx) => {
  const activity = data.activity ?? DEFAULT_TEAM_ACTIVITY;
  if (data.size !== undefined) checkTeamSize(data.size, activity, ctx);
  checkAxis(data.axis, activity, false, ctx);
});

export type UpdateTeamInput = z.infer<typeof UpdateTeamSchema>;

export class UpdateTeamDto {
  @ApiProperty({
    description: 'Team name (optional)',
    example: 'RoboTeam Beta',
    minLength: 2,
    maxLength: 50,
    required: false,
  })
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'Maximum number of members (including the leader). (optional)',
    example: 5,
    minimum: 1,
    maximum: 6,
    required: false,
  })
  @IsInt({ message: 'Team size must be an integer' })
  @Min(2, { message: 'Team size must be at least 2' })
  @Max(6, { message: 'Team size must be at most 6' })
  size?: number;

  @ApiPropertyOptional({
    description: 'Which of your teams to update. Defaults to COMPETITION.',
    enum: TeamActivity,
    default: DEFAULT_TEAM_ACTIVITY,
  })
  @IsOptional()
  @IsEnum(TeamActivity, { message: ACTIVITY_ENUM_MESSAGE })
  activity?: TeamActivity;

  @ApiPropertyOptional({
    description: 'Fablab axis - required for FABLAB teams, rejected for any other activity.',
    enum: FablabAxis,
  })
  @IsOptional()
  @IsEnum(FablabAxis, { message: AXIS_ENUM_MESSAGE })
  axis?: FablabAxis;
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
// FABLAB SUBMISSION
// ============================================================================

/** True when the URL's host is drive.google.com. */
export function isGoogleDriveUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname.toLowerCase() === 'drive.google.com';
  } catch {
    return false;
  }
}

export const FablabSubmissionSchema = z.object({
  url: z
    .string({ error: 'Drive folder link is required' })
    .trim()
    .min(1, { message: 'Drive folder link is required', abort: true })
    .max(500, { message: 'Drive folder link is too long', abort: true })
    .refine(isGoogleDriveUrl, {
      message: 'Paste a Google Drive link (https://drive.google.com/...)',
    }),
});

export type FablabSubmissionInput = z.infer<typeof FablabSubmissionSchema>;

export class FablabSubmissionDto {
  @ApiProperty({
    description: 'Google Drive folder link holding the concept dossier, shared as "Anyone with the link can view"',
    example: 'https://drive.google.com/drive/folders/1AbCdEf',
    maxLength: 500,
  })
  @IsString({ message: 'Drive folder link is required' })
  url!: string;
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

  @ApiProperty({ description: 'Event this team competes in', enum: TeamActivity })
  @Expose()
  activity!: TeamActivity;

  @ApiProperty({ description: 'Fablab axis (FABLAB teams only)', enum: FablabAxis, nullable: true })
  @Expose()
  axis!: FablabAxis | null;

  @ApiProperty({ description: 'Submitted Google Drive folder (FABLAB teams only)', nullable: true })
  @Expose()
  submissionUrl!: string | null;

  @ApiProperty({ description: 'When the Drive folder was last submitted', nullable: true })
  @Expose()
  submittedAt!: Date | null;

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
 * Every team the caller belongs to, one slot per activity. A `null` slot means
 * they have not joined that event yet.
 */
export class MyTeamsResponseDto {
  @ApiProperty({ description: 'The caller\'s competition team', type: TeamResponseDto, nullable: true })
  @Expose()
  @Type(() => TeamResponseDto)
  competition!: TeamResponseDto | null;

  @ApiProperty({ description: 'The caller\'s technical challenge team', type: TeamResponseDto, nullable: true })
  @Expose()
  @Type(() => TeamResponseDto)
  challenge!: TeamResponseDto | null;

  @ApiProperty({ description: 'The caller\'s Fablab challenge team', type: TeamResponseDto, nullable: true })
  @Expose()
  @Type(() => TeamResponseDto)
  fablab!: TeamResponseDto | null;
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