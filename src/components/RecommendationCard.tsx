import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "./ui/card";
import { Button } from "./ui/button";
import type { RecommendationFormValues } from "../types/forms";
import type { EnhancedRecommendationViewModel } from "../types/recommendations";

interface RecommendationCardProps {
  recommendation: EnhancedRecommendationViewModel;
  onFeedback?: (id: number, type: "like" | "dislike") => void;
  showActions?: boolean;
  isActive?: boolean;
}

export const RecommendationCard = ({
  recommendation,
  onFeedback,
  showActions = true,
  isActive = true,
}: RecommendationCardProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const formContext = useFormContext<RecommendationFormValues>();

  const recommendationId = recommendation.recommendation.id;

  const handleLike = async () => {
    if (!isActive) return;

    setIsLoading(true);
    try {
      if (formContext?.setValue) {
        formContext.setValue(
          "feedback",
          { itemId: recommendationId.toString(), type: "like" },
          { shouldDirty: true }
        );
      } else if (onFeedback) {
        onFeedback(recommendationId, "like");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDislike = async () => {
    if (!isActive) return;

    setIsLoading(true);
    try {
      if (formContext?.setValue) {
        formContext.setValue(
          "feedback",
          { itemId: recommendationId.toString(), type: "dislike" },
          { shouldDirty: true }
        );
      } else if (onFeedback) {
        onFeedback(recommendationId, "dislike");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle mouse swipe gestures
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isActive) return;
    const startX = e.clientX;

    const handleMouseUp = (e: MouseEvent) => {
      const endX = e.clientX;
      const diff = endX - startX;

      if (Math.abs(diff) > 50) {
        if (diff > 0) {
          handleLike();
        } else {
          handleDislike();
        }
      }

      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mouseup", handleMouseUp);
  };

  return (
    <Card
      className={`w-full shadow-md transition-all duration-200 ${isActive ? "opacity-100" : "opacity-70"}`}
      onMouseDown={handleMouseDown}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{recommendation.recommendation.data.title}</CardTitle>
            <CardDescription>{recommendation.recommendation.type}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p>{recommendation.reason.primaryReason}</p>
        </div>
      </CardContent>
      {showActions && (
        <CardFooter className="flex justify-between pt-2">
          <Button
            variant="outline"
            onClick={handleDislike}
            disabled={isLoading || !isActive}
            className="w-full mr-2"
            aria-label="Nie lubię"
          >
            👎 Nie lubię
          </Button>
          <Button
            variant="default"
            onClick={handleLike}
            disabled={isLoading || !isActive}
            className="w-full"
            aria-label="Lubię"
          >
            👍 Lubię
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};
