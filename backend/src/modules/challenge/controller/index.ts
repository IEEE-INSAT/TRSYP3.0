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
  ArucoMarkerResponseDto,
  ArucoCollectorStatusResponseDto,
  ArucoSubmitResponseDto,
} from '../dto';
import { ZodValidationPipe } from '../../../common/pipes';
import { JwtAuthGuard } from '../../../common/guards';
import { CurrentUser } from '../../../common/decorators';

/**
 * ArUco challenge controller (Garden and Mine games).
 * Everything but `state` is refused while ARUCO_OPEN is not "true". Marker
 * lookups are public; the collectors need a signed-in member of a
 * Competition team, and attempts are counted per team.
 */
@ApiTags('Challenge')
@Controller('challenge/aruco')
export class ChallengeController {
  constructor(private readonly challengeService: ChallengeService) {}

  @Get('state')
  @ApiOperation({ summary: 'Whether the ArUco challenge is open' })
  @ApiResponse({ status: 200, type: ArucoStateResponseDto })
  state(): ArucoStateResponseDto {
    return plainToInstance(ArucoStateResponseDto, this.challengeService.state(), {
      excludeExtraneousValues: true,
    });
  }

  @Get('markers/:id')
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @ApiOperation({ summary: 'What scanning a marker reveals' })
  @ApiResponse({ status: 200, type: ArucoMarkerResponseDto })
  @ApiResponse({ status: 403, description: 'Challenge closed' })
  @ApiResponse({ status: 404, description: 'No marker with that ID' })
  marker(@Param('id', ParseIntPipe) id: number): ArucoMarkerResponseDto {
    return plainToInstance(ArucoMarkerResponseDto, this.challengeService.marker(id), {
      excludeExtraneousValues: true,
    });
  }

  @Get('collectors/:collector/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "The signed-in user's team progress on a collector" })
  @ApiResponse({ status: 200, type: ArucoCollectorStatusResponseDto })
  @ApiResponse({ status: 401, description: 'Not signed in' })
  @ApiResponse({ status: 403, description: 'Challenge closed, or not in a Competition team' })
  async collectorStatus(
    @CurrentUser('sub') userId: string,
    @Param('collector', ParseIntPipe) collector: number,
  ): Promise<ArucoCollectorStatusResponseDto> {
    const result = await this.challengeService.collectorStatus(userId, collector);
    return plainToInstance(ArucoCollectorStatusResponseDto, result, { excludeExtraneousValues: true });
  }

  @Post('collectors/:collector/submit')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: "Submit the team's word for a collector" })
  @ApiResponse({ status: 200, type: ArucoSubmitResponseDto })
  @ApiResponse({ status: 401, description: 'Not signed in' })
  @ApiResponse({ status: 403, description: 'Challenge closed, or not in a Competition team' })
  @ApiResponse({ status: 503, description: 'Collector word not configured' })
  async submit(
    @CurrentUser('sub') userId: string,
    @Param('collector', ParseIntPipe) collector: number,
    @Body(new ZodValidationPipe(SubmitArucoAnswerSchema)) dto: SubmitArucoAnswerDto,
  ): Promise<ArucoSubmitResponseDto> {
    const result = await this.challengeService.submit(userId, collector, dto.answer);
    return plainToInstance(ArucoSubmitResponseDto, result, { excludeExtraneousValues: true });
  }
}
