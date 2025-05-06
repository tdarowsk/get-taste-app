import { useEffect } from "react";
import { Header } from "./Header";
import { RecommendationsPanel } from "./RecommendationsPanel";
import { useDashboard } from "../../lib/hooks/useDashboard";
import type { UserProfileDTO } from "../../types";
import RecommendationSidebar from "../ui/RecommendationSidebar";

interface DashboardLayoutProps {
  user: UserProfileDTO;
}

export function DashboardLayout({ user }: DashboardLayoutProps) {
  const {
    activeType,
    setActiveType,
    // These variables will be used when implementing the preferences panel
    // preferences,
    // isPreferencesLoading,
    // handlePreferencesUpdate,
    recommendations,
    isRecommendationsLoading,
    refreshRecommendations,
    isGeneratingRecommendations,
    isNewUser,
    validUserId,
  } = useDashboard(user.id);

  // Log the user ID and valid user ID to debug

  // Load recommendations when component mounts
  useEffect(() => {
    // Only try to fetch recommendations if we have a valid user ID
    // and we're not already loading or generating recommendations
    if (
      validUserId &&
      !isRecommendationsLoading &&
      !isGeneratingRecommendations &&
      (!recommendations || recommendations.length === 0)
    ) {
      refreshRecommendations();
    } else if (recommendations && recommendations.length > 0) {
    }
  }, [
    isRecommendationsLoading,
    recommendations,
    refreshRecommendations,
    validUserId,
    isGeneratingRecommendations,
  ]);

  // Refresh recommendations when the type changes
  useEffect(() => {
    if (validUserId && recommendations && recommendations.length > 0) {
      // Filter out undefined or invalid recommendations
      const validRecommendations = recommendations.filter((rec) => rec && rec.type);

      if (validRecommendations.length < recommendations.length) {
      }

      // Check if we have recommendations of the active type
      const hasActiveTypeRecs = validRecommendations.some((rec) => rec.type === activeType);

      if (!hasActiveTypeRecs) {
        refreshRecommendations();
      } else {
      }
    }
  }, [activeType, recommendations, refreshRecommendations, validUserId]);

  // Force a refresh of recommendations after a timeout if recommendations are still loading
  useEffect(() => {
    let timeout: number;

    if (
      validUserId &&
      isRecommendationsLoading &&
      (!recommendations || recommendations.length === 0)
    ) {
      timeout = window.setTimeout(() => {
        refreshRecommendations();
      }, 10000); // 10 seconds timeout
    }

    return () => {
      if (timeout) {
        window.clearTimeout(timeout);
      }
    };
  }, [validUserId, isRecommendationsLoading, recommendations, refreshRecommendations]);

  // Add debugging for rendering state

  // Check if we have any valid recommendations after filtering
  const hasValidRecommendations =
    recommendations &&
    recommendations.length > 0 &&
    recommendations.some(
      (rec) =>
        rec && rec.type && rec.data && Array.isArray(rec.data.items) && rec.data.items.length > 0
    );

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <Header user={user} />

      {isNewUser && (
        <div className="bg-gradient-to-r from-blue-900/40 to-purple-900/40 border-b border-blue-800/50">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center">
              <div className="shrink-0 mr-3">
                <svg
                  className="h-6 w-6 text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-medium text-blue-300">Welcome to getTaste!</h3>
                <p className="text-xs text-blue-400">
                  We&apos;re showing you popular recommendations to get you started. Update your
                  preferences for personalized suggestions!
                </p>
              </div>
            </div>
            <button
              className="text-xs font-medium px-3 py-1.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-md transition-colors shadow-md"
              onClick={() => refreshRecommendations()}
            >
              Refresh
            </button>
          </div>
        </div>
      )}

      <main className="flex-1 py-6">
        <div className="container mx-auto px-4 max-w-screen-2xl">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Main content area */}
            <div className="flex-1">
              <RecommendationsPanel
                recommendations={recommendations}
                activeType={activeType}
                onTypeChange={setActiveType}
                onRefresh={refreshRecommendations}
                isLoading={isRecommendationsLoading || isGeneratingRecommendations}
                userId={user.id}
                isNewUser={isNewUser}
              />
            </div>

            {/* Preferences sidebar */}
            <div className="w-full lg:w-64 xl:w-72 hidden lg:block shrink-0">
              <div className="sticky top-24 rounded-lg p-5 shadow-lg bg-white/5 backdrop-blur-sm border border-white/10">
                <h3 className="text-base font-semibold mb-3 text-white">Your Preferences</h3>
                <p className="text-gray-300 text-xs">
                  Set your preferences to get better recommendations
                </p>
                <div className="mt-4 pt-3 border-t border-white/10">
                  <div className="space-y-3">
                    <div className="bg-gradient-to-r from-blue-900/30 to-blue-800/30 p-3 rounded-md border border-blue-700/30">
                      <h4 className="font-medium text-blue-300 text-sm mb-1">Music Preferences</h4>
                      <p className="text-xs text-blue-400">Rock, Pop, Jazz, Classical</p>
                    </div>

                    <div className="bg-gradient-to-r from-purple-900/30 to-purple-800/30 p-3 rounded-md border border-purple-700/30">
                      <h4 className="font-medium text-purple-300 text-sm mb-1">Film Preferences</h4>
                      <p className="text-xs text-purple-400">Drama, Action, Sci-Fi, Comedy</p>
                    </div>
                  </div>

                  <button className="mt-5 w-full py-2 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-md hover:from-purple-700 hover:to-indigo-700 transition-colors text-sm font-medium shadow-md">
                    Edit Preferences
                  </button>
                </div>
              </div>
            </div>

            {/* Swipe Recommendations sidebar */}
            <div className="w-full lg:w-72 xl:w-80 shrink-0 mb-6 lg:mb-0 order-first lg:order-last">
              <div className="sticky top-24 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 shadow-lg overflow-hidden h-[calc(100vh-120px)]">
                <RecommendationSidebar
                  userId={validUserId || ""}
                  className="h-full"
                  isNewUser={isNewUser}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
