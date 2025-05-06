import { Recommendation } from "../models/Recommendation";
import { RecommendationType } from "../enums/RecommendationType";

export class RecommendationsRefreshedEvent {
  constructor(
    public readonly userId: string,
    public readonly type: RecommendationType,
    public readonly recommendations: Recommendation[]
  ) {}
}
