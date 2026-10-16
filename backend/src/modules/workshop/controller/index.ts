import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard } from '../../../common/guards';
import { CurrentUser, Roles } from '../../../common/decorators';
import { ZodValidationPipe } from '../../../common/pipes';
import { WorkshopService, WorkshopOverview, WorkshopAdminOverview } from '../service';
import { WorkshopIdSchema } from '../dto';

/**
 * Day-3 workshop booking. Every write answers with the refreshed overview so
 * the dashboard shows the seat counts the server just settled on.
 */
@ApiTags('Workshops')
@ApiBearerAuth('JWT-auth')
@Controller('workshops')
@UseGuards(JwtAuthGuard)
export class WorkshopController {
  constructor(private readonly workshopService: WorkshopService) {}

  @Get()
  @ApiOperation({ summary: 'Workshops, seats left, the caller\'s bookings and the booking phase' })
  @ApiResponse({ status: 200, description: 'Overview' })
  @ApiResponse({ status: 404, description: 'Participant profile not found' })
  getOverview(@CurrentUser('sub') userId: string): Promise<WorkshopOverview> {
    return this.workshopService.getOverview(userId);
  }

  @Post(':workshopId/booking')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Book a seat. Final - no cancelling or moving' })
  @ApiResponse({ status: 200, description: 'Booked - refreshed overview' })
  @ApiResponse({ status: 403, description: 'Booking closed, not paid, banned, or no seat left' })
  @ApiResponse({ status: 404, description: 'Participant or workshop not found' })
  @ApiResponse({ status: 409, description: 'Already has a seat in this session' })
  async book(
    @CurrentUser('sub') userId: string,
    @Param('workshopId', new ZodValidationPipe(WorkshopIdSchema)) workshopId: string,
  ): Promise<WorkshopOverview> {
    await this.workshopService.book(userId, workshopId);
    return this.workshopService.getOverview(userId);
  }

  // ============================================================================
  // ADMIN ROUTES
  // ============================================================================

  @Get('admin')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: '[Admin] Attendance lists, and each pitching team\'s workshop attendance and SB penalty' })
  @ApiResponse({ status: 200, description: 'Rosters' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin only' })
  getAdminOverview(): Promise<WorkshopAdminOverview> {
    return this.workshopService.getAdminOverview();
  }
}
