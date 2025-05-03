import { RecommendationCard } from "./RecommendationCard";
import type { RecommendationViewModel } from "../../lib/types/viewModels";
import { transformRecommendationToViewModel } from "../../lib/utils/transformers";
import type { RecommendationDTO } from "../../types";

interface RecommendationsListProps {
  recommendations: RecommendationDTO[] | undefined;
  isLoading: boolean;
  type: "music" | "film";
  isNewUser?: boolean;
}

export function RecommendationsList({ recommendations, isLoading, type, isNewUser = false }: RecommendationsListProps) {
  // Handle loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px] bg-white/5 backdrop-blur-sm">
        <div className="flex flex-col items-center">
          <div className="relative h-12 w-12 mb-4">
            <div className="absolute inset-0 rounded-full border-t-2 border-purple-500 animate-spin"></div>
            <div className="absolute inset-3 rounded-full border-2 border-purple-500/30"></div>
          </div>
          <p className="text-gray-300 font-medium">
            {isNewUser ? "Loading popular recommendations..." : "Loading your personalized recommendations..."}
          </p>
        </div>
      </div>
    );
  }

  // Handle empty state
  if (!recommendations || recommendations.length === 0)
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
        <button className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-md hover:from-purple-700 hover:to-indigo-700 transition-colors shadow-md">
          {isNewUser ? "Refresh" : "Set Your Preferences"}
        </button>
      </div>
    );

  // Filter recommendations by type
  const filteredRecommendations = recommendations.filter((rec) => rec.type === type);

  if (filteredRecommendations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] text-center p-8 bg-white/5 backdrop-blur-sm rounded-b-lg">
        <h3 className="text-xl font-semibold mb-2 text-white">No {type} recommendations available</h3>
        <p className="text-gray-300 max-w-md mb-6">
          {isNewUser
            ? `Try switching to ${type === "music" ? "film" : "music"} recommendations or refresh the page`
            : "Try switching to a different category or updating your preferences"}
        </p>
      </div>
    );
  }

  // Transform DTOs to ViewModels
  const viewModels: RecommendationViewModel[] = filteredRecommendations.map(transformRecommendationToViewModel);

  // Extract items from all recommendations
  const allItems = viewModels.flatMap((recommendation) =>
    recommendation.items.map((item) => ({
      ...item,
      type: recommendation.type,
    }))
  );

  return (
    <div data-testid="recommendations-list" className="p-6 bg-white/5 backdrop-blur-sm rounded-b-lg">
      <h3 className="text-lg font-medium mb-3 text-white">
        {viewModels[0]?.title || (type === "music" ? "Music Recommendations" : "Film Recommendations")}
      </h3>

      {isNewUser && (
        <p className="text-xs text-gray-300 mb-4">
          {type === "music"
            ? "Popular music based on current trends and chart-toppers"
            : "Popular films that are trending and critically acclaimed"}
        </p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4">
        {allItems.map((item) => (
          <RecommendationCard
            key={item.id}
            data-testid="recommendation-card"
            item={item}
            type={item.type as "music" | "film"}
          />
        ))}
      </div>
    </div>
  );
}
