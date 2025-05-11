import type { RecommendationDTO, RecommendationFeedbackType } from "../types";
import type { RecommendationReason, MetadataInsight } from "../types/recommendations";

export const recommendationService = {
  async getRecommendations(userId: string, type: "music" | "film", forceRefresh = false) {
    const url = `/api/users/${encodeURIComponent(userId)}/recommendations?type=${type}&force_refresh=${forceRefresh}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Error fetching recommendations");
    }

    return (await response.json()) as RecommendationDTO[];
  },

  async getRecommendationReason(userId: string, recommendationId: number) {
    const url = `/api/users/${encodeURIComponent(userId)}/recommendations/${recommendationId}/reason`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Failed to fetch recommendation reason");
    }

    return (await response.json()) as RecommendationReason;
  },

  async getMetadataInsight(userId: string, recommendationId: number) {
    const url = `/api/users/${encodeURIComponent(userId)}/recommendations/${recommendationId}/metadata`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Failed to fetch metadata insight");
    }

    return (await response.json()) as MetadataInsight;
  },

  async submitFeedback(
    userId: string,
    recommendationId: number,
    feedbackType: RecommendationFeedbackType
  ) {
    const response = await fetch(
      `/api/users/${encodeURIComponent(userId)}/recommendations/${recommendationId}/feedback`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ feedback_type: feedbackType }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Error submitting feedback");
    }

    return await response.json();
  },
};
