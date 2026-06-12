import { randomUUID } from 'crypto';
import { Account } from '../../auth/entities/account.entity';
import { Participant } from '../../registration/entities/participant.entity';
import { InvitationStatus } from '../domain/rooming.types';
import { Invitation } from '../entities/invitation.entity';
import { Room } from '../entities/room.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RoomInvitationCreatedEvent } from '../events/rooming.events';
import { DomainEvents } from '../../../common/events/event-names';
export class RoomingService {
	constructor(private readonly eventEmitter: EventEmitter2) { }
	createRoom(owner: Participant): Room {
		const room = new Room();
		room.roomId = randomUUID();
		room.size = 1;
		room.confirmed = false;
		room.owner = owner;
		room.residents = [owner];
		room.invitations = [];
		return room;
	}

	deleteRoom(room: Room): void {
		room.residents = [];
		room.invitations = [];
	}

	inviteParticipant(room: Room, inviter: Account, guest: Participant): void {
		const invitation = new Invitation();
		invitation.id = randomUUID();
		invitation.timestamp = new Date();
		invitation.guest = guest;
		invitation.status = InvitationStatus.Pending;
		room.invitations.push(invitation);

		this.eventEmitter.emit(
			DomainEvents.ROOM_INVITATION_CREATED,
			new RoomInvitationCreatedEvent(
				invitation.id,
				room.roomId,
				guest.id,
				guest.email,
				`${guest.name} ${guest.lastName}`,
				`${inviter.name} ${inviter.lastName}`,
				InvitationStatus.Pending,
				invitation.timestamp,
			)
		);
	}

	respondToInvitation(inv: Invitation, accept: boolean): void {
		inv.status = accept ? InvitationStatus.Accepted : InvitationStatus.Rejected;
	}

	removeParticipant(room: Room, remover: Account, target: Participant): void {
		void remover;
		room.residents = room.residents.filter((resident) => resident !== target);
	}

	confirmRoom(room: Room): void {
		room.confirmed = true;
	}
}
