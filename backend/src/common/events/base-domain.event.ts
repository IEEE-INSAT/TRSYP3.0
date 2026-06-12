import { randomUUID } from 'crypto';

export abstract class BaseDomainEvent {
  readonly occurredAt: Date;
  readonly eventId: string;
  
  constructor() {
    this.occurredAt = new Date();
    this.eventId = randomUUID();
  }
}