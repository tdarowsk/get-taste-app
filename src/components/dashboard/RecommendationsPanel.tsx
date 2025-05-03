import { RecommendationsHeader } from "./RecommendationsHeader";
import { RecommendationsList } from "./RecommendationsList";
import { AdaptiveRecommendationsList } from "./AdaptiveRecommendationsList";
import RecommendationHistory from "../ui/RecommendationHistory";
import { useState } from "react";
import type { RecommendationDTO } from "../../types";

interface RecommendationsPanelProps {
  recommendations?: RecommendationDTO[];
  activeType: "music" | "film";
  onTypeChange: (type: "music" | "film") => void;
  onRefresh: () => void;
  isLoading: boolean;
  userId: string;
  isNewUser?: boolean;
}

export function RecommendationsPanel({
  recommendations,
  activeType,
  onTypeChange,
  onRefresh,
  isLoading,
  userId,
  isNewUser = false,
}: RecommendationsPanelProps) {
  const [activeTab, setActiveTab] = useState<"recommendations" | "ratings" | "swipe">("recommendations");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Handler for when feedback is processed in the adaptive system
  const handleFeedbackProcessed = () => {
    // Increment the refresh trigger to update UI
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-lg shadow-lg border border-white/10">
      <RecommendationsHeader
        activeType={activeType}
        onTypeChange={onTypeChange}
        onRefresh={onRefresh}
        isLoading={isLoading}
      />

      <div className="border-b border-white/10">
        <nav className="flex -mb-px px-6">
          <button
            onClick={() => setActiveTab("swipe")}
            className={`mr-4 py-4 px-1 text-sm font-medium border-b-2 ${
              activeTab === "swipe"
                ? "border-purple-500 text-purple-400"
                : "border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600"
            }`}
          >
            Swipe Recommendations
          </button>
          <button
            onClick={() => setActiveTab("recommendations")}
            className={`mr-4 py-4 px-1 text-sm font-medium border-b-2 ${
              activeTab === "recommendations"
                ? "border-purple-500 text-purple-400"
                : "border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600"
            }`}
          >
            All Recommendations
          </button>
          <button
            onClick={() => setActiveTab("ratings")}
            className={`mr-4 py-4 px-1 text-sm font-medium border-b-2 ${
              activeTab === "ratings"
                ? "border-purple-500 text-purple-400"
                : "border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600"
            }`}
          >
            My Ratings
          </button>
        </nav>
      </div>

      {activeTab === "recommendations" ? (
        <RecommendationsList
          recommendations={recommendations}
          isLoading={isLoading}
          type={activeType}
          isNewUser={isNewUser}
        />
      ) : activeTab === "ratings" ? (
        <div className="p-6">
          <RecommendationHistory userId={userId} />
        </div>
      ) : (
        <AdaptiveRecommendationsList
          key={`swipe-${activeType}-${refreshTrigger}`}
          recommendations={recommendations}
          isLoading={isLoading}
          type={activeType}
          isNewUser={isNewUser}
          userId={userId}
          onFeedbackProcessed={handleFeedbackProcessed}
        />
      )}
    </div>
  );
}
