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