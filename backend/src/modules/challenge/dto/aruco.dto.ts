import { z } from 'zod';
import { IsString, Length } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

// ============================================================================
// SUBMIT ANSWER (collectors)
// ============================================================================

export const SubmitArucoAnswerSchema = z.object({
  answer: z
    .string()
    .trim()
    .min(1, { message: 'Answer is required' })
    .max(200, { message: 'Answer is too long' }),
});

export type SubmitArucoAnswerInput = z.infer<typeof SubmitArucoAnswerSchema>;

export class SubmitArucoAnswerDto {
  @ApiProperty({ description: 'The word the team assembled from the clues (case and spaces ignored)', example: 'word' })
  @IsString()
  @Length(1, 200)
  answer!: string;
}

// ============================================================================
// RESPONSE DTOs
// ============================================================================

export class ArucoStateResponseDto {
  @ApiProperty({ description: 'Whether a round is live (started from the admin portal)' })
  @Expose()
  open!: boolean;
}

/** What scanning a marker reveals. */
export class ArucoMarkerDto {
  @ApiProperty({ description: 'ArUco ID (DICT_4X4_50)' })
  @Expose()
  id!: number;

  @ApiProperty({ enum: ['letter', 'hint', 'collector', 'path'] })
  @Expose()
  kind!: 'letter' | 'hint' | 'collector' | 'path';

  @ApiProperty({ description: '"Red beacon", "Blue beacon", "Collector" or "Mine marker"' })
  @Expose()
  name!: string;

  @ApiPropertyOptional({ description: 'The letter, the hint text, or safe | unsafe for a path; absent for a collector' })
  @Expose()
  content?: string;

  @ApiPropertyOptional({ description: 'Hints only: which of the four (1-4)' })
  @Expose()
  hint?: number;
}

export class ArucoScansResponseDto {
  @ApiProperty({ description: "The signed-in user's Competition team" })
  @Expose()
  teamName!: string;

  @ApiProperty({ description: 'Distinct marker IDs the team has tried this round' })
  @Expose()
  used!: number;

  @ApiProperty({ description: "Distinct marker IDs a team may try per round (the game's own limit, else ARUCO_SCAN_LIMIT)" })
  @Expose()
  limit!: number;

  @ApiProperty({
    type: [ArucoMarkerDto],
    description: "The team's field log: the real markers among the IDs it tried, as they showed, oldest first",
  })
  @Expose()
  @Type(() => ArucoMarkerDto)
  found!: ArucoMarkerDto[];
}

export class ArucoMarkerResponseDto extends ArucoMarkerDto {
  @ApiProperty({ description: 'Distinct marker IDs the team has tried, including this one' })
  @Expose()
  scansUsed!: number;

  @ApiProperty({ description: 'Distinct marker IDs a team may try per round' })
  @Expose()
  scanLimit!: number;
}

export class ArucoWordStatusResponseDto {
  @ApiProperty({ description: "The signed-in user's Competition team" })
  @Expose()
  teamName!: string;

  @ApiProperty({ description: "Whether the team has found this round's word" })
  @Expose()
  solved!: boolean;

  @ApiProperty({ description: 'Attempts the team has used this round' })
  @Expose()
  attempts!: number;

  @ApiProperty({ description: 'Attempts left (0 once solved or lost)' })
  @Expose()
  attemptsLeft!: number;
}

export class ArucoWordSubmitResponseDto extends ArucoWordStatusResponseDto {
  @ApiProperty({ description: 'Whether the just-submitted word was correct' })
  @Expose()
  correct!: boolean;
}
