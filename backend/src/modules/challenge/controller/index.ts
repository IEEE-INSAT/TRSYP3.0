import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { ChallengeService } from '../service';
import {
  AccessRiddleDto,
  AccessRiddleSchema,
  SubmitAnswerDto,
  SubmitAnswerSchema,
  RiddleAccessResponseDto,
  RiddleSubmitResponseDto,
} from '../dto';
import { ZodValidationPipe } from '../../../common/pipes';

/**
 * Public riddle-challenge controller.
 * No auth guard: a valid team is identified purely by the code itself,
 * which is handed out offline (see riddle-code.util.ts).
 */
@ApiTags('Challenge')
@Controller('challenge')
export class ChallengeController {
  constructor(private readonly challengeService: ChallengeService) {}

  /**
   * Enter a code to reveal which riddle it unlocks and the team's progress on it.
   */
  @Post('access')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resolve a code into its riddle question + current progress' })
  @ApiResponse({ status: 200, description: 'Code is valid', type: RiddleAccessResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid code' })
  @ApiResponse({ status: 404, description: 'Team not found for this code' })
  async access(
    @Body(new ZodValidationPipe(AccessRiddleSchema)) dto: AccessRiddleDto,
  ): Promise<RiddleAccessResponseDto> {
    const result = await this.challengeService.access(dto.code);
    return plainToInstance(RiddleAccessResponseDto, result, { excludeExtraneousValues: true });
  }

  /**
   * Submit a solution word for the riddle behind this code.
   */
  @Post('submit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit an answer for the riddle behind this code' })
  @ApiResponse({ status: 200, description: 'Answer checked', type: RiddleSubmitResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid code or answer' })
  @ApiResponse({ status: 404, description: 'Team not found for this code' })
  async submit(
    @Body(new ZodValidationPipe(SubmitAnswerSchema)) dto: SubmitAnswerDto,
  ): Promise<RiddleSubmitResponseDto> {
    const result = await this.challengeService.submit(dto.code, dto.answer);
    return plainToInstance(RiddleSubmitResponseDto, result, { excludeExtraneousValues: true });
  }
}
