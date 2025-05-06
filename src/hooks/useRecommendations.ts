import { useState, useCallback } from "react";
import type { RecommendationDTO, RecommendationFeedbackType } from "../types";
import type { EnhancedRecommendationViewModel } from "../types/recommendations";
import type { RecommendationReason, MetadataInsight } from "../types/recommendations";

interface UseRecommendationsParams {
  userId: string;
  type: "music" | "film";
}

export function useRecommendations({ userId, type }: UseRecommendationsParams) {
  const [recommendations, setRecommendations] = useState<EnhancedRecommendationViewModel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const fetchRecommendationReason = useCallback(
    async (userId: string, recommendationId: number) => {
      try {
        const url = `/api/users/${encodeURIComponent(userId)}/recommendations/${recommendationId}/reason`;

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error("Failed to fetch recommendation reason");
        }
        return (await response.json()) as RecommendationReason;
      } catch (error) {
        return {
          primaryReason: "Brak danych",
          detailedReasons: [],
          relatedItems: [],
        } as RecommendationReason;
      }
    },
    []
  );

  const fetchMetadataInsight = useCallback(async (userId: string, recommendationId: number) => {
    try {
      const url = `/api/users/${encodeURIComponent(userId)}/recommendations/${recommendationId}/metadata`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch metadata insight");
      }
      return (await response.json()) as MetadataInsight;
    } catch (error) {
      return {
        recommendationId,
        primaryFactors: [],
        secondaryFactors: [],
        uniqueFactors: [],
      } as MetadataInsight;
    }
  }, []);

  const fetchRecommendations = useCallback(
    async (forceRefresh = false) => {
      setIsLoading(true);
      setError(null);

      try {
        const url = `/api/users/${encodeURIComponent(userId)}/recommendations?type=${type}&force_refresh=${forceRefresh}`;

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error("Error fetching recommendations");
        }

        const data: RecommendationDTO[] = await response.json();

        const enhancedRecommendations = await Promise.all(
          data.map(async (recommendation) => {
            const reason = await fetchRecommendationReason(userId, recommendation.id);
            const metadataInsight = await fetchMetadataInsight(userId, recommendation.id);

            return {
              recommendation,
              reason,
              metadataInsight,
              isNew: true,
            } as EnhancedRecommendationViewModel;
          })
        );

        setRecommendations(enhancedRecommendations);
        setCurrentIndex(0);
      } catch (error) {
        if (error instanceof Error) {
          setError(error);
        } else {
          setError(new Error("An unknown error occurred"));
        }
      } finally {
        setIsLoading(false);
      }
    },
    [userId, type, fetchRecommendationReason, fetchMetadataInsight]
  );

  const submitFeedback = useCallback(
    async (recommendationId: number, feedbackType: RecommendationFeedbackType) => {
      try {
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
      } catch (error) {
        // Return a mock response instead of throwing to prevent UI crashes
        return {
          success: false,
          message: "Failed to save feedback, but continuing with UI flow",
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    [userId]
  );

  return {
    recommendations,
    isLoading,
    error,
    currentIndex,
    setCurrentIndex,
    fetchRecommendations,
    submitFeedback,
    showNextRecommendation: () => {
      if (currentIndex < recommendations.length - 1) {
        setCurrentIndex(currentIndex + 1);
      }
    },
    showPreviousRecommendation: () => {
      if (currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
      }
    },
    hasNext: currentIndex < recommendations.length - 1,
    hasPrevious: currentIndex > 0,
    currentRecommendation: recommendations[currentIndex] || null,
  };
}
