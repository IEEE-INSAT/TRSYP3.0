import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  ParseIntPipe,
  DefaultValuePipe,
  ParseBoolPipe,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { RegistrationService } from '../service';
import {
  RegisterLocalDto,
  RegisterLocalSchema,
  RegisterInternationalDto,
  RegisterInternationalSchema,
  UpdateProfileDto,
  UpdateProfileSchema,
  RequestVisaDto,
  RequestVisaSchema,
  RequestVisaBaseSchema,
  ParticipantResponseDto,
  ParticipantAdminResponseDto,
  VisaApplicationResponseDto,
  ParticipantListResponseDto,
  CreateTeamDto,
  CreateTeamSchema,
  UpdateTeamDto,
  UpdateTeamSchema,
  JoinTeamDto,
  JoinTeamSchema,
  TeamResponseDto,
  TeamMemberResponseDto,
  TeamListResponseDto,
} from '../dto';
import { JwtAuthGuard, RolesGuard } from '../../../common/guards';
import { CurrentUser, Roles } from '../../../common/decorators';
import { ZodValidationPipe } from '../../../common/pipes';
import { JwtPayload } from '../../../common/guards/jwt-auth.guard';

/**
 * Registration controller for participant management
 */
@ApiTags('Registration')
@ApiBearerAuth('JWT-auth')
@Controller('registration')
@UseGuards(JwtAuthGuard)
export class RegistrationController {
  constructor(private readonly registrationService: RegistrationService) { }

  // ============================================================================
  // PARTICIPANT REGISTRATION ROUTES
  // ============================================================================

  /**
   * Register a new local participant
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register as a local participant' })
  @ApiResponse({ status: 201, description: 'Participant registered successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 409, description: 'Participant already exists' })
  async registerLocal(
    @CurrentUser('sub') userId: string,
    @Body(new ZodValidationPipe(RegisterLocalSchema)) dto: RegisterLocalDto,
  ): Promise<ParticipantResponseDto> {
    const participant = await this.registrationService.register(userId, dto);
    return plainToInstance(ParticipantResponseDto, participant, {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Register a new international participant
   */
  @Post('international')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register as an international participant' })
  @ApiResponse({ status: 201, description: 'International participant registered' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 409, description: 'Participant already exists' })
  async registerInternational(
    @CurrentUser('sub') userId: string,
    @Body(new ZodValidationPipe(RegisterInternationalSchema))
    dto: RegisterInternationalDto,
  ): Promise<ParticipantResponseDto> {
    const participant = await this.registrationService.register(userId, dto);
    return plainToInstance(ParticipantResponseDto, participant, {
      excludeExtraneousValues: true,
    });
  }

  // ============================================================================
  // PROFILE ROUTES
  // ============================================================================

  /**
   * Get current user's participant profile
   */
  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  async getMyProfile(
    @CurrentUser('sub') userId: string,
  ): Promise<ParticipantResponseDto> {
    const participant = await this.registrationService.findByUserId(userId);
    if (!participant) {
      throw new NotFoundException('Profile not found'); // Will be caught by exception filter
    }
    return plainToInstance(ParticipantResponseDto, participant, {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Update current user's profile
   */
  @Patch('profile')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 400, description: 'Validation error or immutable field change' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Profile locked after payment' })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  @ApiResponse({ status: 409, description: 'Cannot update while visa processing' })
  async updateMyProfile(
    @CurrentUser('sub') userId: string,
    @Body(new ZodValidationPipe(UpdateProfileSchema)) dto: UpdateProfileDto,
  ): Promise<ParticipantResponseDto> {
    const participant = await this.registrationService.findByUserId(userId);
    if (!participant) {
      throw new NotFoundException('Profile not found');
    }
    const updated = await this.registrationService.updateProfile(
      participant.id,
      dto,
    );
    return plainToInstance(ParticipantResponseDto, updated, {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Delete current user's registration
   */
  @Delete('profile')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete current user registration' })
  @ApiResponse({ status: 204, description: 'Registration deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Cannot delete paid registration' })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  @ApiResponse({
    status: 409,
    description: 'You lead a team with other members; disband or remove them first',
  })
  async deleteMyProfile(@CurrentUser('sub') userId: string): Promise<void> {
    const participant = await this.registrationService.findByUserId(userId);
    if (!participant) {
      throw new NotFoundException('Profile not found');
    }
    await this.registrationService.deleteParticipant(participant.id);
  }

  // ============================================================================
  // VISA ROUTES
  // ============================================================================

  /**
   * Request a visa invitation letter
   */
  @Post('visa')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Request visa invitation letter' })
  @ApiResponse({ status: 201, description: 'Visa application created' })
  @ApiResponse({ status: 400, description: 'Not an international participant' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 409, description: 'Visa application already exists' })
  async requestVisa(
    @CurrentUser('sub') userId: string,
    @Body(new ZodValidationPipe(RequestVisaSchema)) dto: RequestVisaDto,
  ): Promise<VisaApplicationResponseDto> {
    const participant = await this.registrationService.findByUserId(userId);
    if (!participant) {
      throw new NotFoundException('Profile not found');
    }
    const visa = await this.registrationService.requestVisaLetter(
      participant.id,
      dto,
    );
    return plainToInstance(VisaApplicationResponseDto, visa, {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Get current user's visa application
   */
  @Get('visa')
  @ApiOperation({ summary: 'Get current user visa application' })
  @ApiResponse({ status: 200, description: 'Visa application retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Visa application not found' })
  async getMyVisa(
    @CurrentUser('sub') userId: string,
  ): Promise<VisaApplicationResponseDto> {
    const participant = await this.registrationService.findByUserId(userId);
    if (!participant) {
      throw new NotFoundException('Profile not found');
    }
    const visa = await this.registrationService.getVisaApplication(participant.id);
    if (!visa) {
      throw new NotFoundException('Visa application not found');
    }
    return plainToInstance(VisaApplicationResponseDto, visa, {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Update visa application (only when pending)
   */
  @Patch('visa')
  @ApiOperation({ summary: 'Update visa application' })
  @ApiResponse({ status: 200, description: 'Visa application updated' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Visa application not found' })
  @ApiResponse({ status: 409, description: 'Cannot update non-pending visa' })
  async updateMyVisa(
    @CurrentUser('sub') userId: string,
    @Body(new ZodValidationPipe(RequestVisaBaseSchema.partial())) dto: Partial<RequestVisaDto>,
  ): Promise<VisaApplicationResponseDto> {
    const participant = await this.registrationService.findByUserId(userId);
    if (!participant) {
      throw new NotFoundException('Profile not found');
    }
    const visa = await this.registrationService.getVisaApplication(participant.id);
    if (!visa) {
      throw new NotFoundException('Visa application not found');
    }
    const updated = await this.registrationService.updateVisaApplication(
      visa.id,
      dto,
    );
    return plainToInstance(VisaApplicationResponseDto, updated, {
      excludeExtraneousValues: true,
    });
  }

  // ============================================================================
  // TEAM ROUTES
  // ============================================================================

  /**
   * Create a team (leader path).
   * The authenticated participant becomes the team leader and first member.
   * Returns the team including the generated join code.
   */
  @Post('team')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a team and receive a join code (leader path)' })
  @ApiResponse({ status: 201, description: 'Team created successfully', type: TeamResponseDto })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Participant is banned or already paid' })
  @ApiResponse({ status: 404, description: 'Participant profile not found' })
  @ApiResponse({ status: 409, description: 'Already in a team' })
  async createTeam(
    @CurrentUser('sub') userId: string,
    @Body(new ZodValidationPipe(CreateTeamSchema)) dto: CreateTeamDto,
  ): Promise<TeamResponseDto> {
    const team = await this.registrationService.createTeam(userId, dto);
    return plainToInstance(
      TeamResponseDto,
      {
        ...team,
        memberCount: team.members.length,
        spotsLeft: team.size - team.members.length,
        members: team.members.map((m: { id: string; user: { name: string; lastName: string; email: string } }) => ({
          id: m.id,
          name: m.user.name,
          lastName: m.user.lastName,
          email: m.user.email,
        })),
      },
      { excludeExtraneousValues: true },
    );
  }

  /**
   * Update team name and/or size (leader path).
   */
  @Patch('team')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update your team (leader only)' })
  @ApiResponse({ status: 200, description: 'Team updated successfully', type: TeamResponseDto })
  @ApiResponse({ status: 400, description: 'Validation error or invalid size' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Participant is banned or already paid' })
  @ApiResponse({ status: 404, description: 'Not a team leader' })
  async updateTeam(
    @CurrentUser('sub') userId: string,
    @Body(new ZodValidationPipe(UpdateTeamSchema)) dto: UpdateTeamDto,
  ): Promise<TeamResponseDto> {
    const team = await this.registrationService.updateTeam(userId, dto);
    return plainToInstance(
      TeamResponseDto,
      {
        ...team,
        memberCount: team.members.length,
        spotsLeft: team.size - team.members.length,
        members: team.members.map((m: { id: string; user: { name: string; lastName: string; email: string } }) => ({
          id: m.id,
          name: m.user.name,
          lastName: m.user.lastName,
          email: m.user.email,
        })),
      },
      { excludeExtraneousValues: true },
    );
  }

  /**
   * Join an existing team using a 6-character code (member path).
   */
  @Post('team/join')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Join a team using a join code (member path)' })
  @ApiResponse({ status: 200, description: 'Joined team successfully', type: TeamResponseDto })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Team is full, or participant is banned/already paid' })
  @ApiResponse({ status: 404, description: 'Participant or team not found' })
  @ApiResponse({ status: 409, description: 'Already in a team' })
  async joinTeam(
    @CurrentUser('sub') userId: string,
    @Body(new ZodValidationPipe(JoinTeamSchema)) dto: JoinTeamDto,
  ): Promise<TeamResponseDto> {
    const team = await this.registrationService.joinTeam(userId, dto);
    return plainToInstance(
      TeamResponseDto,
      {
        ...team,
        memberCount: team.members.length,
        spotsLeft: team.size - team.members.length,
        members: team.members.map((m: { id: string; user: { name: string; lastName: string; email: string } }) => ({
          id: m.id,
          name: m.user.name,
          lastName: m.user.lastName,
          email: m.user.email,
        })),
      },
      { excludeExtraneousValues: true },
    );
  }

  /**
   * Get the current user's team.
   * Returns full team info including members.
   * Note: the join code is only useful to the leader — consider omitting it
   * from the response for non-leaders in a future iteration.
   */
  @Get('team')
  @ApiOperation({ summary: 'Get the current user\'s team' })
  @ApiResponse({ status: 200, description: 'Team retrieved successfully', type: TeamResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not in a team' })
  async getMyTeam(@CurrentUser('sub') userId: string): Promise<TeamResponseDto> {
    const team = await this.registrationService.getMyTeam(userId);
    return plainToInstance(
      TeamResponseDto,
      {
        ...team,
        memberCount: team.members.length,
        spotsLeft: team.size - team.members.length,
        members: team.members.map((m: { id: string; user: { name: string; lastName: string; email: string } }) => ({
          id: m.id,
          name: m.user.name,
          lastName: m.user.lastName,
          email: m.user.email,
        })),
      },
      { excludeExtraneousValues: true },
    );
  }

  /**
   * Leave the current user's team (member path).
   * Team leaders cannot leave their own team — they must disband it instead.
   */
  @Delete('team/leave')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Leave your current team (members only, not the leader)' })
  @ApiResponse({ status: 204, description: 'Left the team successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not in a team' })
  @ApiResponse({ status: 409, description: 'Team leaders cannot leave; disband the team instead' })
  async leaveTeam(@CurrentUser('sub') userId: string): Promise<void> {
    await this.registrationService.leaveTeam(userId);
  }

  /**
   * Remove a member from your team (leader path only).
   */
  @Delete('team/members/:participantId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove a member from your team (leader only)' })
  @ApiParam({ name: 'participantId', description: 'Participant ID of the member to remove' })
  @ApiResponse({ status: 200, description: 'Member removed successfully', type: TeamResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'You do not lead a team, or the target is not a member' })
  @ApiResponse({ status: 409, description: 'Leaders cannot kick themselves' })
  async kickMember(
    @CurrentUser('sub') userId: string,
    @Param('participantId', ParseUUIDPipe) participantId: string,
  ): Promise<TeamResponseDto> {
    const team = await this.registrationService.kickMember(userId, participantId);
    return plainToInstance(
      TeamResponseDto,
      {
        ...team,
        memberCount: team.members.length,
        spotsLeft: team.size - team.members.length,
        members: team.members.map((m: { id: string; user: { name: string; lastName: string; email: string } }) => ({
          id: m.id,
          name: m.user.name,
          lastName: m.user.lastName,
          email: m.user.email,
        })),
      },
      { excludeExtraneousValues: true },
    );
  }

  /**
   * Disband your team entirely (leader path only).
   * Deletes the team; all members (including you) are freed to join or
   * create another team afterwards.
   */
  @Delete('team')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Disband your team (leader only)' })
  @ApiResponse({ status: 204, description: 'Team disbanded successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'You do not lead a team' })
  async disbandTeam(@CurrentUser('sub') userId: string): Promise<void> {
    await this.registrationService.disbandTeam(userId);
  }

  // ============================================================================
  // ADMIN ROUTES
  // ============================================================================

  /**
   * List all participants (admin only)
   */
  @Get('admin/participants')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: '[Admin] List all participants' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiQuery({ name: 'paid', required: false, type: Boolean })
  @ApiQuery({ name: 'banned', required: false, type: Boolean })
  @ApiQuery({ name: 'isInternational', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Participants list' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin only' })
  async listParticipants(
    @Query('skip', new DefaultValuePipe(0), ParseIntPipe) skip: number,
    @Query('take', new DefaultValuePipe(20), ParseIntPipe) take: number,
    @Query('paid') paid?: string,
    @Query('banned') banned?: string,
    @Query('isInternational') isInternational?: string,
  ): Promise<ParticipantListResponseDto> {
    const filters = {
      skip,
      take,
      paid: paid !== undefined ? paid === 'true' : undefined,
      banned: banned !== undefined ? banned === 'true' : undefined,
      isInternational: isInternational !== undefined ? isInternational === 'true' : undefined,
    };

    const [participants, total] = await Promise.all([
      this.registrationService.listParticipants(filters),
      this.registrationService.countParticipants(filters),
    ]);

    return plainToInstance(
      ParticipantListResponseDto,
      {
        data: participants.map((p) =>
          plainToInstance(ParticipantAdminResponseDto, p, {
            excludeExtraneousValues: true,
          }),
        ),
        total,
        skip,
        take,
      },
      { excludeExtraneousValues: true },
    );
  }

  /**
   * Get participant by ID (admin only)
   */
  @Get('admin/participants/:id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: '[Admin] Get participant by ID' })
  @ApiParam({ name: 'id', description: 'Participant ID' })
  @ApiResponse({ status: 200, description: 'Participant details' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async getParticipant(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ParticipantAdminResponseDto> {
    const participant = await this.registrationService.getProfile(id);
    return plainToInstance(ParticipantAdminResponseDto, participant, {
      excludeExtraneousValues: true,
    });
  }

  /**
   * List all teams (admin only)
   */
  @Get('admin/teams')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: '[Admin] List all teams' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Filter by team name or join code' })
  @ApiResponse({ status: 200, description: 'Teams list', type: TeamListResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin only' })
  async listTeams(
    @Query('skip', new DefaultValuePipe(0), ParseIntPipe) skip: number,
    @Query('take', new DefaultValuePipe(20), ParseIntPipe) take: number,
    @Query('search') search?: string,
  ): Promise<TeamListResponseDto> {
    const filters = { skip, take, search };

    const [teams, total] = await Promise.all([
      this.registrationService.listTeams(filters),
      this.registrationService.countTeams({ search }),
    ]);

    return plainToInstance(
      TeamListResponseDto,
      {
        data: teams.map((t) => ({
          ...t,
          memberCount: t.members.length,
          spotsLeft: t.size - t.members.length,
          members: t.members.map((m: { id: string; user: { name: string; lastName: string; email: string } }) => ({
            id: m.id,
            name: m.user.name,
            lastName: m.user.lastName,
            email: m.user.email,
          })),
        })),
        total,
        skip,
        take,
      },
      { excludeExtraneousValues: true },
    );
  }

  /**
   * Ban a participant (admin only)
   */
  @Post('admin/participants/:id/ban')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: '[Admin] Ban a participant' })
  @ApiParam({ name: 'id', description: 'Participant ID' })
  @ApiResponse({ status: 200, description: 'Participant banned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 409, description: 'Already banned' })
  async banParticipant(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('reason') reason: string,
  ): Promise<ParticipantAdminResponseDto> {
    const participant = await this.registrationService.banParticipant(
      id,
      reason || 'No reason provided',
    );
    return plainToInstance(ParticipantAdminResponseDto, participant, {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Unban a participant (admin only)
   */
  @Post('admin/participants/:id/unban')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: '[Admin] Unban a participant' })
  @ApiParam({ name: 'id', description: 'Participant ID' })
  @ApiResponse({ status: 200, description: 'Participant unbanned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 409, description: 'Not banned' })
  async unbanParticipant(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ParticipantAdminResponseDto> {
    const participant = await this.registrationService.unbanParticipant(id);
    return plainToInstance(ParticipantAdminResponseDto, participant, {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Approve visa application (admin only)
   */
  @Post('admin/visa/:id/approve')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: '[Admin] Approve visa application' })
  @ApiParam({ name: 'id', description: 'Visa application ID' })
  @ApiResponse({ status: 200, description: 'Visa approved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 409, description: 'Invalid status transition' })
  async approveVisa(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<VisaApplicationResponseDto> {
    const visa = await this.registrationService.approveVisaApplication(id);
    return plainToInstance(VisaApplicationResponseDto, visa, {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Reject visa application (admin only)
   */
  @Post('admin/visa/:id/reject')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: '[Admin] Reject visa application' })
  @ApiParam({ name: 'id', description: 'Visa application ID' })
  @ApiResponse({ status: 200, description: 'Visa rejected' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 409, description: 'Invalid status transition' })
  async rejectVisa(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<VisaApplicationResponseDto> {
    const visa = await this.registrationService.rejectVisaApplication(id);
    return plainToInstance(VisaApplicationResponseDto, visa, {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Mark visa letter as sent (admin only)
   */
  @Post('admin/visa/:id/mark-sent')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: '[Admin] Mark visa letter as sent' })
  @ApiParam({ name: 'id', description: 'Visa application ID' })
  @ApiResponse({ status: 200, description: 'Visa letter marked as sent' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 409, description: 'Invalid status transition' })
  async markVisaSent(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<VisaApplicationResponseDto> {
    const visa = await this.registrationService.markVisaLetterSent(id);
    return plainToInstance(VisaApplicationResponseDto, visa, {
      excludeExtraneousValues: true,
    });
  }
}