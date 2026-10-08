import { Controller, Get, Post, Body, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { plainToInstance } from 'class-transformer';
import { ChallengeService } from '../service';
import {
  SubmitArucoAnswerDto,
  SubmitArucoAnswerSchema,
  ArucoStatusResponseDto,
  ArucoSubmitResponseDto,
} from '../dto';
import { ZodValidationPipe } from '../../../common/pipes';
import { JwtAuthGuard } from '../../../common/guards';
import { CurrentUser } from '../../../common/decorators';

/**
 * ArUco challenge controller.
 * The clues behind markers 0-3 are public and live in the frontend; only the
 * collector (marker 4) talks to the backend, and only for signed-in accounts,
 * each of which gets a fixed number of attempts.
 */
@ApiTags('Challenge')
@ApiBearerAuth()
@Controller('challenge/aruco')
@UseGuards(JwtAuthGuard)
export class ChallengeController {
  constructor(private readonly challengeService: ChallengeService) {}

  @Get('status')
  @ApiOperation({ summary: "The signed-in account's progress on the collector" })
  @ApiResponse({ status: 200, type: ArucoStatusResponseDto })
  @ApiResponse({ status: 401, description: 'Not signed in' })
  async status(@CurrentUser('sub') userId: string): Promise<ArucoStatusResponseDto> {
    const result = await this.challengeService.status(userId);
    return plainToInstance(ArucoStatusResponseDto, result, { excludeExtraneousValues: true });
  }

  @Post('submit')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Submit the word assembled from the ArUco clues' })
  @ApiResponse({ status: 200, type: ArucoSubmitResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid answer' })
  @ApiResponse({ status: 401, description: 'Not signed in' })
  async submit(
    @CurrentUser('sub') userId: string,
    @Body(new ZodValidationPipe(SubmitArucoAnswerSchema)) dto: SubmitArucoAnswerDto,
  ): Promise<ArucoSubmitResponseDto> {
    const result = await this.challengeService.submit(userId, dto.answer);
    return plainToInstance(ArucoSubmitResponseDto, result, { excludeExtraneousValues: true });
  }
}
