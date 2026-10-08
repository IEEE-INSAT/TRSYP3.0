import { z } from 'zod';
import { IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

// ============================================================================
// SUBMIT ANSWER (collector, marker 4)
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

export class ArucoStatusResponseDto {
  @ApiProperty({ description: 'Whether this account has guessed the word' })
  @Expose()
  solved!: boolean;

  @ApiProperty({ description: 'Number of submitted attempts so far' })
  @Expose()
  attempts!: number;

  @ApiProperty({ description: 'Attempts left before the collector locks (0 once solved or lost)' })
  @Expose()
  attemptsLeft!: number;
}

export class ArucoSubmitResponseDto extends ArucoStatusResponseDto {
  @ApiProperty({ description: 'Whether the just-submitted answer was correct' })
  @Expose()
  correct!: boolean;
}
