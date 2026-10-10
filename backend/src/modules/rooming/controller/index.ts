import {
  Controller,
  Get,
  Post,
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
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { JwtAuthGuard, RolesGuard } from '../../../common/guards';
import { CurrentUser, Roles } from '../../../common/decorators';
import { ZodValidationPipe } from '../../../common/pipes';
import { RoomingService, RoomWithMembers } from '../service';
import { ROOM_CAPACITY } from '../domain';
import {
  JoinRoomDto,
  JoinRoomSchema,
  RoomResponseDto,
  MyRoomResponseDto,
  RoomListResponseDto,
} from '../dto';

const GENDERS = ['male', 'female'];

/**
 * Rooming controller - same create / join-by-code flow as teams. Every room
 * is a double and holds a single gender.
 */
@ApiTags('Rooming')
@ApiBearerAuth('JWT-auth')
@Controller('rooming')
@UseGuards(JwtAuthGuard)
export class RoomingController {
  constructor(private readonly roomingService: RoomingService) {}

  /**
   * Shape a service-level room (participants + their user rows) into the flat
   * API response, adding the derived occupant counts.
   */
  private toRoomResponse(room: RoomWithMembers): RoomResponseDto {
    return plainToInstance(
      RoomResponseDto,
      {
        ...room,
        capacity: ROOM_CAPACITY,
        memberCount: room.members.length,
        spotsLeft: ROOM_CAPACITY - room.members.length,
        members: room.members.map((m) => ({
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
   * Create a room (owner path).
   * The authenticated participant becomes the owner and first occupant.
   * Returns the room including the generated join code.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a double room and receive a join code (owner path)' })
  @ApiResponse({ status: 201, description: 'Room created successfully', type: RoomResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Participant is banned, or rooming is not open' })
  @ApiResponse({ status: 404, description: 'Participant profile not found' })
  @ApiResponse({ status: 409, description: 'Already in a room' })
  async createRoom(@CurrentUser('sub') userId: string): Promise<RoomResponseDto> {
    return this.toRoomResponse(await this.roomingService.createRoom(userId));
  }

  /**
   * Join an existing room using a 6-character code (roommate path).
   */
  @Post('join')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Join a room using a join code (roommate path)' })
  @ApiResponse({ status: 200, description: 'Joined room successfully', type: RoomResponseDto })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Room is full or for the other gender, participant is banned, or rooming is not open' })
  @ApiResponse({ status: 404, description: 'Participant or room not found' })
  @ApiResponse({ status: 409, description: 'Already in a room' })
  async joinRoom(
    @CurrentUser('sub') userId: string,
    @Body(new ZodValidationPipe(JoinRoomSchema)) dto: JoinRoomDto,
  ): Promise<RoomResponseDto> {
    return this.toRoomResponse(await this.roomingService.joinRoom(userId, dto));
  }

  /**
   * Get the current user's room - `{ room: null }` when they have none.
   */
  @Get()
  @ApiOperation({ summary: 'Get the current user\'s room' })
  @ApiResponse({ status: 200, description: 'Room retrieved successfully', type: MyRoomResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Participant profile not found' })
  async getMyRoom(@CurrentUser('sub') userId: string): Promise<MyRoomResponseDto> {
    const room = await this.roomingService.getMyRoom(userId);
    return plainToInstance(
      MyRoomResponseDto,
      { room: room ? this.toRoomResponse(room) : null },
      { excludeExtraneousValues: true },
    );
  }

  /**
   * Leave the current room (roommate path only - owners disband instead).
   */
  @Delete('leave')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Leave your room (roommate only)' })
  @ApiResponse({ status: 204, description: 'Left room successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not in a room' })
  @ApiResponse({ status: 409, description: 'Owners must disband instead' })
  async leaveRoom(@CurrentUser('sub') userId: string): Promise<void> {
    await this.roomingService.leaveRoom(userId);
  }

  /**
   * Remove the roommate from your room (owner path only).
   */
  @Delete('members/:participantId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove your roommate (owner only)' })
  @ApiResponse({ status: 200, description: 'Roommate removed', type: RoomResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not a room owner, or participant not in your room' })
  @ApiResponse({ status: 409, description: 'Cannot remove yourself' })
  async removeRoommate(
    @CurrentUser('sub') userId: string,
    @Param('participantId', ParseUUIDPipe) participantId: string,
  ): Promise<RoomResponseDto> {
    return this.toRoomResponse(await this.roomingService.removeRoommate(userId, participantId));
  }

  /**
   * Disband your room (owner path only). Frees both occupants.
   */
  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Disband your room (owner only)' })
  @ApiResponse({ status: 204, description: 'Room disbanded' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not a room owner' })
  async disbandRoom(@CurrentUser('sub') userId: string): Promise<void> {
    await this.roomingService.disbandRoom(userId);
  }

  // ============================================================================
  // ADMIN ROUTES
  // ============================================================================

  /**
   * List all rooms (admin only)
   */
  @Get('admin/rooms')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: '[Admin] List all rooms' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Filter by join code or occupant name/email' })
  @ApiQuery({ name: 'gender', required: false, enum: GENDERS, description: 'Filter by gender; omit for all' })
  @ApiResponse({ status: 200, description: 'Rooms list', type: RoomListResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin only' })
  async listRooms(
    @Query('skip', new DefaultValuePipe(0), ParseIntPipe) skip: number,
    @Query('take', new DefaultValuePipe(20), ParseIntPipe) take: number,
    @Query('search') search?: string,
    @Query('gender') gender?: string,
  ): Promise<RoomListResponseDto> {
    if (gender !== undefined && !GENDERS.includes(gender)) {
      throw new BadRequestException("gender must be 'male' or 'female'");
    }

    const [rooms, total] = await Promise.all([
      this.roomingService.listRooms({ skip, take, search, gender }),
      this.roomingService.countRooms({ search, gender }),
    ]);

    return plainToInstance(
      RoomListResponseDto,
      {
        data: rooms.map((r) => this.toRoomResponse(r)),
        total,
        skip,
        take,
      },
      { excludeExtraneousValues: true },
    );
  }
}
