import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateRoomDto, InviteParticipantDto, RespondInvitationDto } from '../dto';
import { RoomCreatedEvent, RoomInvitationCreatedEvent, RoomInvitationRespondedEvent, RoomConfirmedEvent, RoomDeletedEvent } from '../events/rooming.events';
import { DomainEvents } from '../../../common/events/event-names';
import { RoomStatus, InvitationStatus, Prisma } from '@prisma/client';
import { PaymentStatusUpdatedEvent } from '../../payment/events/payment.events';

@Injectable()
export class RoomingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Helper: emit all collected events after a transaction commits.
   * This prevents ghost notifications when a transaction rolls back.
   */
  private emitPendingEvents(events: { name: string; payload: any }[]) {
    for (const event of events) {
      this.eventEmitter.emit(event.name, event.payload);
    }
  }

  /**
   * US3.1: Create a new room
   * @param userId - The ID of the currently authenticated user
   * @param dto - Data containing the room size
   * @returns The created room including its residents
   */
  async createRoom(userId: string, dto: CreateRoomDto) {
    const pendingEvents: { name: string; payload: any }[] = [];

    try {
      const room = await this.prisma.$transaction(
        async (tx) => {
        // 1. Look up participant by userId
        const participant = await tx.participant.findUnique({
          where: { userId },
          include: { ownedRoom: true, room: true },
        });

        // 2. Validate participant exists and is not banned
        if (!participant) {
          throw new NotFoundException('Participant not found');
        }
        if (participant.banned) {
          throw new ForbiddenException('Banned participants cannot create rooms');
        }

        // 3. Validate participant doesn't already own or reside in a room
        if (participant.ownedRoom || participant.roomId) {
          throw new ConflictException('Participant already owns or resides in a room');
        }

        // 4 & 5. Create Room with status = Pending, size = dto.size, ownerId = participant.id
        // and add owner as first resident (connect to residents relation)
        const room = await tx.room.create({
          data: {
            size: dto.size,
            status: RoomStatus.Pending,
            owner: {
              connect: { id: participant.id },
            },
            residents: {
              connect: [{ id: participant.id }],
            },
          },
          include: {
            residents: true,
          },
        });

        // 6. Collect event (will be emitted after commit)
        pendingEvents.push({
          name: DomainEvents.ROOM_CREATED,
          payload: new RoomCreatedEvent(room.id, participant.id, new Date(), room.size),
        });

        // 7. Return room with residents
        return room;
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );

      this.emitPendingEvents(pendingEvents);
      return room;
    } catch (error) {
      this.handlePrismaError(error);
      throw error;
    }
  }

  /**
   * Delete a room (Owner only)
   */
  async deleteRoom(userId: string, roomId: string) {
    const pendingEvents: { name: string; payload: any }[] = [];

    try {
      await this.prisma.$transaction(async (tx) => {
        const room = await tx.room.findUnique({
          where: { id: roomId },
          include: { owner: true },
        });

        if (!room) {
          throw new NotFoundException('Room not found');
        }

        if (room.status === RoomStatus.Confirmed) {
          throw new ConflictException('Cannot delete a confirmed room');
        }

        if (room.owner.userId !== userId) {
          throw new ForbiddenException('Only the room owner can delete the room');
        }

        // Disconnect all residents before deleting (avoids FK violation)
        await tx.participant.updateMany({
          where: { roomId: roomId },
          data: { roomId: null },
        });

        await tx.room.delete({
          where: { id: roomId },
        });

        pendingEvents.push({
          name: DomainEvents.ROOM_DELETED,
          payload: new RoomDeletedEvent(room.id, room.owner.id, new Date()),
        });
      });

      this.emitPendingEvents(pendingEvents);
    } catch (error) {
      this.handlePrismaError(error);
      throw error;
    }
  }

  /**
   * US3.2: Invite a participant to a room
   * @param userId - The ID of the currently authenticated user (room owner)
   * @param roomId - The ID of the room
   * @param dto - Data containing the guestId
   * @returns The created invitation
   */
  async inviteParticipant(userId: string, roomId: string, dto: InviteParticipantDto) {
    const pendingEvents: { name: string; payload: any }[] = [];

    try {
      const invitation = await this.prisma.$transaction(
        async (tx) => {
        // 1. Look up room by roomId with owner, residents, and pending invitations
        const room = await tx.room.findUnique({
          where: { id: roomId },
          include: {
            owner: {
              include: { user: true },
            },
            residents: true,
            invitations: { where: { status: InvitationStatus.Pending } },
          },
        });

        // 2. Validate room exists
        if (!room) {
          throw new NotFoundException('Room not found');
        }

        // 3. Validate caller is the room owner
        if (room.owner.userId !== userId) {
          throw new ForbiddenException('Only the room owner can invite participants');
        }

        // 4. Validate room is not already confirmed
        if (room.status === RoomStatus.Confirmed) {
          throw new ConflictException('Cannot invite to a confirmed room');
        }

        // 5. Look up guest by dto.guestId
        const guest = await tx.participant.findUnique({
          where: { id: dto.guestId },
          include: { user: true, room: true },
        });

        // 6. Validate guest exists and is not banned
        if (!guest) {
          throw new NotFoundException('Guest not found');
        }
        if (guest.banned) {
          throw new ForbiddenException('Cannot invite banned participants');
        }

        // 7. Capacity check: room.residents.length + pendingInvitations.length < room.size
        if (room.residents.length + room.invitations.length >= room.size) {
          throw new ConflictException('Room is at maximum capacity (including pending invitations)');
        }

        // 8. Gender compatibility: guest.gender === owner.gender
        if (guest.gender !== room.owner.gender) {
          throw new ConflictException('Guest gender does not match the room owner');
        }

        // 9. Duplicate check: guest is not already a resident or has a pending invitation
        const isResident = room.residents.some((r) => r.id === guest.id);
        if (isResident) {
          throw new ConflictException('Guest is already a resident of this room');
        }

        // 10. Single-room check: guest is not already in another room
        if (guest.roomId) {
          throw new ConflictException('Guest is already a resident of another room');
        }

        // 11. Create Invitation with status = Pending
        const invitation = await tx.invitation.create({
          data: {
            roomId: room.id,
            guestId: guest.id,
            status: InvitationStatus.Pending,
          },
        });

        // 12. Collect event (will be emitted after commit)
        pendingEvents.push({
          name: DomainEvents.ROOM_INVITATION_CREATED,
          payload: new RoomInvitationCreatedEvent(
            invitation.id,
            room.id,
            guest.id,
            guest.user.email,
            `${guest.user.name} ${guest.user.lastName}`,
            `${room.owner.user.name} ${room.owner.user.lastName}`,
            InvitationStatus.Pending,
            new Date(),
          ),
        });

        // 13. Return invitation
        return invitation;
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );

      this.emitPendingEvents(pendingEvents);
      return invitation;
    } catch (error) {
      this.handlePrismaError(error);
      throw error;
    }
  }

  /**
   * US3.3: Respond to Invitation
   * @param userId - The ID of the currently authenticated user (invited guest)
   * @param invitationId - The ID of the invitation
   * @param dto - Data containing the accept boolean
   * @returns The updated invitation with the room
   */
  async respondToInvitation(userId: string, invitationId: string, dto: RespondInvitationDto) {
    const pendingEvents: { name: string; payload: any }[] = [];

    const result = await this.prisma.$transaction(
      async (tx) => {
      // 1. Look up invitation by invitationId with room, guest, owner.
      const invitation = await tx.invitation.findUnique({
        where: { id: invitationId },
        include: {
          guest: true,
          room: {
            include: {
              owner: true,
              residents: true,
            },
          },
        },
      });

      // 2. Validate invitation exists.
      if (!invitation) {
        throw new NotFoundException('Invitation not found');
      }

      // 3. Validate caller is the invited guest.
      if (invitation.guest.userId !== userId) {
        throw new ForbiddenException('You can only respond to your own invitations');
      }

      // 4. Validate invitation is in Pending status.
      if (invitation.status !== InvitationStatus.Pending) {
        throw new ConflictException(`Invitation is already ${invitation.status}`);
      }

      const { room, guest } = invitation;
      let newStatus: InvitationStatus;

      if (dto.accept) {
        // a. Re-check capacity: current room.residents.length < room.size.
        if (room.residents.length >= room.size) {
          throw new ConflictException('Room is already at maximum capacity');
        }

        // b. Re-check gender compatibility.
        if (guest.gender !== room.owner.gender) {
          throw new ConflictException('Guest gender does not match the room owner');
        }

        // c. Re-check single-room: guest not in another room.
        if (guest.roomId) {
          throw new ConflictException('You are already a resident of a room');
        }

        newStatus = InvitationStatus.Accepted;

        // d. Update invitation status to Accepted.
        await tx.invitation.update({
          where: { id: invitationId },
          data: { status: newStatus },
        });

        // e. Add guest to room.residents.
        const updatedRoom = await tx.room.update({
          where: { id: room.id },
          data: {
            residents: {
              connect: { id: guest.id },
            },
          },
          include: {
            residents: true,
          },
        });

        // f. After adding, check if all residents have paid = true -> if so, auto-confirm room.
        const allPaid = updatedRoom.residents.every((r) => r.paid === true);
        if (allPaid) {
          await tx.room.update({
            where: { id: room.id },
            data: { status: RoomStatus.Confirmed },
          });

          pendingEvents.push({
            name: DomainEvents.ROOM_CONFIRMED,
            payload: new RoomConfirmedEvent(
              room.id,
              room.owner.id,
              new Date(),
              updatedRoom.residents.map((r) => r.id),
            ),
          });
        }
      } else {
        newStatus = InvitationStatus.Rejected;
        // a. Update invitation status to Rejected.
        await tx.invitation.update({
          where: { id: invitationId },
          data: { status: newStatus },
        });
      }

      // Collect RoomInvitationRespondedEvent.
      const eventName =
        newStatus === InvitationStatus.Accepted
          ? DomainEvents.ROOM_INVITATION_ACCEPTED
          : DomainEvents.ROOM_INVITATION_REJECTED;

      pendingEvents.push({
        name: eventName,
        payload: new RoomInvitationRespondedEvent(
          invitation.id,
          room.id,
          guest.id,
          newStatus,
          new Date(),
          room.owner.id,
        ),
      });

      // Return updated invitation with room.
      return tx.invitation.findUnique({
        where: { id: invitationId },
        include: {
          room: {
            include: {
              residents: true,
            },
          },
        },
      });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    this.emitPendingEvents(pendingEvents);
    return result;
  }

  /**
   * US3.4: Confirm a room (Internal or via explicit API call)
   */
  async confirmRoom(userId: string, roomId: string) {
    const pendingEvents: { name: string; payload: any }[] = [];

    try {
      const updatedRoom = await this.prisma.$transaction(async (tx) => {
        const room = await tx.room.findUnique({
          where: { id: roomId },
          include: { residents: true, owner: true },
        });

        if (!room) {
          throw new NotFoundException('Room not found');
        }

        // Verify the caller is the room owner or a resident
        const isOwner = room.owner.userId === userId;
        const isResident = room.residents.some((r) => r.userId === userId);
        if (!isOwner && !isResident) {
          throw new ForbiddenException('Only room members can request confirmation');
        }

        if (room.status === RoomStatus.Confirmed) {
          throw new ConflictException('Room is already confirmed');
        }

        const allPaid = room.residents.every((r) => r.paid === true);
        if (!allPaid) {
          throw new BadRequestException('Not all residents have paid. Room cannot be confirmed.');
        }

        const updatedRoom = await tx.room.update({
          where: { id: roomId },
          data: { status: RoomStatus.Confirmed },
          include: { residents: true },
        });

        pendingEvents.push({
          name: DomainEvents.ROOM_CONFIRMED,
          payload: new RoomConfirmedEvent(
            room.id,
            room.owner.id,
            new Date(),
            updatedRoom.residents.map((r) => r.id),
          ),
        });

        return updatedRoom;
      });

      this.emitPendingEvents(pendingEvents);
      return updatedRoom;
    } catch (error) {
      this.handlePrismaError(error);
      throw error;
    }
  }

  /**
   * Listener for Payment Status Updates
   */
  //@OnEvent(DomainEvents.PAYMENT_STATUS_UPDATED)
  //async handlePaymentStatusUpdated(event: PaymentStatusUpdatedEvent) {
    //if (event.status !== 'Approved') return;

    /*try {
      // Find the participant and their room
      const participant = await this.prisma.participant.findUnique({
        where: { id: event.participantId },
        select: { roomId: true, room: { select: { status: true } } },
      });

      if (participant?.roomId && participant.room?.status !== RoomStatus.Confirmed) {
        // Attempt to confirm the room
        await this.confirmRoom(participant.roomId).catch((err) => {
          // It's possible not all residents have paid yet, so confirmRoom will throw BadRequestException.
          // We can safely ignore it here because it just means the room isn't ready to be confirmed.
          if (!(err instanceof BadRequestException)) {
            throw err;
          }
        });
      }
    } catch (error) {
      console.error('Error handling PAYMENT_STATUS_UPDATED for room confirmation:', error);
    }
  }*/

  // --- Additional Methods ---

  async getRoom(userId: string) {
    const participant = await this.prisma.participant.findUnique({
      where: { userId },
      select: { roomId: true },
    });

    if (!participant || !participant.roomId) {
      throw new NotFoundException('You are not currently in a room');
    }

    return this.getRoomById(participant.roomId);
  }

  async getMyInvitations(userId: string) {
    return this.prisma.invitation.findMany({
      where: { guest: { userId }, status: InvitationStatus.Pending },
      include: {
        room: {
          include: { owner: true, residents: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getRoomById(roomId: string) {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
      include: {
        owner: true,
        residents: true,
        invitations: { where: { status: InvitationStatus.Pending } },
      },
    });

    if (!room) {
      throw new NotFoundException('Room not found');
    }
    return room;
  }



  async leaveRoom(userId: string, roomId: string) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        // Fetch the participant to get their id
        const participant = await tx.participant.findUnique({
          where: { userId },
          select: { id: true, roomId: true },
        });

        if (!participant || participant.roomId !== roomId) {
          throw new ForbiddenException('You are not a resident of this room');
        }

        const room = await tx.room.findUnique({
          where: { id: roomId },
          include: { owner: true },
        });

        if (!room) {
          throw new NotFoundException('Room not found');
        }

        if (room.owner.userId === userId) {
          throw new ForbiddenException('The owner cannot leave the room. Use deleteRoom instead.');
        }

        if (room.status === RoomStatus.Confirmed) {
          throw new ConflictException('Cannot leave a confirmed room');
        }

        // Revoke the accepted invitation so it doesn't show stale "Accepted" status
        await tx.invitation.updateMany({
          where: {
            roomId: roomId,
            guestId: participant.id,
            status: InvitationStatus.Accepted,
          },
          data: { status: InvitationStatus.Rejected },
        });

        return tx.room.update({
          where: { id: roomId },
          data: {
            residents: {
              disconnect: { id: participant.id },
            },
          },
          include: { residents: true },
        });
      });
    } catch (error) {
      this.handlePrismaError(error);
      throw error;
    }
  }

  async removeParticipant(userId: string, roomId: string, participantId: string) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const room = await tx.room.findUnique({
          where: { id: roomId },
          include: { owner: true, residents: true },
        });

        if (!room) {
          throw new NotFoundException('Room not found');
        }

        if (room.owner.userId !== userId) {
          throw new ForbiddenException('Only the room owner can remove participants');
        }

        if (room.owner.id === participantId) {
          throw new ForbiddenException('Cannot remove the room owner');
        }

        // Verify the target is actually a resident of this room
        const isResident = room.residents.some((r) => r.id === participantId);
        if (!isResident) {
          throw new NotFoundException('Participant is not a resident of this room');
        }

        if (room.status === RoomStatus.Confirmed) {
          throw new ConflictException('Cannot remove participants from a confirmed room');
        }

        // Revoke the accepted invitation so it doesn't show stale "Accepted" status
        await tx.invitation.updateMany({
          where: {
            roomId: roomId,
            guestId: participantId,
            status: InvitationStatus.Accepted,
          },
          data: { status: InvitationStatus.Rejected },
        });

        return tx.room.update({
          where: { id: roomId },
          data: {
            residents: {
              disconnect: { id: participantId },
            },
          },
          include: { residents: true },
        });
      });
    } catch (error) {
      this.handlePrismaError(error);
      throw error;
    }
  }

  private handlePrismaError(error: unknown): void {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException('A record with this data already exists');
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
