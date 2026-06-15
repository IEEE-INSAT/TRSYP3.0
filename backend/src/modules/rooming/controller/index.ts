import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpStatus,
  HttpCode,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { JwtAuthGuard } from '../../../common/guards';
import { CurrentUser } from '../../../common/decorators';
import { ZodValidationPipe } from '../../../common/pipes';
import { RoomingService } from '../service';
import {
  CreateRoomDto,
  CreateRoomSchema,
  InviteParticipantDto,
  InviteParticipantSchema,
  RespondInvitationDto,
  RespondInvitationSchema,
  RoomResponseDto,
  InvitationResponseDto,
} from '../dto';

@ApiTags('Rooming')
@ApiBearerAuth('JWT-auth')
@Controller('rooming')
@UseGuards(JwtAuthGuard)
export class RoomingController {
  constructor(private readonly roomingService: RoomingService) {}

  // US3.1 — Create Room

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new room' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Room created successfully.', type: RoomResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Participant not found.' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Banned participants cannot create rooms.' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Participant already owns or resides in a room.' })
  async createRoom(
    @CurrentUser('sub') userId: string,
    @Body(new ZodValidationPipe(CreateRoomSchema)) dto: CreateRoomDto,
  ): Promise<RoomResponseDto> {
    const room = await this.roomingService.createRoom(userId, dto);
    return plainToInstance(RoomResponseDto, room, { excludeExtraneousValues: true });
  }

  // GET — My Room

  @Get('my-room')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get the current user\'s room' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Returns the room the user resides in.', type: RoomResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User is not in a room.' })
  async getMyRoom(@CurrentUser('sub') userId: string): Promise<RoomResponseDto> {
    const room = await this.roomingService.getRoom(userId);
    return plainToInstance(RoomResponseDto, room, { excludeExtraneousValues: true });
  }

  // DELETE — Delete Room (Owner only)

  @Delete(':roomId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a room (Owner only)' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Room deleted successfully.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Room not found.' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Only the room owner can delete the room.' })
  async deleteRoom(
    @CurrentUser('sub') userId: string,
    @Param('roomId', ParseUUIDPipe) roomId: string,
  ): Promise<void> {
    await this.roomingService.deleteRoom(userId, roomId);
  }

  // US3.2 — Invite Participant

  @Post(':roomId/invite')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Invite a participant to a room' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Invitation sent successfully.', type: InvitationResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Room or guest not found.' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Only the room owner can invite / guest is banned.' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Capacity full / gender mismatch / duplicate.' })
  async inviteParticipant(
    @CurrentUser('sub') userId: string,
    @Param('roomId', ParseUUIDPipe) roomId: string,
    @Body(new ZodValidationPipe(InviteParticipantSchema)) dto: InviteParticipantDto,
  ): Promise<InvitationResponseDto> {
    const invitation = await this.roomingService.inviteParticipant(userId, roomId, dto);
    return plainToInstance(InvitationResponseDto, invitation, { excludeExtraneousValues: true });
  }

  // Remove Participant (Owner only)

  @Post(':roomId/remove/:participantId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove a participant from the room (Owner only)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Participant removed successfully.', type: RoomResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Room not found.' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Only the owner can remove participants.' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Cannot remove from a confirmed room.' })
  async removeParticipant(
    @CurrentUser('sub') userId: string,
    @Param('roomId', ParseUUIDPipe) roomId: string,
    @Param('participantId', ParseUUIDPipe) participantId: string,
  ): Promise<RoomResponseDto> {
    const room = await this.roomingService.removeParticipant(userId, roomId, participantId);
    return plainToInstance(RoomResponseDto, room, { excludeExtraneousValues: true });
  }

  // US3.3 — Get My Invitations

  @Get('invitations')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get pending invitations for the current user' })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of pending invitations.', type: [InvitationResponseDto] })
  async getMyInvitations(@CurrentUser('sub') userId: string): Promise<InvitationResponseDto[]> {
    const invitations = await this.roomingService.getMyInvitations(userId);
    return plainToInstance(InvitationResponseDto, invitations, { excludeExtraneousValues: true });
  }

  // US3.3 — Respond to Invitation

  @Post('invitations/:invitationId/respond')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Respond to an invitation (Accept/Reject)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Invitation response processed.', type: InvitationResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Invitation not found.' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Can only respond to your own invitations.' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Invitation already responded / capacity full.' })
  async respondToInvitation(
    @CurrentUser('sub') userId: string,
    @Param('invitationId', ParseUUIDPipe) invitationId: string,
    @Body(new ZodValidationPipe(RespondInvitationSchema)) dto: RespondInvitationDto,
  ): Promise<InvitationResponseDto> {
    const invitation = await this.roomingService.respondToInvitation(userId, invitationId, dto);
    return plainToInstance(InvitationResponseDto, invitation, { excludeExtraneousValues: true });
  }

  // US3.4 — Request Room Confirmation

  @Post(':roomId/confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request room confirmation (all residents must have paid)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Room confirmed successfully.', type: RoomResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Room not found.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Not all residents have paid.' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Room is already confirmed.' })
  async requestConfirmation(
    @CurrentUser('sub') userId: string,
    @Param('roomId', ParseUUIDPipe) roomId: string,
  ): Promise<RoomResponseDto> {
    const room = await this.roomingService.confirmRoom(userId, roomId);
    return plainToInstance(RoomResponseDto, room, { excludeExtraneousValues: true });
  }

  // Leave Room (Non-owner resident)

  @Post(':roomId/leave')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Leave a room (Resident only, not owner)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Successfully left the room.', type: RoomResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Room not found.' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Owner cannot leave / not a resident.' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Cannot leave a confirmed room.' })
  async leaveRoom(
    @CurrentUser('sub') userId: string,
    @Param('roomId', ParseUUIDPipe) roomId: string,
  ): Promise<RoomResponseDto> {
    const room = await this.roomingService.leaveRoom(userId, roomId);
    return plainToInstance(RoomResponseDto, room, { excludeExtraneousValues: true });
  }
}
