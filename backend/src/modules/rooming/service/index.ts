import {
  Injectable,
  ConflictException,
  ForbiddenException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Participant, Prisma, Room } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { generateJoinCode } from '../../../common/utils/join-code';
import { JoinRoomDto } from '../dto';
import { ROOM_CAPACITY } from '../domain';

/** Type for room with its occupants and their user info, owner first */
export type RoomWithMembers = Room & {
  members: (Participant & {
    user: { name: string; lastName: string; email: string };
  })[];
};

/** Raw shape returned by every room query - flattened by `shapeRoom`. */
type RoomWithResidents = Room & {
  residents: (Participant & {
    user: { name: string; lastName: string; email: string };
  })[];
};

/**
 * Rooming window, from `ROOMING_PHASE`.
 * `soon` and `closed` both block creating/joining; they differ only in the
 * message shown, so the frontend can render the right copy.
 */
export type RoomingPhase = 'soon' | 'open' | 'closed';

const ROOM_INCLUDE = {
  residents: {
    include: { user: { select: { name: true, lastName: true, email: true } } },
  },
} satisfies Prisma.RoomInclude;

/**
 * Rooming works like teams: the owner creates a room and shares its
 * 6-character code, a roommate joins with it. Two rules on top of that:
 * every room is a double (`ROOM_CAPACITY`), and both occupants share the
 * gender stored on the room.
 *
 * A participant is in at most one room - `participants.roomId` is a single
 * column - and the owner is one of the room's residents.
 */
@Injectable()
export class RoomingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Create a room (owner path).
   * Generates a unique 6-character join code. The creating participant
   * becomes both owner and first occupant, and the room takes their gender.
   *
   * @param userId - JWT sub resolved to internal DB user ID
   * @throws NotFoundException  if no participant profile exists for this user
   * @throws ForbiddenException if the participant is banned or rooming is not open
   * @throws ConflictException  if the participant is already in a room
   */
  async createRoom(userId: string): Promise<RoomWithMembers> {
    this.assertRoomingOpen();

    try {
      const room = await this.prisma.$transaction(async (tx) => {
        const participant = await tx.participant.findUnique({
          where: { userId },
          select: { id: true, banned: true, gender: true, roomId: true },
        });

        if (!participant) {
          throw new NotFoundException(
            'Participant profile not found. Complete your registration first.',
          );
        }

        // Edge case: Banned participants cannot take a room
        if (participant.banned) {
          throw new ForbiddenException('Banned participants cannot create a room.');
        }

        if (participant.roomId) {
          throw new ConflictException('You are already in a room. Leave it first.');
        }

        const code = await generateJoinCode(
          async (c) => !!(await tx.room.findUnique({ where: { code: c }, select: { id: true } })),
          'room',
        );

        // Create the room and immediately move the owner in
        return tx.room.create({
          data: {
            code,
            gender: participant.gender,
            owner: { connect: { id: participant.id } },
            residents: { connect: { id: participant.id } },
          },
          include: ROOM_INCLUDE,
        });
      });

      return this.shapeRoom(room);
    } catch (error) {
      this.handlePrismaError(error);
      throw error;
    }
  }

  /**
   * Join an existing room using a 6-character code (roommate path).
   *
   * The room row is locked for the rest of the transaction, so two people
   * racing for the last spot cannot both get it.
   *
   * @param userId - JWT sub resolved to internal DB user ID
   * @param dto    - The join code
   * @throws NotFoundException  if no participant profile or room with that code exists
   * @throws ForbiddenException if the participant is banned, the room is full,
   *                            the room is for the other gender, or rooming is not open
   * @throws ConflictException  if the participant is already in a room
   */
  async joinRoom(userId: string, dto: JoinRoomDto): Promise<RoomWithMembers> {
    this.assertRoomingOpen();
    const code = dto.code.toUpperCase();

    try {
      const room = await this.prisma.$transaction(async (tx) => {
        const participant = await tx.participant.findUnique({
          where: { userId },
          select: { id: true, banned: true, gender: true, roomId: true },
        });

        if (!participant) {
          throw new NotFoundException(
            'Participant profile not found. Complete your registration first.',
          );
        }

        // Edge case: Banned participants cannot take a room
        if (participant.banned) {
          throw new ForbiddenException('Banned participants cannot join a room.');
        }

        const [locked] = await tx.$queryRaw<{ id: string }[]>`
          SELECT id FROM rooms WHERE code = ${code} FOR UPDATE`;

        if (!locked) {
          throw new NotFoundException('No room found with that code. Check the code and try again.');
        }

        const target = await tx.room.findUniqueOrThrow({
          where: { id: locked.id },
          include: { residents: { select: { id: true } } },
        });

        if (participant.roomId) {
          throw new ConflictException(
            participant.roomId === target.id
              ? 'You are already in this room.'
              : 'You are already in a room. Leave it first.',
          );
        }

        // Rooms never mix genders
        if (participant.gender !== target.gender) {
          throw new ForbiddenException(
            `This room is for ${target.gender} participants only - rooms can't mix genders.`,
          );
        }

        // Enforce the double-room cap
        if (target.residents.length >= ROOM_CAPACITY) {
          throw new ForbiddenException(
            `This room is already full (${ROOM_CAPACITY}/${ROOM_CAPACITY}).`,
          );
        }

        return tx.room.update({
          where: { id: target.id },
          data: { residents: { connect: { id: participant.id } } },
          include: ROOM_INCLUDE,
        });
      });

      return this.shapeRoom(room);
    } catch (error) {
      this.handlePrismaError(error);
      throw error;
    }
  }

  /**
   * Get the current user's room.
   *
   * @param userId - JWT sub resolved to internal DB user ID
   * @returns The room, or `null` when the participant is not in one
   * @throws NotFoundException if the user has no participant profile
   */
  async getMyRoom(userId: string): Promise<RoomWithMembers | null> {
    const participant = await this.prisma.participant.findUnique({
      where: { userId },
      select: { room: { include: ROOM_INCLUDE } },
    });

    if (!participant) {
      throw new NotFoundException('Participant profile not found.');
    }

    return participant.room ? this.shapeRoom(participant.room) : null;
  }

  /**
   * Leave the room the participant is in (roommate path only).
   * Owners cannot use this - they must disband the room instead, since
   * removing the owner would orphan the roommate.
   *
   * @param userId - JWT sub resolved to internal DB user ID
   * @throws NotFoundException if no participant profile exists, or the participant isn't in a room
   * @throws ConflictException if the participant owns the room
   */
  async leaveRoom(userId: string): Promise<void> {
    try {
      await this.prisma.$transaction(async (tx) => {
        const participant = await tx.participant.findUnique({
          where: { userId },
          select: { id: true, roomId: true, ownedRoom: { select: { id: true } } },
        });

        if (!participant) {
          throw new NotFoundException('Participant profile not found.');
        }

        if (participant.ownedRoom) {
          throw new ConflictException(
            'Room owners cannot leave their own room. Disband the room instead.',
          );
        }

        if (!participant.roomId) {
          throw new NotFoundException('You are not in a room.');
        }

        await tx.participant.update({
          where: { id: participant.id },
          data: { roomId: null },
        });
      });
    } catch (error) {
      this.handlePrismaError(error);
      throw error;
    }
  }

  /**
   * Remove the roommate from a room (owner path only).
   * The owner cannot remove themselves - use disbandRoom for that.
   *
   * @param userId   - JWT sub of the caller, resolved to internal DB user ID
   * @param memberId - Participant ID of the roommate to remove
   * @throws NotFoundException if the caller has no profile, doesn't own a room,
   *                           or the target isn't in that room
   * @throws ConflictException if the owner tries to remove themselves
   */
  async removeRoommate(userId: string, memberId: string): Promise<RoomWithMembers> {
    try {
      const room = await this.prisma.$transaction(async (tx) => {
        const participant = await tx.participant.findUnique({
          where: { userId },
          select: { id: true, ownedRoom: { select: { id: true } } },
        });

        if (!participant) {
          throw new NotFoundException('Participant profile not found.');
        }

        const ownedRoom = participant.ownedRoom;

        if (!ownedRoom) {
          throw new NotFoundException('You do not own a room.');
        }

        if (memberId === participant.id) {
          throw new ConflictException(
            'Owners cannot remove themselves. Disband the room instead.',
          );
        }

        const { count } = await tx.participant.updateMany({
          where: { id: memberId, roomId: ownedRoom.id },
          data: { roomId: null },
        });

        if (count === 0) {
          throw new NotFoundException('That participant is not in your room.');
        }

        return tx.room.findUniqueOrThrow({
          where: { id: ownedRoom.id },
          include: ROOM_INCLUDE,
        });
      });

      return this.shapeRoom(room);
    } catch (error) {
      this.handlePrismaError(error);
      throw error;
    }
  }

  /**
   * Disband a room entirely (owner path only).
   * Deletes the Room row; `participants.roomId` is `ON DELETE SET NULL`, so
   * both occupants are freed at the database level.
   *
   * @param userId - JWT sub resolved to internal DB user ID
   * @throws NotFoundException if the caller has no participant profile or does not own a room
   */
  async disbandRoom(userId: string): Promise<void> {
    try {
      await this.prisma.$transaction(async (tx) => {
        const participant = await tx.participant.findUnique({
          where: { userId },
          select: { id: true, ownedRoom: { select: { id: true } } },
        });

        if (!participant) {
          throw new NotFoundException('Participant profile not found.');
        }

        if (!participant.ownedRoom) {
          throw new NotFoundException('You do not own a room.');
        }

        await tx.room.delete({ where: { id: participant.ownedRoom.id } });
      });
    } catch (error) {
      this.handlePrismaError(error);
      throw error;
    }
  }

  /**
   * List all rooms with optional pagination, search and gender filter (Admin only).
   * Search matches the join code or an occupant's name/email (case-insensitive).
   */
  async listRooms(options?: {
    search?: string;
    gender?: string;
    skip?: number;
    take?: number;
  }): Promise<RoomWithMembers[]> {
    const rooms = await this.prisma.room.findMany({
      where: this.roomFilter(options),
      skip: options?.skip,
      take: options?.take,
      include: ROOM_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });

    return rooms.map((room) => this.shapeRoom(room));
  }

  /** Count rooms matching the optional search/gender filter (Admin only). */
  async countRooms(options?: { search?: string; gender?: string }): Promise<number> {
    return this.prisma.room.count({ where: this.roomFilter(options) });
  }

  /**
   * Current rooming window, from the environment. Unrecognised values mean
   * closed rather than accidentally opening a window that should be shut.
   */
  getRoomingPhase(): RoomingPhase {
    const raw = this.config.get<string>('ROOMING_PHASE')?.trim().toLowerCase();
    return raw === 'open' || raw === 'soon' || raw === 'closed' ? raw : 'closed';
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  /**
   * Guard for the two write paths that fill a room (create and join).
   * Managing an existing room stays available after the window shuts so
   * occupants can still leave, remove a roommate or disband.
   */
  private assertRoomingOpen(): void {
    const phase = this.getRoomingPhase();
    if (phase === 'open') return;

    throw new ForbiddenException(
      phase === 'soon' ? 'Rooming has not opened yet.' : 'Rooming is closed.',
    );
  }

  /** Rename `residents` to `members`, owner first, to match the team responses. */
  private shapeRoom(room: RoomWithResidents): RoomWithMembers {
    const { residents, ...rest } = room;
    const members = [...residents].sort(
      (a, b) => Number(b.id === room.ownerId) - Number(a.id === room.ownerId),
    );
    return { ...rest, members };
  }

  /** Shared `where` for the admin room list/count. */
  private roomFilter(options?: { search?: string; gender?: string }): Prisma.RoomWhereInput {
    const where: Prisma.RoomWhereInput = {};

    if (options?.gender) where.gender = options.gender;

    if (options?.search) {
      const contains = { contains: options.search, mode: 'insensitive' as const };
      where.OR = [
        { code: contains },
        {
          residents: {
            some: {
              user: { OR: [{ name: contains }, { lastName: contains }, { email: contains }] },
            },
          },
        },
      ];
    }

    return where;
  }

  /**
   * Handle Prisma errors and convert to appropriate NestJS exceptions
   * @throws ConflictException for unique constraint violations (P2002)
   * @throws NotFoundException for record not found errors (P2025)
   */
  private handlePrismaError(error: unknown): void {
    // Edge case: a concurrent create won the race for the owner slot or code
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      const target = String(error.meta?.target ?? '');
      throw new ConflictException(
        target.includes('owner_id')
          ? 'You already own a room.'
          : 'A record with this data already exists. Please try again.',
      );
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    ) {
      throw new NotFoundException('Record not found');
    }

    if (
      error instanceof ConflictException ||
      error instanceof ForbiddenException ||
      error instanceof BadRequestException ||
      error instanceof NotFoundException
    ) {
      throw error;
    }
  }
}
