import { Recommendation } from "../models/Recommendation";
import { RecommendationType } from "../enums/RecommendationType";
import type { DomainEvent } from "../interfaces/IDomainEventEmitter";

export class RecommendationsRefreshedEvent implements DomainEvent {
  public readonly eventType: string = "recommendations.refreshed";
  public readonly timestamp: number;

  constructor(
    public readonly userId: string,
    public readonly type: RecommendationType,
    public readonly recommendations: Recommendation[]
  ) {
    this.timestamp = Date.now();
  }
}
