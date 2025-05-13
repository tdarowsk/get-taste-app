import { Feedback } from "../models/Feedback";
import type { DomainEvent } from "../interfaces/IDomainEventEmitter";

export class FeedbackSubmittedEvent implements DomainEvent {
  readonly eventType: string = "FeedbackSubmitted";
  readonly timestamp: number;

  constructor(public readonly feedback: Feedback) {
    this.timestamp = Date.now();
  }
}
