import React, { useState, memo } from "react";
import type { EnhancedRecommendationViewModel } from "../types/recommendations";
import type { RecommendationFeedbackType } from "../types";
import { RecommendationContent } from "./RecommendationContent";
import { RecommendationReason } from "./RecommendationReason";
import { SwipeControls } from "./SwipeControls";
import { useSwipeGesture } from "../hooks/useSwipeGesture";

interface RecommendationCardProps {
  recommendation: EnhancedRecommendationViewModel;
  onFeedback: (recommendationId: number, feedbackType: RecommendationFeedbackType) => void;
}

export const RecommendationCard = memo(function RecommendationCard({
  recommendation,
  onFeedback,
}: RecommendationCardProps) {
  const [isReasonExpanded, setIsReasonExpanded] = useState(false);

  const handleLike = () => {
    onFeedback(recommendation.recommendation.id, "like");
  };

  const handleDislike = () => {
    onFeedback(recommendation.recommendation.id, "dislike");
  };

  const { handlers } = useSwipeGesture(handleDislike, handleLike);

  return (
    <div className="bg-card rounded-lg shadow-md overflow-hidden max-w-md w-full mx-auto" {...handlers}>
      <div className="p-5">
        <RecommendationContent
          data={recommendation.recommendation.data}
          items={recommendation.recommendation.data.items}
        />

        <RecommendationReason
          reason={recommendation.reason}
          expanded={isReasonExpanded}
          onToggle={() => setIsReasonExpanded(!isReasonExpanded)}
        />
      </div>

      <div className="border-t border-border p-4">
        <SwipeControls onLike={handleLike} onDislike={handleDislike} />
      </div>
    </div>
  );
});
