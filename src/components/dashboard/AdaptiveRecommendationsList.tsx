import { useState, useEffect } from "react";
import { SwipeableRecommendationCard } from "./SwipeableRecommendationCard";
import type { RecommendationViewModel } from "../../lib/types/viewModels";
import { transformRecommendationToViewModel } from "../../lib/utils/transformers";
import type { RecommendationDTO, RecommendationFeedbackType } from "../../types";
import { useToast } from "../ui";
import { FeedbackService } from "../../lib/services/feedback.service";
import { AnimationProvider } from "../swipe-animation";
import { featureFlagService } from "../../features/featureFlagService";

interface AdaptiveRecommendationsListProps {
  recommendations: RecommendationDTO[] | undefined;
  isLoading: boolean;
  type: "music" | "film";
  isNewUser?: boolean;
  userId: string;
  onFeedbackProcessed?: () => void;
  featureEnabled?: boolean; // Opcjonalna flaga przekazana z góry
}

interface RecommendationItemWithType {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  metadata: Record<string, unknown>;
  type: "music" | "film";
  recommendationId: number;
}

export function AdaptiveRecommendationsList({
  recommendations,
  isLoading,
  type,
  isNewUser = false,
  userId,
  onFeedbackProcessed,
  featureEnabled,
}: AdaptiveRecommendationsListProps) {
  const { toast } = useToast();
  const [processedItems, setProcessedItems] = useState<Set<string>>(new Set());
  const [viewModels, setViewModels] = useState<RecommendationViewModel[]>([]);
  const [allItems, setAllItems] = useState<RecommendationItemWithType[]>([]);
  const [hasProcessedData, setHasProcessedData] = useState(false);
  const [featureIsEnabled, setFeatureIsEnabled] = useState<boolean>(true);

  // Create user context for feature flag check - przeniesione przed useEffect
  useEffect(() => {
    // Sprawdzamy feature flag tylko raz podczas inicjalizacji komponentu
    const isAdaptiveEnabled =
      featureEnabled !== undefined
        ? featureEnabled
        : featureFlagService.isFeatureEnabled("collections.recommendations.adaptive", {
            id: userId,
            role: isNewUser ? "new_user" : "user",
          });

    setFeatureIsEnabled(isAdaptiveEnabled);
  }, [featureEnabled, userId, isNewUser]);

  // Process recommendations when they change
  useEffect(() => {
    if (recommendations && recommendations.length > 0) {
      try {
        // Filter by type
        const filteredRecs = recommendations.filter((rec) => {
          if (!rec) return false;

          // Check if type is undefined or doesn't match
          if (!rec.type) {
            return false;
          }

          const isMatchingType = rec.type === type;

          return isMatchingType;
        });

        if (filteredRecs.length === 0) {
          setViewModels([]);
          setAllItems([]);
          setHasProcessedData(true);
          return;
        }

        // Transform to view models
        const transformPromises = filteredRecs.map((dto) =>
          transformRecommendationToViewModel(dto)
        );

        // Use Promise.all to wait for all transformations to complete
        Promise.all(transformPromises)
          .then((resolvedViewModels) => {
            setViewModels(resolvedViewModels);

            // Extract all items
            const items = resolvedViewModels.flatMap((vm) => {
              if (!vm.items || vm.items.length === 0) {
                return [];
              }

              return vm.items.map((item) => ({
                ...item,
                type: vm.type,
                recommendationId: vm.id,
              }));
            });

            setAllItems(items);
            setHasProcessedData(true);
          })
          .catch(() => {
            setHasProcessedData(true);
          });
      } catch {
        setHasProcessedData(true);
      }
    } else {
      setViewModels([]);
      setAllItems([]);
      setHasProcessedData(true);
    }
  }, [recommendations, type]);

  // If adaptive recommendations are disabled, show a message
  if (!featureIsEnabled) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] text-center p-8 bg-white/5 backdrop-blur-sm rounded-b-lg">
        <div className="bg-gradient-to-br from-purple-900/30 to-indigo-900/30 p-6 rounded-full mb-6 border border-white/10">
          <svg
            className="h-12 w-12 text-purple-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
        <h3 className="text-xl font-semibold mb-2 text-white">
          Adaptive Recommendations Unavailable
        </h3>
        <p className="text-gray-300 max-w-md mb-6">
          This feature is currently disabled in your environment.
        </p>
      </div>
    );
  }

  // Handle loading state - only show if we're actually loading and haven't processed data yet
  if (isLoading && !hasProcessedData) {
    return (
      <div className="flex items-center justify-center min-h-[300px] bg-white/5 backdrop-blur-sm">
        <div className="flex flex-col items-center">
          <div className="relative h-12 w-12 mb-4">
            <div className="absolute inset-0 rounded-full border-t-2 border-purple-500 animate-spin"></div>
            <div className="absolute inset-3 rounded-full border-2 border-purple-500/30"></div>
          </div>
          <p className="text-gray-300 font-medium">
            {isNewUser
              ? "Loading popular recommendations..."
              : "Loading your personalized recommendations..."}
          </p>
        </div>
      </div>
    );
  }

  // Handle empty state
  if (hasProcessedData && allItems.length === 0)
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] text-center p-8 bg-white/5 backdrop-blur-sm rounded-b-lg">
        <div className="bg-gradient-to-br from-purple-900/30 to-indigo-900/30 p-6 rounded-full mb-6 border border-white/10">
          <svg
            className="h-12 w-12 text-purple-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            ></path>
          </svg>
        </div>
        <h3 className="text-xl font-semibold mb-2 text-white">No {type} recommendations yet</h3>
        <p className="text-gray-300 max-w-md mb-6">
          {isNewUser
            ? "We're having trouble loading popular recommendations. Please try refreshing."
            : "Update your preferences to get personalized recommendations tailored to your taste"}
        </p>
        <button
          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-md hover:from-purple-700 hover:to-indigo-700 transition-colors shadow-md"
          onClick={() => window.location.reload()}
        >
          {isNewUser ? "Refresh" : "Set Your Preferences"}
        </button>
      </div>
    );

  // Filter out processed items
  const activeItems = allItems.filter((item) => !processedItems.has(item.id));

  // Handler for swipe actions
  const handleSwipe = async (
    itemId: string,
    feedbackType: RecommendationFeedbackType,
    metadata: Record<string, unknown> = {}
  ) => {
    try {
      // Validate userId
      if (!userId || userId === "undefined") {
        throw new Error("Invalid user ID");
      }

      // Find the recommendation this item belongs to
      const item = allItems.find((i) => i.id === itemId);
      if (!item) {
        throw new Error("Item not found");
      }

      // Add item to processed set
      setProcessedItems((prev) => new Set([...prev, itemId]));

      // Save feedback to database and update algorithm
      await FeedbackService.saveSwipeFeedback(userId, item.recommendationId, feedbackType, {
        ...metadata,
        name: item.name,
        id: item.id,
        type: item.type,
      });

      // Show visual confirmation to the user
      toast({
        title: "Taste profile updated",
        description: "Your feedback has been saved and is now influencing your recommendations",
        variant: "default",
      });

      // Notify parent component that feedback was processed
      if (onFeedbackProcessed) {
        onFeedbackProcessed();
      }
    } catch {
      toast({
        title: "Error updating taste profile",
        description: "There was a problem saving your feedback. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Case where all items have been swiped
  if (activeItems.length === 0) {
    return (
      <div className="p-6 bg-white/5 backdrop-blur-sm rounded-b-lg">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="bg-gradient-to-br from-green-900/30 to-blue-900/30 p-6 rounded-full mb-6 border border-white/10">
            <svg
              className="h-12 w-12 text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
          </div>
          <h3 className="text-xl font-semibold mb-2 text-white">All caught up!</h3>
          <p className="text-gray-300 max-w-md mb-6">
            You&apos;ve rated all the current recommendations. Your taste profile is being updated.
          </p>
          <button
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-md hover:from-purple-700 hover:to-indigo-700 transition-colors shadow-md"
            onClick={() => window.location.reload()}
            data-testid="reload-button"
          >
            Get New Recommendations
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white/5 backdrop-blur-sm rounded-b-lg">
      <h3 className="text-lg font-medium mb-3 text-white">
        {viewModels[0]?.title ||
          (type === "music" ? "Music Recommendations" : "Film Recommendations")}
      </h3>

      <p className="text-xs text-gray-300 mb-4">
        Swipe right to like, left to dislike. Your feedback trains the algorithm!
      </p>

      <AnimationProvider>
        <div
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4"
          data-testid="swipe-grid"
        >
          {activeItems.map((item) => (
            <SwipeableRecommendationCard
              key={item.id}
              item={item}
              type={item.type}
              recommendationId={item.recommendationId}
              userId={userId}
              onSwipe={handleSwipe}
            />
          ))}
        </div>
      </AnimationProvider>
    </div>
  );
}
