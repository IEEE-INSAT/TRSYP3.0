import { BaseDomainEvent } from '../../../common/events/base-domain.event';

export class RoomInvitationCreatedEvent extends BaseDomainEvent {
  constructor(
    public readonly invitationId: string,
    public readonly roomId: string,
    public readonly guestId: string,
    public readonly guestEmail: string,
    public readonly guestName: string,
    public readonly ownerName: string,
    public readonly invitationStatus: string, // 'Pending'
    public readonly timestamp: Date,
    // Optional: checkInDate, checkOutDate if added to Room
  ) { super(); }
}

export class RoomCreatedEvent extends BaseDomainEvent {
	constructor(
		public readonly roomId: string,
		public readonly ownerId: string,
		public readonly timestamp: Date,
    public readonly size : number,
	) { super(); }
}

export class RoomInvitationRespondedEvent extends BaseDomainEvent {
	constructor(
		public readonly invitationId: string,
		public readonly roomId: string,
		public readonly guestId: string,
		public readonly invitationStatus: string, // 'Accepted' or 'Rejected'
		public readonly timestamp: Date,
    public readonly OwnerId:string,
		// Optional: checkInDate, checkOutDate if added to Room
	) { super(); }
}

export class RoomConfirmedEvent extends BaseDomainEvent {
	constructor(
		public readonly roomId: string,
		public readonly ownerId: string,
		public readonly timestamp: Date,
    public readonly residentIds:string[],
	) { super(); }
}

export class RoomDeletedEvent extends BaseDomainEvent {
	constructor(
		public readonly roomId: string,
		public readonly ownerId: string,
		public readonly timestamp: Date,
	) { super(); }
}