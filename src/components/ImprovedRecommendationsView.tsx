import { useEffect, useMemo } from "react";
import { FormProvider } from "react-hook-form";
import { useRecommendationForm } from "../hooks/useRecommendationForm";
import { CategorySelector } from "./CategorySelector";
import { MetadataFilterSelector } from "./MetadataFilterSelector";
import { RecommendationStack } from "./RecommendationStack";
import { MetadataInsightPanel } from "./MetadataInsightPanel";
import { MetadataType } from "../types/recommendations";
import type { MetadataItem } from "../types/recommendations";
import type { RecommendationFeedbackType } from "../types";

interface ImprovedRecommendationsViewProps {
  userId: string;
}

export function ImprovedRecommendationsView({ userId }: ImprovedRecommendationsViewProps) {
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

  // Use our new custom hook
  const {
    formMethods,
    recommendations,
    currentRecommendation,
    isLoading,
    error: hookError,
    fetchRecommendations,
    handleFormSubmit,
    currentIndex,
    showNextRecommendation,
  } = useRecommendationForm({
    userId,
    initialCategory: "music",
    initialWeights,
  });

  const selectedCategory = formMethods.watch("category");
  const weights = formMethods.watch("weights");

  const handleFilterSelect = (item: MetadataItem) => {
    // Zwiększ wagę wybranego elementu
    const updatedWeights = weights.map((w) => (w.type === item.type ? { ...w, weight: 0.8 } : w));
    formMethods.setValue("weights", updatedWeights, { shouldDirty: true });

    // Odśwież rekomendacje
    fetchRecommendations(true);
  };

  // Handle feedback for recommendations
  const handleFeedback = async (
    recommendationId: number,
    feedbackType: RecommendationFeedbackType
  ) => {
    try {
      formMethods.setValue(
        "feedback",
        {
          itemId: String(recommendationId),
          type: feedbackType,
        },
        { shouldDirty: true }
      );

      await formMethods.handleSubmit(handleFormSubmit)();
    } catch {
      // Handle submission error - could log to error monitoring service
      // or display error message to user
    }
  };

  // Form submission handler
  const onSubmit = handleFormSubmit;

  // Update filtered weights when category changes
  useEffect(() => {
    formMethods.setValue(
      "weights",
      initialWeights.filter((w) => {
        if (selectedCategory === "music") {
          return w.type === MetadataType.MUSIC_GENRE || w.type === MetadataType.ARTIST;
        } else {
          return (
            w.type === MetadataType.FILM_GENRE ||
            w.type === MetadataType.DIRECTOR ||
            w.type === MetadataType.CAST_MEMBER ||
            w.type === MetadataType.SCREENWRITER
          );
        }
      })
    );
  }, [selectedCategory, initialWeights, formMethods]);

  // Sprawdzanie autentykacji
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me");
        if (!response.ok) {
          window.location.href = "/login?redirect=/recommendations/enhanced";
        }
      } catch {
        window.location.href = "/login?redirect=/recommendations/enhanced";
      }
    };

    checkAuth();
  }, []);

  return (
    <FormProvider {...formMethods}>
      <form onSubmit={formMethods.handleSubmit(onSubmit)} className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Zaawansowane rekomendacje</h1>

        <CategorySelector />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : hookError ? (
              <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
                <h3 className="font-medium">Wystąpił błąd</h3>
                <p>{hookError.message}</p>
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
                  Rozszerz swoje preferencje lub oceń więcej treści, aby otrzymać lepsze
                  rekomendacje.
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
                onFeedback={handleFeedback}
                currentIndex={currentIndex}
                onNext={showNextRecommendation}
                userId={userId}
              />
            )}
          </div>

          <div className="space-y-6">
            <MetadataFilterSelector />

            {currentRecommendation && (
              <MetadataInsightPanel
                insight={currentRecommendation.metadataInsight}
                onFilterSelect={handleFilterSelect}
              />
            )}
          </div>
        </div>
      </form>
    </FormProvider>
  );
}
