import React, { useState, useEffect, useMemo } from "react";
import { useRecommendations } from "../hooks/useRecommendations";
import { useMetadataWeights } from "../hooks/useMetadataWeights";
import { CategorySelector } from "./CategorySelector";
import { MetadataFilterSelector } from "./MetadataFilterSelector";
import { RecommendationStack } from "./RecommendationStack";
import { MetadataInsightPanel } from "./MetadataInsightPanel";
import { MetadataType } from "../types/recommendations";
import type { MetadataItem } from "../types/recommendations";
import type { EnhancedRecommendationViewModel } from "../types/recommendations";

interface ImprovedRecommendationsViewProps {
  userId: string;
}

export function ImprovedRecommendationsView({ userId }: ImprovedRecommendationsViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<"music" | "film">("music");

  const {
    recommendations,
    isLoading,
    error,
    currentIndex,
    setCurrentIndex,
    fetchRecommendations,
    submitFeedback,
    showNextRecommendation,
    showPreviousRecommendation,
    hasNext,
    hasPrevious,
    currentRecommendation,
  } = useRecommendations({ userId, type: selectedCategory });

  // Początkowe wagi metadanych
  const initialWeights = useMemo(
    () => [
      { type: MetadataType.MUSIC_GENRE, name: "Gatunki muzyczne", weight: 0.5 },
      { type: MetadataType.FILM_GENRE, name: "Gatunki filmowe", weight: 0.5 },
      { type: MetadataType.DIRECTOR, name: "Reżyserzy", weight: 0.5 },
      { type: MetadataType.CAST_MEMBER, name: "Obsada", weight: 0.5 },
      { type: MetadataType.SCREENWRITER, name: "Scenarzyści", weight: 0.5 },
      { type: MetadataType.ARTIST, name: "Artyści", weight: 0.5 },
    ],
    []
  );

  const { weights, updateWeight, resetWeights } = useMetadataWeights(initialWeights);

  // Filtrowanie wag na podstawie wybranej kategorii
  const filteredWeights = useMemo(() => {
    if (selectedCategory === "music") {
      return weights.filter((w) => w.type === MetadataType.MUSIC_GENRE || w.type === MetadataType.ARTIST);
    } else {
      return weights.filter(
        (w) =>
          w.type === MetadataType.FILM_GENRE ||
          w.type === MetadataType.DIRECTOR ||
          w.type === MetadataType.CAST_MEMBER ||
          w.type === MetadataType.SCREENWRITER
      );
    }
  }, [selectedCategory, weights]);

  const handleCategoryChange = (category: "music" | "film") => {
    setSelectedCategory(category);
  };

  const handleWeightsChange = (newWeights: typeof weights) => {
    newWeights.forEach((weight) => {
      updateWeight(weight.type, weight.weight);
    });

    // Odświeżenie rekomendacji po zmianie wag
    fetchRecommendations(true);
  };

  const handleFilterSelect = (item: MetadataItem) => {
    // Zwiększ wagę wybranego elementu
    updateWeight(item.type, 0.8);

    // Odśwież rekomendacje
    fetchRecommendations(true);
  };

  // Sprawdzanie autentykacji
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me");
        if (!response.ok) {
          window.location.href = "/login?redirect=/recommendations/enhanced";
        }
      } catch (error) {
        console.error("Error checking authentication:", error);
        window.location.href = "/login?redirect=/recommendations/enhanced";
      }
    };

    checkAuth();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Zaawansowane rekomendacje</h1>

      <CategorySelector selectedCategory={selectedCategory} onCategoryChange={handleCategoryChange} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
              <h3 className="font-medium">Wystąpił błąd</h3>
              <p>{error.message}</p>
              <button
                onClick={() => fetchRecommendations(true)}
                className="mt-2 px-4 py-2 bg-primary text-primary-foreground rounded-md"
                type="button"
              >
                Spróbuj ponownie
              </button>
            </div>
          ) : recommendations.length === 0 ? (
            <div className="bg-muted p-8 rounded-lg text-center">
              <h3 className="text-xl font-medium mb-2">Brak rekomendacji</h3>
              <p className="mb-4">
                Rozszerz swoje preferencje lub oceń więcej treści, aby otrzymać lepsze rekomendacje.
              </p>
              <button
                onClick={() => (window.location.href = "/profile/preferences")}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
                type="button"
              >
                Edytuj preferencje
              </button>
            </div>
          ) : (
            <RecommendationStack
              recommendations={recommendations}
              onFeedback={submitFeedback}
              currentIndex={currentIndex}
              onNext={showNextRecommendation}
              onPrevious={showPreviousRecommendation}
              hasNext={hasNext}
              hasPrevious={hasPrevious}
            />
          )}
        </div>

        <div className="space-y-6">
          <MetadataFilterSelector weights={filteredWeights} onWeightsChange={handleWeightsChange} />

          {currentRecommendation && (
            <MetadataInsightPanel insight={currentRecommendation.metadataInsight} onFilterSelect={handleFilterSelect} />
          )}
        </div>
      </div>
    </div>
  );
}
