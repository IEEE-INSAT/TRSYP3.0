import { BaseDomainEvent } from '../../../common/events/base-domain.event';

export class PaymentProofSubmittedEvent extends BaseDomainEvent {
  constructor(
    public readonly paymentId: string,
    public readonly participantId: string,
    public readonly participantName: string,
    public readonly participantEmail: string,
    public readonly submissionTimestamp: Date,
  ) { super(); }
}
export class PaymentStatusUpdatedEvent extends BaseDomainEvent {
  constructor(
    public readonly paymentId: string,
    public readonly participantId: string,
    public readonly participantEmail: string,
    public readonly participantName: string,
    public readonly amount: number,
    public readonly status: 'Approved' | 'Rejected',
    public readonly nextSteps: string,
  ) { super(); }
}