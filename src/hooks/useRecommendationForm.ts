import { useState, useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import type { RecommendationDTO } from "../types";
import type { EnhancedRecommendationViewModel } from "../types/recommendations";
import type { MetadataType } from "../types/recommendations";
import type { RecommendationFormValues } from "../types/forms";
import { recommendationService } from "../services/recommendationService";

interface UseRecommendationFormParams {
  userId: string;
  initialCategory?: "music" | "film";
  initialWeights?: {
    type: MetadataType;
    name: string;
    weight: number;
  }[];
}

export function useRecommendationForm({
  userId,
  initialCategory = "music",
  initialWeights = [],
}: UseRecommendationFormParams) {
  const [recommendations, setRecommendations] = useState<EnhancedRecommendationViewModel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const formMethods = useForm<RecommendationFormValues>({
    defaultValues: {
      category: initialCategory,
      weights: initialWeights,
    },
  });

  const category = formMethods.watch("category");

  const fetchRecommendations = useCallback(
    async (forceRefresh = false) => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await recommendationService.getRecommendations(userId, category, forceRefresh);

        const enhancedRecommendations = await Promise.all(
          data.map(async (recommendation) => {
            const reason = await recommendationService.getRecommendationReason(
              userId,
              recommendation.id
            );
            const metadataInsight = await recommendationService.getMetadataInsight(
              userId,
              recommendation.id
            );

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
        setError(error instanceof Error ? error : new Error("An unknown error occurred"));
      } finally {
        setIsLoading(false);
      }
    },
    [userId, category]
  );

  const handleFormSubmit = useCallback(
    async (data: RecommendationFormValues) => {
      if (!data.feedback || !recommendations[currentIndex]) return;

      const recommendation = recommendations[currentIndex].recommendation;
      const itemId = data.feedback.itemId;

      // Find the item in the current recommendation
      const item = recommendation.data.items.find((item) => item.id === itemId);
      if (!item) return;

      try {
        await recommendationService.submitFeedback(userId, recommendation.id, data.feedback.type);

        // Move to next recommendation
        if (currentIndex < recommendations.length - 1) {
          setCurrentIndex((prev) => prev + 1);
        }

        // Reset feedback
        formMethods.setValue("feedback", undefined);
      } catch (error) {
        setError(error instanceof Error ? error : new Error("Failed to submit feedback"));
      }
    },
    [userId, recommendations, currentIndex, formMethods]
  );

  // Load recommendations when category changes
  useEffect(() => {
    fetchRecommendations();
  }, [category, fetchRecommendations]);

  // Update form when weights change externally
  useEffect(() => {
    if (initialWeights.length > 0) {
      formMethods.setValue("weights", initialWeights);
    }
  }, [initialWeights, formMethods]);

  return {
    formMethods,
    recommendations,
    currentRecommendation: recommendations[currentIndex] || null,
    isLoading,
    error,
    fetchRecommendations,
    handleFormSubmit,
    currentIndex,
    hasNext: currentIndex < recommendations.length - 1,
    hasPrevious: currentIndex > 0,
    showNextRecommendation: () => {
      if (currentIndex < recommendations.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      }
    },
    showPreviousRecommendation: () => {
      if (currentIndex > 0) {
        setCurrentIndex((prev) => prev - 1);
      }
    },
  };
}
