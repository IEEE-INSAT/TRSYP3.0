import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { plainToInstance } from 'class-transformer';
import { ChallengeService } from '../service';
import {
  SubmitArucoAnswerDto,
  SubmitArucoAnswerSchema,
  ArucoStateResponseDto,
  ArucoScansResponseDto,
  ArucoMarkerResponseDto,
  ArucoWordStatusResponseDto,
  ArucoWordSubmitResponseDto,
} from '../dto';
import { ZodValidationPipe } from '../../../common/pipes';
import { JwtAuthGuard } from '../../../common/guards';
import { CurrentUser } from '../../../common/decorators';
import { playerTracker } from '../player-tracker';

/**
 * ArUco challenge controller (the Garden games).
 * Everything but `state` is refused while no round is live, and needs a
 * signed-in member of a Competition team the live round was started for.
 * Marker tries (distinct IDs, ARUCO_SCAN_LIMIT) and word attempts are counted
 * per team per round.
 *
 * Rate limits count per signed-in player (playerTracker), since the teams
 * share the venue's Wi-Fi: 60 requests a minute each, the field log's 20s
 * refresh included, with tighter limits on scans and words below.
 */
@ApiTags('Challenge')
@Controller('challenge/aruco')
@Throttle({ default: { limit: 60, ttl: 60_000, getTracker: playerTracker } })
export class ChallengeController {
  constructor(private readonly challengeService: ChallengeService) {}

  @Get('state')
  @ApiOperation({ summary: 'Whether a round is live' })
  @ApiResponse({ status: 200, type: ArucoStateResponseDto })
  async state(): Promise<ArucoStateResponseDto> {
    return plainToInstance(ArucoStateResponseDto, await this.challengeService.state(), {
      excludeExtraneousValues: true,
    });
  }

  @Get('scans')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "The user's team tries and field log in the live round" })
  @ApiResponse({ status: 200, type: ArucoScansResponseDto })
  @ApiResponse({ status: 401, description: 'Not signed in' })
  @ApiResponse({ status: 403, description: 'No live round, not in a Competition team, or team not playing it' })
  async scans(@CurrentUser('sub') userId: string): Promise<ArucoScansResponseDto> {
    const result = await this.challengeService.scans(userId);
    return plainToInstance(ArucoScansResponseDto, result, { excludeExtraneousValues: true });
  }

  @Get('markers/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Throttle({ default: { limit: 30, ttl: 60_000, getTracker: playerTracker } })
  @ApiOperation({ summary: 'What scanning a marker reveals (uses one of the team’s tries for a new ID)' })
  @ApiResponse({ status: 200, type: ArucoMarkerResponseDto })
  @ApiResponse({ status: 401, description: 'Not signed in' })
  @ApiResponse({ status: 403, description: 'No live round, team not playing it, or tries used up' })
  @ApiResponse({ status: 404, description: 'No marker with that ID (the try still counts)' })
  async marker(
    @CurrentUser('sub') userId: string,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ArucoMarkerResponseDto> {
    const result = await this.challengeService.marker(userId, id);
    return plainToInstance(ArucoMarkerResponseDto, result, { excludeExtraneousValues: true });
  }

  @Get('word')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "The signed-in user's team word attempts in the live round" })
  @ApiResponse({ status: 200, type: ArucoWordStatusResponseDto })
  @ApiResponse({ status: 401, description: 'Not signed in' })
  @ApiResponse({ status: 403, description: 'No live round, not in a Competition team, or team not playing it' })
  async wordStatus(@CurrentUser('sub') userId: string): Promise<ArucoWordStatusResponseDto> {
    const result = await this.challengeService.wordStatus(userId);
    return plainToInstance(ArucoWordStatusResponseDto, result, { excludeExtraneousValues: true });
  }

  @Post('word')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000, getTracker: playerTracker } })
  @ApiOperation({ summary: "Submit the team's word for the live round (markers 6 and 47)" })
  @ApiResponse({ status: 200, type: ArucoWordSubmitResponseDto })
  @ApiResponse({ status: 401, description: 'Not signed in' })
  @ApiResponse({ status: 403, description: 'No live round, not in a Competition team, or team not playing it' })
  async submitWord(
    @CurrentUser('sub') userId: string,
    @Body(new ZodValidationPipe(SubmitArucoAnswerSchema)) dto: SubmitArucoAnswerDto,
  ): Promise<ArucoWordSubmitResponseDto> {
    const result = await this.challengeService.submitWord(userId, dto.answer);
    return plainToInstance(ArucoWordSubmitResponseDto, result, { excludeExtraneousValues: true });
  }
}
