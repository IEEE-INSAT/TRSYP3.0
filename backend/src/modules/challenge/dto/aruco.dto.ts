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
  @ApiProperty({ description: 'The word the team assembled from the ArUco clues', example: 'word' })
  @IsString()
  @Length(1, 200)
  answer!: string;
}

// ============================================================================
// RESPONSE DTOs
// ============================================================================

export class ArucoStateResponseDto {
  @ApiProperty({ description: 'Whether the ArUco challenge is open (ARUCO_OPEN)' })
  @Expose()
  open!: boolean;
}

/** What scanning a marker reveals. */
export class ArucoMarkerDto {
  @ApiProperty({ description: 'ArUco ID (DICT_4X4_50)' })
  @Expose()
  id!: number;

  @ApiProperty({ enum: ['beacon', 'indicator', 'collector'] })
  @Expose()
  kind!: 'beacon' | 'indicator' | 'collector';

  @ApiProperty({ enum: ['Garden', 'Mine'] })
  @Expose()
  game!: 'Garden' | 'Mine';

  @ApiProperty({ description: 'Beacon designation, e.g. "Red beacon" or "Indicator 2"' })
  @Expose()
  name!: string;

  @ApiPropertyOptional({ description: 'What a beacon or indicator gives (empty when not set yet)' })
  @Expose()
  clue?: string;

  @ApiPropertyOptional({ description: 'How many beacons with this ID are on the field, for beacons only' })
  @Expose()
  quantity?: number;

  @ApiPropertyOptional({ description: 'Collector number, for collectors only' })
  @Expose()
  collector?: number;
}

export class ArucoScansResponseDto {
  @ApiProperty({ description: "The signed-in user's Competition team" })
  @Expose()
  teamName!: string;

  @ApiProperty({ description: 'Distinct marker IDs the team has tried' })
  @Expose()
  used!: number;

  @ApiProperty({ description: 'Distinct marker IDs a team may try (ARUCO_SCAN_LIMIT)' })
  @Expose()
  limit!: number;

  @ApiProperty({
    type: [ArucoMarkerDto],
    description: "The team's field log: the real markers among the IDs it tried, oldest first",
  })
  @Expose()
  @Type(() => ArucoMarkerDto)
  found!: ArucoMarkerDto[];
}

export class ArucoMarkerResponseDto extends ArucoMarkerDto {
  @ApiProperty({ description: 'Distinct marker IDs the team has tried, including this one' })
  @Expose()
  scansUsed!: number;

  @ApiProperty({ description: 'Distinct marker IDs a team may try' })
  @Expose()
  scanLimit!: number;
}

export class ArucoCollectorStatusResponseDto {
  @ApiProperty({ description: 'Collector number (1 or 2)' })
  @Expose()
  collector!: number;

  @ApiProperty({ description: "The signed-in user's Competition team" })
  @Expose()
  teamName!: string;

  @ApiProperty({ description: "Whether the team has found this collector's word" })
  @Expose()
  solved!: boolean;

  @ApiProperty({ description: 'Attempts the team has used on this collector' })
  @Expose()
  attempts!: number;

  @ApiProperty({ description: 'Attempts left before this collector locks (0 once solved or lost)' })
  @Expose()
  attemptsLeft!: number;
}

export class ArucoSubmitResponseDto extends ArucoCollectorStatusResponseDto {
  @ApiProperty({ description: 'Whether the just-submitted answer was correct' })
  @Expose()
  correct!: boolean;
}
