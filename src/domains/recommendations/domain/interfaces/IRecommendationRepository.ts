import { Recommendation } from "../models/Recommendation";
import { RecommendationType } from "../enums/RecommendationType";

export interface IRecommendationRepository {
  findByUserAndType(userId: string, type: RecommendationType): Promise<Recommendation[]>;
  findById(id: string): Promise<Recommendation | null>;
  save(recommendation: Recommendation): Promise<void>;
}
