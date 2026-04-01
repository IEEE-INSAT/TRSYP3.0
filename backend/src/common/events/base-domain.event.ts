/**
 * Base class for domain events
 */
export abstract class BaseDomainEvent {
  public readonly occurredAt: Date;

  constructor() {
    this.occurredAt = new Date();
  }
}
