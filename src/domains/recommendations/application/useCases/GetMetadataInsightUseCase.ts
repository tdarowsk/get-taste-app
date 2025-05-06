import { IMetadataService } from "../../domain/interfaces/IMetadataService";
import { IRecommendationRepository } from "../../domain/interfaces/IRecommendationRepository";
import { MetadataInsight } from "../../domain/models/MetadataInsight";

export class GetMetadataInsightUseCase {
  constructor(
    private metadataService: IMetadataService,
    private recommendationRepository: IRecommendationRepository
  ) {}

  async execute(userId: string, recommendationId: string): Promise<MetadataInsight> {
    // Validate that recommendation exists and belongs to the user
    const recommendation = await this.recommendationRepository.findById(recommendationId);
    if (!recommendation) {
      throw new Error(`Recommendation with id ${recommendationId} not found`);
    }

    if (recommendation.userId !== userId) {
      throw new Error(
        `Recommendation with id ${recommendationId} does not belong to user ${userId}`
      );
    }

    // Get metadata insight for the recommendation
    return await this.metadataService.getInsightForRecommendation(userId, recommendationId);
  }
}
