import { RecommendationsHeader } from "./RecommendationsHeader";
import { AdaptiveRecommendationsList } from "./AdaptiveRecommendationsList";
import RecommendationHistory from "../ui/RecommendationHistory";
import { useState, useEffect, useRef } from "react";
import type { RecommendationDTO, RecommendationItem } from "../../types";
import { useGenerateRecommendations } from "../../lib/hooks/useGenerateRecommendations";
import type {
  RecommendationItemViewModel,
  RecommendationViewModel,
} from "../../lib/types/viewModels";
import { RecommendationCard } from "./RecommendationCard";
import { transformRecommendationToViewModel } from "../../lib/utils/transformers";
import { MoviePoster } from "@/components/MoviePoster";
import { featureFlagService } from "../../features/featureFlagService";

// Type alias for metadata objects to avoid 'any' type warnings
type MetadataRecord = Record<string, unknown>;

// Pomocniczy interfejs dla elementów z określonym typem
interface RecommendationItemWithType extends RecommendationItemViewModel {
  type: "music" | "film";
}

interface RecommendationsPanelProps {
  recommendations?: RecommendationDTO[];
  activeType: "music" | "film";
  onTypeChange: (type: "music" | "film") => void;
  onRefresh: () => void;
  isLoading: boolean;
  userId: string;
  isNewUser?: boolean;
  featureFlags?: {
    recommendations?: boolean;
    adaptiveRecommendations?: boolean;
    historyRecommendations?: boolean;
  };
}

export function RecommendationsPanel({
  recommendations,
  activeType,
  onTypeChange,
  onRefresh,
  isLoading,
  userId,
  isNewUser = false,
  featureFlags,
}: RecommendationsPanelProps) {
  const [activeTab, setActiveTab] = useState<"recommendations" | "ratings" | "swipe">(
    "recommendations"
  );
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [processedRecommendations, setProcessedRecommendations] = useState<
    RecommendationDTO[] | undefined
  >(undefined);
  const [forceGenerating, setForceGenerating] = useState(false);
  const [featureState, setFeatureState] = useState({
    recommendations: true,
    adaptive: true,
    history: true,
  });

  // Dodajemy stan do śledzenia aktualnie wybranej rekomendacji
  const [selectedItem, setSelectedItem] = useState<RecommendationItemViewModel | null>(null);
  const detailRef = useRef<HTMLDivElement>(null);

  // Get the generate recommendations hook for manual AI generation
  const generateRecommendationsMutation = useGenerateRecommendations();

  // Validate userId
  const validUserId = userId && userId !== "undefined" ? userId : "";

  // Sprawdzanie flag funkcji - wykonywane poza blokami warunkowymi
  useEffect(() => {
    // Sprawdzamy feature flagi tylko raz podczas inicjalizacji komponentu
    const userContext = {
      id: validUserId,
      role: isNewUser ? "new_user" : "user",
    };

    const isRecommendationsEnabled =
      featureFlags?.recommendations !== undefined
        ? featureFlags.recommendations
        : featureFlagService.isFeatureEnabled("collections.recommendations", userContext);

    const isAdaptiveEnabled =
      featureFlags?.adaptiveRecommendations !== undefined
        ? featureFlags.adaptiveRecommendations
        : featureFlagService.isFeatureEnabled("collections.recommendations.adaptive", userContext);

    const isHistoryEnabled =
      featureFlags?.historyRecommendations !== undefined
        ? featureFlags.historyRecommendations
        : featureFlagService.isFeatureEnabled("collections.recommendations.history", userContext);

    setFeatureState({
      recommendations: isRecommendationsEnabled,
      adaptive: isAdaptiveEnabled,
      history: isHistoryEnabled,
    });
  }, [featureFlags, validUserId, isNewUser]);

  // Process recommendations on change
  useEffect(() => {
    if (recommendations) {
      // Fix any "undefined" user_id issues before passing to components
      const fixed = recommendations.map((rec) => {
        if (!rec) return rec;

        // Make a copy to avoid mutating the original
        const fixedRec = { ...rec };

        // Fix user_id at the root level if it's "undefined" and we have a valid userId
        if (fixedRec.user_id === "undefined" && validUserId) {
          fixedRec.user_id = validUserId;
        }

        // Check if the recommendation has data
        if (!fixedRec.data) {
          fixedRec.data = {
            title: "Recommendations",
            description: "Default recommendations",
            items: [],
          };
          return fixedRec;
        }

        // CRITICAL FIX: Check for OpenAI/OpenRouter format where items are in 'recommendations' or 'results'
        // property instead of 'items'
        if (
          (!fixedRec.data.items || fixedRec.data.items.length === 0) &&
          (fixedRec.data.recommendations || fixedRec.data.results)
        ) {
          if (fixedRec.data.recommendations && Array.isArray(fixedRec.data.recommendations)) {
            fixedRec.data.items = fixedRec.data.recommendations;
          } else if (fixedRec.data.results && Array.isArray(fixedRec.data.results)) {
            fixedRec.data.items = fixedRec.data.results;
          } else {
            // Check for OpenRouter format where there's a 'recommendations' object with an array
            // such as data.recommendations.recommendations
            interface NestedRecommendations {
              recommendations: unknown[];
            }

            if (
              fixedRec.data.recommendations &&
              typeof fixedRec.data.recommendations === "object" &&
              fixedRec.data.recommendations &&
              "recommendations" in fixedRec.data.recommendations &&
              Array.isArray(
                (fixedRec.data.recommendations as NestedRecommendations).recommendations
              )
            ) {
              const nestedItems = (fixedRec.data.recommendations as NestedRecommendations)
                .recommendations;

              // Use type assertion to handle the type mismatch
              if (nestedItems.length > 0) {
                // Force type as minimum valid RecommendationItem array by mapping each item
                fixedRec.data.items = nestedItems.map((item, index) => {
                  if (item && typeof item === "object") {
                    // Try to extract id and name if available
                    const obj = item as Record<string, unknown>;
                    return {
                      id: String(obj.id || `item-${index}`),
                      name: String(obj.name || obj.title || `Item ${index}`),
                      type: String(obj.type || "item"),
                      details: obj,
                    } as RecommendationItem;
                  } else {
                    // Create minimal valid item
                    return {
                      id: `item-${index}`,
                      name: `Item ${index}`,
                      type: "item",
                      details: {},
                    } as RecommendationItem;
                  }
                });
              }
            }
          }
        }

        // Ensure items is always an array
        if (!fixedRec.data.items) {
          fixedRec.data.items = [];
        } else if (!Array.isArray(fixedRec.data.items)) {
          // If it's an object with properties, convert it to array format that our components expect
          try {
            if (typeof fixedRec.data.items === "object") {
              const itemsObj = fixedRec.data.items;
              // Check if it might be an object with numbered keys like {0: item1, 1: item2}
              const convertedItems = Object.keys(itemsObj)
                .map((key) => itemsObj[key])
                .filter((item) => item && typeof item === "object");

              if (convertedItems.length > 0) {
                fixedRec.data.items = convertedItems;
              } else {
                fixedRec.data.items = [];
              }
            } else {
              fixedRec.data.items = [];
            }
          } catch {
            // Error while converting recommendation items
            fixedRec.data.items = [];
          }
        }

        return fixedRec;
      });

      // Filter out any null/undefined recommendations
      const validRecommendations = fixed.filter((r) => !!r);

      // Set processed recommendations
      setProcessedRecommendations(validRecommendations);
    } else {
      setProcessedRecommendations(undefined);
    }
  }, [recommendations, validUserId]);

  // If recommendations are disabled, show a message
  if (!featureState.recommendations) {
    return (
      <div className="bg-white/5 backdrop-blur-sm rounded-lg shadow-lg border border-white/10 p-8 text-center">
        <h2 className="text-xl font-semibold text-white mb-4">Recommendations Unavailable</h2>
        <p className="text-gray-300">
          This feature is currently unavailable. Please check back later.
        </p>
      </div>
    );
  }

  // Handler for when feedback is processed in the adaptive system
  const handleFeedbackProcessed = () => {
    // Increment the refresh trigger to update UI
    setRefreshTrigger((prev) => prev + 1);
  };

  // Force generate new AI recommendations using the OpenRouter AI directly
  const handleForceGenerateAI = async () => {
    if (!validUserId) {
      return;
    }

    try {
      setForceGenerating(true);

      await generateRecommendationsMutation.mutateAsync({
        userId: validUserId,
        type: activeType,
        force_refresh: true,
        is_new_user: isNewUser,
      });

      // Call the parent's refresh function to reload the data
      onRefresh();
    } catch (error) {
      console.error(
        "Error generating AI recommendations:",
        error instanceof Error ? error.message : String(error)
      );
    } finally {
      setForceGenerating(false);
    }
  };

  // Funkcja do obsługi kliknięcia na kartę
  const handleItemSelect = (item: RecommendationItemViewModel) => {
    setSelectedItem(item);

    // Przewijanie do widoku szczegółowego
    if (detailRef.current) {
      detailRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Funkcja do zamknięcia widoku szczegółowego
  const handleCloseDetail = () => {
    setSelectedItem(null);
  };

  // Combined loading state
  const combinedLoading = isLoading || forceGenerating || generateRecommendationsMutation.isPending;

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-lg shadow-lg border border-white/10">
      <RecommendationsHeader
        activeType={activeType}
        onTypeChange={onTypeChange}
        onRefresh={onRefresh}
        isLoading={combinedLoading}
      />

      <div className="border-b border-white/10">
        <nav className="flex -mb-px px-6 justify-between">
          <div className="flex">
            {featureState.adaptive && (
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
            )}
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
            {featureState.history && (
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
            )}
          </div>

          <div className="flex items-center">
            <button
              onClick={handleForceGenerateAI}
              disabled={combinedLoading || !validUserId}
              className={`text-xs py-1 px-3 rounded flex items-center space-x-1 ${
                combinedLoading
                  ? "bg-gray-600 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              }`}
            >
              {combinedLoading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Force Generate AI Recommendations</span>
                </>
              )}
            </button>
          </div>
        </nav>
      </div>

      {/* Wyświetlanie aktualnie wybranej rekomendacji */}
      {selectedItem && (
        <div ref={detailRef} className="p-6 bg-white/10 backdrop-blur-md border-b border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">Selected Recommendation</h3>
            <button
              onClick={handleCloseDetail}
              className="p-1 rounded-full bg-white/10 hover:bg-white/20 text-white"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                ></path>
              </svg>
            </button>
          </div>

          <div className="flex flex-col md:flex-row gap-6">
            {/* Thumbnail */}
            <div className="w-full md:w-1/4 lg:w-1/5">
              <div className="aspect-[2/3] rounded-lg overflow-hidden border border-white/20 flex items-center justify-center">
                <MoviePoster title={selectedItem.name} size="lg" />
              </div>
            </div>

            {/* Details */}
            <div className="flex-1">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <span
                    className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                      selectedItem.type === "music" ? "bg-blue-600" : "bg-purple-600"
                    } text-white`}
                  >
                    {(() => {
                      const metadata = selectedItem.metadata as MetadataRecord;
                      return String(metadata.genre || selectedItem.type);
                    })()}
                  </span>
                </div>
                {selectedItem.type === "film" && (
                  <span className="text-sm text-gray-300">
                    {(() => {
                      const metadata = selectedItem.metadata as MetadataRecord;
                      return metadata.year ? `(${String(metadata.year)})` : "";
                    })()}
                  </span>
                )}
              </div>

              <h2 className="text-2xl font-bold text-white mb-2">{selectedItem.name}</h2>

              {selectedItem.type === "film" && (
                <p className="text-gray-300 mb-2">
                  Director:{" "}
                  <span className="text-white">
                    {(() => {
                      const metadata = selectedItem.metadata as MetadataRecord;

                      // Sprawdź bezpośrednio w metadanych - dane z AI są najczęściej tutaj
                      if (metadata.director) {
                        return String(metadata.director);
                      }

                      // Sprawdź czy reżyser jest w zagnieżdżonych detalach (typowe dla struktury API)
                      if (metadata.details && typeof metadata.details === "object") {
                        const details = metadata.details as MetadataRecord;

                        if (details.director) {
                          return String(details.director);
                        }
                      }

                      // Sprawdź czy reżyser jest w tablicy directors
                      if (Array.isArray(metadata.directors) && metadata.directors.length > 0) {
                        return String(metadata.directors[0]);
                      }

                      // Sprawdź czy jest tablica directors w details
                      if (metadata.details && typeof metadata.details === "object") {
                        const details = metadata.details as MetadataRecord;
                        if (Array.isArray(details.directors) && details.directors.length > 0) {
                          return String(details.directors[0]);
                        }
                      }

                      return "Unknown Director";
                    })()}
                  </span>
                </p>
              )}

              {selectedItem.type === "music" && (
                <p className="text-gray-300 mb-2">
                  Artist:{" "}
                  <span className="text-white">
                    {(() => {
                      const metadata = selectedItem.metadata as MetadataRecord;
                      return metadata.artist ? String(metadata.artist) : "Unknown Artist";
                    })()}
                  </span>
                </p>
              )}

              {selectedItem.description && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-400 mb-1">Description</h3>
                  <p className="text-gray-200">{selectedItem.description}</p>
                </div>
              )}

              <div className="mt-6">
                <button
                  className={`px-6 py-2 rounded-lg bg-gradient-to-r shadow-lg ${
                    selectedItem.type === "music"
                      ? "from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                      : "from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  } text-white font-medium`}
                >
                  {selectedItem.type === "music" ? "Listen now" : "Watch now"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "recommendations" ? (
        <CustomRecommendationsList
          recommendations={processedRecommendations}
          isLoading={combinedLoading}
          type={activeType}
          isNewUser={isNewUser}
          onItemSelect={handleItemSelect}
        />
      ) : activeTab === "ratings" && featureState.history ? (
        <div className="p-6">
          <RecommendationHistory userId={validUserId} />
        </div>
      ) : featureState.adaptive ? (
        <AdaptiveRecommendationsList
          key={`swipe-${activeType}-${refreshTrigger}`}
          recommendations={processedRecommendations}
          isLoading={combinedLoading}
          type={activeType}
          isNewUser={isNewUser}
          userId={validUserId}
          onFeedbackProcessed={handleFeedbackProcessed}
          featureEnabled={featureState.adaptive}
        />
      ) : (
        <div className="p-6 text-center">
          <p className="text-gray-300">This feature is currently unavailable.</p>
        </div>
      )}
    </div>
  );
}

// Funkcja wyświetlająca rekomendacje
function CustomRecommendationsList({
  recommendations,
  isLoading,
  type,
  isNewUser,
  onItemSelect,
}: {
  recommendations?: RecommendationDTO[];
  isLoading: boolean;
  type: "music" | "film";
  isNewUser?: boolean;
  onItemSelect: (item: RecommendationItemViewModel) => void;
}) {
  // Użyj kodu z istniejącego RecommendationsList, ale przekaż onItemSelect do RecommendationCard
  const [viewModels, setViewModels] = useState<RecommendationViewModel[]>([]);
  const [allItems, setAllItems] = useState<RecommendationItemWithType[]>([]);
  const [hasProcessedData, setHasProcessedData] = useState(false);

  // Taki sam kod jak w RecommendationsList, ale z przerobionym renderowaniem
  useEffect(() => {
    if (recommendations) {
      // Filtruj tylko rekomendacje pasujące do wybranego typu
      const filteredRecs = recommendations.filter((rec) => rec && rec.type === type);

      if (filteredRecs.length === 0) {
        setViewModels([]);
        setAllItems([]);
        setHasProcessedData(true);
        return;
      }

      // Mark as loading while we process
      setHasProcessedData(false);

      // Przekształć na modele widoku - handle async transformation
      const processRecommendations = async () => {
        try {
          // Process all recommendations in parallel
          const vmsPromises = filteredRecs.map(async (dto) => {
            return await transformRecommendationToViewModel(dto);
          });

          // Wait for all transformations to complete
          const vms = await Promise.all(vmsPromises);
          setViewModels(vms);

          // Wyciągnij wszystkie elementy
          const items = vms.flatMap((vm) => {
            if (!vm.items || !Array.isArray(vm.items) || vm.items.length === 0) {
              return [];
            }

            return vm.items.map((item) => {
              return {
                ...item,
                type: vm.type,
              };
            });
          });

          setAllItems(items);
          setHasProcessedData(true);
        } catch {
          setViewModels([]);
          setAllItems([]);
          setHasProcessedData(true);
        }
      };

      // Start async processing
      processRecommendations();
    } else {
      setViewModels([]);
      setAllItems([]);
      setHasProcessedData(true);
    }
  }, [recommendations, type]);

  // Stan ładowania
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

  // Stan pusty
  if (hasProcessedData && allItems.length === 0) {
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
      </div>
    );
  }

  // Wyświetl rekomendacje - usunięto biały element na dole
  return (
    <div
      data-testid="recommendations-list"
      className="p-6 bg-white/5 backdrop-blur-sm rounded-b-lg"
    >
      <h3 className="text-lg font-medium mb-3 text-white">
        {viewModels[0]?.title ||
          (type === "music" ? "Music Recommendations" : "Film Recommendations")}
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
          <div
            key={item.id}
            className="cursor-pointer transition-transform hover:scale-105"
            onClick={() => onItemSelect(item)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                onItemSelect(item);
              }
            }}
            role="button"
            tabIndex={0}
            aria-label={`View details for ${item.name}`}
          >
            <RecommendationCard
              data-testid="recommendation-card"
              item={item}
              type={item.type as "music" | "film"}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
