/**
 * Event emitted when a participant successfully registers
 */
export class ParticipantRegisteredEvent {
  constructor(
    public readonly participantId: string,
    public readonly userId: string,
    public readonly isInternational: boolean,
  ) {}
}

/**
 * Event emitted when a participant changes a detail their IEEE membership is
 * looked up by (their IEEE member number), so it is checked again.
 */
export class ParticipantIeeeDetailsChangedEvent {
  constructor(public readonly participantId: string) {}
}

/**
 * Event emitted when a visa letter is requested
 */
export class VisaRequestedEvent {
  constructor(
    public readonly participantId: string,
    public readonly visaApplicationId: string,
  ) {}
}

/**
 * Event emitted when a participant is deleted
 */
export class ParticipantDeletedEvent {
  constructor(
    public readonly participantId: string,
    public readonly userId: string,
  ) {}
}

/**
 * Event emitted when a participant is banned
 */
export class ParticipantBannedEvent {
  constructor(
    public readonly participantId: string,
    public readonly reason: string,
  ) {}
}

/**
 * Event emitted when a participant is unbanned
 */
export class ParticipantUnbannedEvent {
  constructor(public readonly participantId: string) {}
}

/**
 * Event emitted when payment status changes
 */
export class ParticipantPaidEvent {
  constructor(
    public readonly participantId: string,
    public readonly paid: boolean,
  ) {}
}

/**
 * Event emitted when visa application status changes
 */
export class VisaStatusChangedEvent {
  constructor(
    public readonly visaApplicationId: string,
    public readonly participantId: string,
    public readonly oldStatus: string,
    public readonly newStatus: string,
  ) {}
}

/**
 * Event names for EventEmitter2
 */
export const REGISTRATION_EVENTS = {
  PARTICIPANT_REGISTERED: 'participant.registered',
  PARTICIPANT_IEEE_DETAILS_CHANGED: 'participant.ieee_details_changed',
  PARTICIPANT_DELETED: 'participant.deleted',
  PARTICIPANT_BANNED: 'participant.banned',
  PARTICIPANT_UNBANNED: 'participant.unbanned',
  PARTICIPANT_PAID: 'participant.paid',
  VISA_REQUESTED: 'visa.requested',
  VISA_STATUS_CHANGED: 'visa.status.changed',
} as const;

