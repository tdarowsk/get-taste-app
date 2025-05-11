import { MetadataInsight } from "../models/MetadataInsight";

export interface IMetadataService {
  getInsightForRecommendation(userId: string, recommendationId: string): Promise<MetadataInsight>;
  updateWeights(userId: string, weights: { type: string; weight: number }[]): Promise<void>;
}
