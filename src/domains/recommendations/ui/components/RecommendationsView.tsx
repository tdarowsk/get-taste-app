/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { FormProvider } from "react-hook-form";
import { useRecommendations } from "../hooks/useRecommendations";
import { RecommendationType } from "../../domain/enums/RecommendationType";
import { MetadataType } from "../../domain/enums/MetadataType";

// Component to display loading state
const LoadingIndicator: React.FC = () => (
  <div className="flex justify-center items-center h-64">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
  </div>
);

// Component to display error state
const ErrorDisplay: React.FC<{ error: Error; onRetry: () => void }> = ({ error, onRetry }) => (
  <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
    <h3 className="font-medium">Wystąpił błąd</h3>
    <p>{error.message}</p>
    <button
      onClick={onRetry}
      className="mt-2 px-4 py-2 bg-primary text-primary-foreground rounded-md"
      type="button"
    >
      Spróbuj ponownie
    </button>
  </div>
);

// Component to display empty state
const EmptyRecommendations: React.FC = () => (
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
);

// Component to display category selector
const CategorySelector: React.FC = () => {
  return (
    <div>
      {/* Implementation will use React Hook Form's Controller */}
      <h2>Category Selector Component</h2>
    </div>
  );
};

// Component to display metadata filter
const MetadataFilterSelector: React.FC = () => {
  return (
    <div>
      {/* Implementation will use React Hook Form's Controller */}
      <h2>Metadata Filter Component</h2>
    </div>
  );
};

// Component to display recommendations list
const RecommendationsList: React.FC<{
  recommendations: any[];
  currentIndex: number;
  onNext: () => void;
  onPrevious: () => void;
}> = ({ recommendations, currentIndex, onNext, onPrevious }) => {
  const currentRecommendation = recommendations[currentIndex];

  return (
    <div className="border rounded-lg p-4">
      <h2 className="text-xl font-semibold mb-4">{currentRecommendation.title}</h2>
      <p className="mb-4">{currentRecommendation.description}</p>

      <div className="flex justify-between mt-4">
        <button
          onClick={onPrevious}
          disabled={currentIndex === 0}
          className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md disabled:opacity-50"
          type="button"
        >
          Poprzednia
        </button>

        <button
          onClick={onNext}
          disabled={currentIndex >= recommendations.length - 1}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md disabled:opacity-50"
          type="button"
        >
          Następna
        </button>
      </div>
    </div>
  );
};

// Main recommendations view component
export const RecommendationsView: React.FC<{ userId: string }> = ({ userId }) => {
  // Initialize weights for both music and film
  const initialWeights = [
    { type: MetadataType.MUSIC_GENRE, name: "Gatunki muzyczne", weight: 0.5 },
    { type: MetadataType.FILM_GENRE, name: "Gatunki filmowe", weight: 0.5 },
    { type: MetadataType.DIRECTOR, name: "Reżyserzy", weight: 0.5 },
    { type: MetadataType.CAST_MEMBER, name: "Obsada", weight: 0.5 },
    { type: MetadataType.SCREENWRITER, name: "Scenarzyści", weight: 0.5 },
    { type: MetadataType.ARTIST, name: "Artyści", weight: 0.5 },
  ];

  const {
    formMethods,
    recommendations,
    isLoading,
    error,
    fetchRecommendations,
    handleSubmitFeedback,
    currentIndex,
    showNextRecommendation,
    showPreviousRecommendation,
  } = useRecommendations({
    userId,
    initialCategory: RecommendationType.MUSIC,
    initialWeights,
  });

  const handleFormSubmit = (data: any) => {
    handleSubmitFeedback(data);
  };

  // Check authentication
  React.useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me");
        if (!response.ok) {
          window.location.href = "/login?redirect=/recommendations";
        }
      } catch {
        // Error caught and ignored
      }
    };

    checkAuth();
  }, []);

  return (
    <FormProvider {...formMethods}>
      <form
        onSubmit={formMethods.handleSubmit(handleFormSubmit)}
        className="container mx-auto px-4 py-8"
      >
        <h1 className="text-3xl font-bold mb-8">Rekomendacje</h1>

        <CategorySelector />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            {isLoading ? (
              <LoadingIndicator />
            ) : error ? (
              <ErrorDisplay error={error} onRetry={() => fetchRecommendations(true)} />
            ) : recommendations.length === 0 ? (
              <EmptyRecommendations />
            ) : (
              <RecommendationsList
                recommendations={recommendations}
                currentIndex={currentIndex}
                onNext={showNextRecommendation}
                onPrevious={showPreviousRecommendation}
              />
            )}
          </div>

          <div className="space-y-6">
            <MetadataFilterSelector />
          </div>
        </div>
      </form>
    </FormProvider>
  );
};
