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
  ArucoCollectorStatusResponseDto,
  ArucoSubmitResponseDto,
} from '../dto';
import { ZodValidationPipe } from '../../../common/pipes';
import { JwtAuthGuard } from '../../../common/guards';
import { CurrentUser } from '../../../common/decorators';

/**
 * ArUco challenge controller (Garden and Mine games).
 * Everything but `state` is refused while ARUCO_OPEN is not "true", and
 * needs a signed-in member of a Competition team. Marker tries (distinct IDs,
 * ARUCO_SCAN_LIMIT) and collector attempts are counted per team.
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

  @Get('scans')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "How many marker IDs the user's team has tried" })
  @ApiResponse({ status: 200, type: ArucoScansResponseDto })
  @ApiResponse({ status: 401, description: 'Not signed in' })
  @ApiResponse({ status: 403, description: 'Challenge closed, or not in a Competition team' })
  async scans(@CurrentUser('sub') userId: string): Promise<ArucoScansResponseDto> {
    const result = await this.challengeService.scans(userId);
    return plainToInstance(ArucoScansResponseDto, result, { excludeExtraneousValues: true });
  }

  @Get('markers/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @ApiOperation({ summary: 'What scanning a marker reveals (uses one of the team’s tries for a new ID)' })
  @ApiResponse({ status: 200, type: ArucoMarkerResponseDto })
  @ApiResponse({ status: 401, description: 'Not signed in' })
  @ApiResponse({ status: 403, description: 'Challenge closed, not in a Competition team, or tries used up' })
  @ApiResponse({ status: 404, description: 'No marker with that ID (the try still counts)' })
  async marker(
    @CurrentUser('sub') userId: string,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ArucoMarkerResponseDto> {
    const result = await this.challengeService.marker(userId, id);
    return plainToInstance(ArucoMarkerResponseDto, result, { excludeExtraneousValues: true });
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
