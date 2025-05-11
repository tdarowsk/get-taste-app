import { Recommendation } from "../../domain/models/Recommendation";
import { RecommendationType } from "../../domain/enums/RecommendationType";
import { IRecommendationRepository } from "../../domain/interfaces/IRecommendationRepository";
import { IMetadataService } from "../../domain/interfaces/IMetadataService";
import { IDomainEventEmitter } from "../../domain/interfaces/IDomainEventEmitter";
import { RecommendationsRefreshedEvent } from "../../domain/events/RecommendationsRefreshedEvent";

export class GetRecommendationsUseCase {
  constructor(
    private recommendationRepository: IRecommendationRepository,
    private metadataService: IMetadataService,
    private eventEmitter: IDomainEventEmitter
  ) {}

  async execute(
    userId: string,
    type: RecommendationType,
    forceRefresh: boolean
  ): Promise<Recommendation[]> {
    if (forceRefresh) {
      return this.refreshRecommendations(userId, type);
    }

    const recommendations = await this.recommendationRepository.findByUserAndType(userId, type);
    if (recommendations.length === 0) {
      return this.refreshRecommendations(userId, type);
    }

    return recommendations;
  }

  private async refreshRecommendations(
    userId: string,
    type: RecommendationType
  ): Promise<Recommendation[]> {
    // In a real implementation, this would call an API or service to generate new recommendations
    // For now, we'll just return empty array as a placeholder
    const recommendations: Recommendation[] = [];

    // Emit event for other parts of the system that might be interested
    this.eventEmitter.emit(new RecommendationsRefreshedEvent(userId, type, recommendations));

    return recommendations;
  }
}
