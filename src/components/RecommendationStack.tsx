import React, { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import type { EnhancedRecommendationViewModel } from "../types/recommendations";
import type { RecommendationFeedbackType } from "../types";
import { SwipeableRecommendationCard } from "./dashboard/SwipeableRecommendationCard";
import { CardTransitionWrapper } from "./swipe-animation/CardTransitionWrapper";
import type { RecommendationItemViewModel } from "../lib/types/viewModels";
import { AnimationProvider } from "./swipe-animation";

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
  const [direction, setDirection] = useState<"enter" | "exit" | "center">("center");
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | "none">("none");

  // Reset animation states when recommendations change
  useEffect(() => {
    setDirection("center");
    setSwipeDirection("none");
  }, [recommendations]);

  // Reset index when recommendations change
  useEffect(() => {
    if (currentIndex === 0) {
      setDirection("enter");

      // Szybsze przejście do centrum dla lepszego UX
      setTimeout(() => {
        setDirection("center");
      }, 150);
    }
  }, [recommendations, currentIndex]);

  if (recommendations.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-lg text-muted-foreground">Brak rekomendacji</p>
      </div>
    );
  }

  const currentRecommendation = recommendations[currentIndex];

  const transformToItemViewModel = (
    recommendation: EnhancedRecommendationViewModel
  ): RecommendationItemViewModel => {
    const firstItem = recommendation.recommendation.data.items?.[0];
    return {
      id: String(recommendation.recommendation.id),
      name: firstItem?.name || recommendation.recommendation.data.title || "Brak tytułu",
      description: recommendation.recommendation.data.description || undefined,
      imageUrl: firstItem?.details?.imageUrl as string | undefined,
      type: recommendation.recommendation.type,
      metadata: {
        ...firstItem?.details,
        type: recommendation.recommendation.type,
      },
    };
  };

  const handleSwipe = async (_itemId: string, feedbackType: RecommendationFeedbackType) => {
    try {
      // Set animation direction based on feedback type
      setSwipeDirection(feedbackType === "like" ? "right" : "left");
      setDirection("exit");

      // Give more time for exit animation to complete
      await new Promise((resolve) => setTimeout(resolve, 400));

      // Process feedback with metadata after animation
      await onFeedback(currentRecommendation.recommendation.id, feedbackType);

      // Move to next card
      onNext();

      // Short delay before starting enter animation
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Transition to enter animation
      setDirection("enter");
      setSwipeDirection("none");

      // Smoother transition to center
      setTimeout(() => {
        setDirection("center");
      }, 150);
    } catch {
      setDirection("center");
      setSwipeDirection("none");
    }
  };

  const itemViewModel = transformToItemViewModel(currentRecommendation);

  return (
    <AnimationProvider>
      <div className="relative min-h-[450px]">
        <AnimatePresence mode="wait">
          <CardTransitionWrapper
            key={currentRecommendation.recommendation.id}
            index={currentIndex}
            activeIndex={currentIndex}
            direction={direction}
            swipeDirection={swipeDirection}
          >
            <SwipeableRecommendationCard
              item={itemViewModel}
              type={currentRecommendation.recommendation.type}
              recommendationId={currentRecommendation.recommendation.id}
              userId={userId}
              onSwipe={handleSwipe}
            />
          </CardTransitionWrapper>
        </AnimatePresence>

        {/* Progress indicator */}
        <div className="absolute bottom-[-30px] left-0 right-0 flex justify-center items-center">
          <div className="flex space-x-1">
            {recommendations.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full 
                  ${i === currentIndex ? "w-6 bg-primary" : i < currentIndex ? "w-2 bg-primary/60" : "w-2 bg-gray-200"}`}
              />
            ))}
          </div>
        </div>
      </div>
    </AnimationProvider>
  );
}
