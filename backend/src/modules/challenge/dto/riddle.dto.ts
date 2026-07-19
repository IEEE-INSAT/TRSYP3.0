import { z } from 'zod';
import { IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

// ============================================================================
// ACCESS RIDDLE (enter code -> get the question)
// ============================================================================

export const AccessRiddleSchema = z.object({
  code: z.string().min(1, { message: 'Code is required' }).trim(),
});

export type AccessRiddleInput = z.infer<typeof AccessRiddleSchema>;

export class AccessRiddleDto {
  @ApiProperty({ description: 'The code handed out for this riddle', example: 'X3fQ...' })
  @IsString()
  code!: string;
}

// ============================================================================
// SUBMIT ANSWER
// ============================================================================

export const SubmitAnswerSchema = z.object({
  code: z.string().min(1, { message: 'Code is required' }).trim(),
  answer: z
    .string()
    .min(1, { message: 'Answer is required' })
    .max(200, { message: 'Answer is too long' }),
});

export type SubmitAnswerInput = z.infer<typeof SubmitAnswerSchema>;

export class SubmitAnswerDto {
  @ApiProperty({ description: 'The code handed out for this riddle', example: 'X3fQ...' })
  @IsString()
  code!: string;

  @ApiProperty({ description: 'The solution word submitted by the team', example: 'lighthouse' })
  @IsString()
  @Length(1, 200)
  answer!: string;
}

// ============================================================================
// RESPONSE DTOs
// ============================================================================

export class RiddleAccessResponseDto {
  @ApiProperty({ description: 'Which of the 3 riddles this code unlocks' })
  @Expose()
  riddleNumber!: number;

  @ApiProperty({ description: 'The riddle text' })
  @Expose()
  question!: string;

  @ApiProperty({ description: 'Whether this team has already solved this riddle' })
  @Expose()
  solved!: boolean;

  @ApiProperty({ description: 'Number of submitted attempts so far' })
  @Expose()
  attempts!: number;
}

export class RiddleSubmitResponseDto {
  @ApiProperty({ description: 'Whether the just-submitted answer was correct' })
  @Expose()
  correct!: boolean;

  @ApiProperty({ description: 'Whether this riddle is now solved (true once any correct answer lands)' })
  @Expose()
  solved!: boolean;

  @ApiProperty({ description: 'Number of submitted attempts so far, including this one' })
  @Expose()
  attempts!: number;
}
