import { Controller, Get, Post, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SmashRoomEntry } from '@prisma/client';
import { JwtAuthGuard, RolesGuard } from '../../../common/guards';
import { CurrentUser, Roles } from '../../../common/decorators';
import { ZodValidationPipe } from '../../../common/pipes';
import { SmashRoomService, SmashRoomOverview, SmashRoomAdminEntry } from '../service';
import { SubmitSmashRoomSchema, SubmitSmashRoomInput } from '../dto';

@ApiTags('Smash Room')
@ApiBearerAuth('JWT-auth')
@Controller('smash-room')
@UseGuards(JwtAuthGuard)
export class SmashRoomController {
  constructor(private readonly smashRoomService: SmashRoomService) {}

  @Get()
  @ApiOperation({ summary: 'The form phase and the caller\'s submission, if any' })
  @ApiResponse({ status: 200, description: 'Overview' })
  @ApiResponse({ status: 404, description: 'Participant profile not found' })
  getOverview(@CurrentUser('sub') userId: string): Promise<SmashRoomOverview> {
    return this.smashRoomService.getOverview(userId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit the Smash Room form. Final - one per participant' })
  @ApiResponse({ status: 201, description: 'Submitted' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 403, description: 'Closed, banned or not paid' })
  @ApiResponse({ status: 409, description: 'Already submitted' })
  submit(
    @CurrentUser('sub') userId: string,
    @Body(new ZodValidationPipe(SubmitSmashRoomSchema)) dto: SubmitSmashRoomInput,
  ): Promise<SmashRoomEntry> {
    return this.smashRoomService.submit(userId, dto);
  }

  @Get('admin')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: '[Admin] Every Smash Room submission' })
  @ApiResponse({ status: 200, description: 'Submissions' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin only' })
  listAll(): Promise<SmashRoomAdminEntry[]> {
    return this.smashRoomService.listAll();
  }
}
