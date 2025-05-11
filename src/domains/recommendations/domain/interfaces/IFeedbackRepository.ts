import { Feedback } from "../models/Feedback";

export interface IFeedbackRepository {
  save(feedback: Feedback): Promise<void>;
  findByRecommendationId(recommendationId: string): Promise<Feedback[]>;
  findByUserId(userId: string): Promise<Feedback[]>;
}
