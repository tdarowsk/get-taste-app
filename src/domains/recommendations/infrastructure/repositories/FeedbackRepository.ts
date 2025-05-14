import { Feedback } from "../../domain/models/Feedback";
import type { IFeedbackRepository } from "../../domain/interfaces/IFeedbackRepository";
import type { DataSource } from "../data/DataSource";
import { FeedbackType } from "../../domain/enums/FeedbackType";

interface FeedbackDTO {
  id: number;
  recommendation_id: number;
  user_id: string;
  feedback_type: "like" | "dislike";
  created_at: string;
}

export class FeedbackRepository implements IFeedbackRepository {
  constructor(private readonly dataSource: DataSource) {}

  async save(feedback: Feedback): Promise<void> {
    await this.dataSource.query(
      `/api/users/${encodeURIComponent(feedback.userId)}/recommendations/${feedback.recommendationId}/feedback`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ feedback_type: feedback.type }),
      }
    );
  }

  async findByRecommendationId(recommendationId: string): Promise<Feedback[]> {
    const feedbackDTOs = await this.dataSource.query<FeedbackDTO[]>(
      `/api/recommendations/${recommendationId}/feedback`
    );

    return feedbackDTOs.map((dto) => this.mapDtoToDomain(dto));
  }

  async findByUserId(userId: string): Promise<Feedback[]> {
    const feedbackDTOs = await this.dataSource.query<FeedbackDTO[]>(
      `/api/users/${encodeURIComponent(userId)}/feedback`
    );

    return feedbackDTOs.map((dto) => this.mapDtoToDomain(dto));
  }

  private mapDtoToDomain(dto: FeedbackDTO): Feedback {
    return new Feedback(
      String(dto.id),
      String(dto.recommendation_id),
      "", // Item ID not available in the DTO, would need to be handled differently
      dto.feedback_type === "like" ? FeedbackType.LIKE : FeedbackType.DISLIKE,
      dto.user_id,
      new Date(dto.created_at)
    );
  }
}
