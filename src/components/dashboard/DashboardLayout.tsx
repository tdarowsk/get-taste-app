import { useEffect } from "react";
import { Header } from "./Header";
import { RecommendationsPanel } from "./RecommendationsPanel";
import { useDashboard } from "../../lib/hooks/useDashboard";
import type { UserProfileDTO } from "../../types";
import { RecommendationSidebar } from "../ui/RecommendationSidebar";

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
  } = useDashboard(user.id);

  // Load recommendations when component mounts
  useEffect(() => {
    if (!isRecommendationsLoading && !recommendations) {
      refreshRecommendations();
    }
  }, [isRecommendationsLoading, recommendations, refreshRecommendations]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Header user={user} />

      {isNewUser && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-800">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center">
              <div className="shrink-0 mr-3">
                <svg
                  className="h-6 w-6 text-blue-500"
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
                <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">Welcome to getTaste!</h3>
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  We&apos;re showing you popular recommendations to get you started. Update your preferences for
                  personalized suggestions!
                </p>
              </div>
            </div>
            <button
              className="text-xs font-medium px-3 py-1 bg-blue-100 hover:bg-blue-200 dark:bg-blue-800 dark:hover:bg-blue-700 text-blue-700 dark:text-blue-300 rounded-md transition-colors"
              onClick={() => refreshRecommendations()}
            >
              Refresh
            </button>
          </div>
        </div>
      )}

      <main className="flex-1 py-3">
        <div className="container mx-auto px-3 max-w-screen-2xl">
          <div className="flex flex-col lg:flex-row gap-3">
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
              <div className="sticky top-24 border rounded-lg p-4 bg-white dark:bg-gray-800 shadow-md">
                <h3 className="text-base font-semibold mb-3 text-gray-900 dark:text-gray-100">Your Preferences</h3>
                <p className="text-muted-foreground text-xs">Set your preferences to get better recommendations</p>
                <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                  <div className="space-y-2">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-md">
                      <h4 className="font-medium text-blue-700 dark:text-blue-300 text-sm mb-0.5">Music Preferences</h4>
                      <p className="text-xs text-blue-600/80 dark:text-blue-300/70">Rock, Pop, Jazz, Classical</p>
                    </div>

                    <div className="bg-purple-50 dark:bg-purple-900/20 p-2 rounded-md">
                      <h4 className="font-medium text-purple-700 dark:text-purple-300 text-sm mb-0.5">
                        Film Preferences
                      </h4>
                      <p className="text-xs text-purple-600/80 dark:text-purple-300/70">
                        Drama, Action, Sci-Fi, Comedy
                      </p>
                    </div>
                  </div>

                  <button className="mt-4 w-full py-1.5 px-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-xs font-medium">
                    Edit Preferences
                  </button>
                </div>
              </div>
            </div>

            {/* Swipe Recommendations sidebar */}
            <div className="w-full lg:w-72 xl:w-80 shrink-0 mb-6 lg:mb-0 order-first lg:order-last">
              <div className="sticky top-24 border rounded-lg bg-white dark:bg-gray-800 shadow-md overflow-hidden h-[calc(100vh-120px)]">
                <RecommendationSidebar userId={user.id} className="h-full" isNewUser={isNewUser} />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
