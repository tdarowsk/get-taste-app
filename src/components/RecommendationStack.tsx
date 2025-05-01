import React from "react";
import type { EnhancedRecommendationViewModel } from "../types/recommendations";
import type { RecommendationFeedbackType } from "../types";
import { SwipeableRecommendationCard } from "./dashboard/SwipeableRecommendationCard";
import type { RecommendationItemViewModel } from "../lib/types/viewModels";

interface RecommendationStackProps {
  recommendations: EnhancedRecommendationViewModel[];
  onFeedback: (recommendationId: number, feedbackType: RecommendationFeedbackType) => void;
  currentIndex: number;
  onNext: () => void;
  userId: string;
}

export function RecommendationStack({
  recommendations,
  onFeedback,
  currentIndex,
  onNext,
  userId,
}: RecommendationStackProps) {
  if (recommendations.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-lg text-muted-foreground">Brak rekomendacji</p>
      </div>
    );
  }

  const currentRecommendation = recommendations[currentIndex];

  const transformToItemViewModel = (recommendation: EnhancedRecommendationViewModel): RecommendationItemViewModel => {
    const firstItem = recommendation.recommendation.data.items?.[0];
    return {
      id: String(recommendation.recommendation.id),
      name: firstItem?.name || recommendation.recommendation.data.title || "Brak tytułu",
      description: recommendation.recommendation.data.description || undefined,
      imageUrl: firstItem?.details?.imageUrl as string | undefined,
      metadata: {
        ...firstItem?.details,
        type: recommendation.recommendation.type,
      },
    };
  };

  const handleSwipe = async (itemId: string, feedbackType: RecommendationFeedbackType) => {
    try {
      await onFeedback(currentRecommendation.recommendation.id, feedbackType);
      onNext();
    } catch (error) {
      console.error("Error processing swipe:", error);
    }
  };

  const itemViewModel = transformToItemViewModel(currentRecommendation);

  return (
    <div className="relative">
      <SwipeableRecommendationCard
        item={itemViewModel}
        type={currentRecommendation.recommendation.type}
        recommendationId={currentRecommendation.recommendation.id}
        userId={userId}
        onSwipe={handleSwipe}
      />
    </div>
  );
}
