import { RecommendationsHeader } from "./RecommendationsHeader";
import { RecommendationsList } from "./RecommendationsList";
import RecommendationHistory from "../ui/RecommendationHistory";
import { useState } from "react";
import type { RecommendationDTO } from "../../types";

interface RecommendationsPanelProps {
  recommendations?: RecommendationDTO[];
  activeType: "music" | "film";
  onTypeChange: (type: "music" | "film") => void;
  onRefresh: () => void;
  isLoading: boolean;
  userId: number;
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
  const [activeTab, setActiveTab] = useState<"recommendations" | "ratings">("recommendations");

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border">
      <RecommendationsHeader
        activeType={activeType}
        onTypeChange={onTypeChange}
        onRefresh={onRefresh}
        isLoading={isLoading}
      />

      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex -mb-px px-6">
          <button
            onClick={() => setActiveTab("recommendations")}
            className={`mr-4 py-4 px-1 text-sm font-medium border-b-2 ${
              activeTab === "recommendations"
                ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
          >
            Recommendations
          </button>
          <button
            onClick={() => setActiveTab("ratings")}
            className={`mr-4 py-4 px-1 text-sm font-medium border-b-2 ${
              activeTab === "ratings"
                ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
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
      ) : (
        <div className="p-6">
          <RecommendationHistory userId={userId} />
        </div>
      )}
    </div>
  );
}
