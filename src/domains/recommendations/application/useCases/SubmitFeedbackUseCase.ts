import { Feedback } from "../../domain/models/Feedback";
import { FeedbackType } from "../../domain/enums/FeedbackType";
import { IFeedbackRepository } from "../../domain/interfaces/IFeedbackRepository";
import { IDomainEventEmitter } from "../../domain/interfaces/IDomainEventEmitter";
import { FeedbackSubmittedEvent } from "../../domain/events/FeedbackSubmittedEvent";
import { IRecommendationRepository } from "../../domain/interfaces/IRecommendationRepository";

export class SubmitFeedbackUseCase {
  constructor(
    private feedbackRepository: IFeedbackRepository,
    private recommendationRepository: IRecommendationRepository,
    private eventEmitter: IDomainEventEmitter
  ) {}

  async execute(
    userId: string,
    recommendationId: string,
    itemId: string,
    feedbackType: FeedbackType
  ): Promise<Feedback> {
    // Validate that recommendation exists
    const recommendation = await this.recommendationRepository.findById(recommendationId);
    if (!recommendation) {
      throw new Error(`Recommendation with id ${recommendationId} not found`);
    }

    // Validate that item exists in recommendation
    const item = recommendation.getItemById(itemId);
    if (!item) {
      throw new Error(`Item with id ${itemId} not found in recommendation ${recommendationId}`);
    }

    // Create feedback object with a generated ID
    // In a real implementation, we would use a more robust ID generation strategy
    const feedbackId = `feedback_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const feedback = new Feedback(
      feedbackId,
      recommendationId,
      itemId,
      feedbackType,
      userId,
      new Date()
    );

    await this.feedbackRepository.save(feedback);

    // Notify system about the feedback submission
    this.eventEmitter.emit(new FeedbackSubmittedEvent(feedback));

    return feedback;
  }
}
