import { useState, useCallback, useMemo, useEffect } from "react";
import { useForm } from "react-hook-form";
import { RecommendationType } from "../../domain/enums/RecommendationType";
import { FeedbackType } from "../../domain/enums/FeedbackType";
import { GetRecommendationsUseCase } from "../../application/useCases/GetRecommendationsUseCase";
import { SubmitFeedbackUseCase } from "../../application/useCases/SubmitFeedbackUseCase";
import { UpdateMetadataWeightsUseCase } from "../../application/useCases/UpdateMetadataWeightsUseCase";
import { RecommendationRepository } from "../../infrastructure/repositories/RecommendationRepository";
import { FeedbackRepository } from "../../infrastructure/repositories/FeedbackRepository";
import { MetadataService } from "../../infrastructure/services/MetadataService";
import { DomainEventEmitter } from "../../infrastructure/events/DomainEventEmitter";
import { ApiDataSource } from "../../infrastructure/data/ApiDataSource";
import { Recommendation } from "../../domain/models/Recommendation";
import { MetadataType } from "../../domain/enums/MetadataType";

// Define the form values type
export interface RecommendationFormValues {
  category: RecommendationType;
  weights: {
    type: MetadataType;
    name: string;
    weight: number;
  }[];
  feedback?: {
    recommendationId: string;
    itemId: string;
    type: FeedbackType;
  };
}

interface UseRecommendationsParams {
  userId: string;
  initialCategory?: RecommendationType;
  initialWeights?: {
    type: MetadataType;
    name: string;
    weight: number;
  }[];
}

export function useRecommendations({
  userId,
  initialCategory = RecommendationType.MUSIC,
  initialWeights = [],
}: UseRecommendationsParams) {
  // Create infrastructure instances
  const dataSource = useMemo(() => new ApiDataSource(), []);
  const eventEmitter = useMemo(() => new DomainEventEmitter(), []);

  // Create repositories and services
  const recommendationRepository = useMemo(
    () => new RecommendationRepository(dataSource),
    [dataSource]
  );
  const feedbackRepository = useMemo(() => new FeedbackRepository(dataSource), [dataSource]);
  const metadataService = useMemo(() => new MetadataService(dataSource), [dataSource]);

  // Create use cases
  const getRecommendationsUseCase = useMemo(
    () => new GetRecommendationsUseCase(recommendationRepository, metadataService, eventEmitter),
    [recommendationRepository, metadataService, eventEmitter]
  );

  const submitFeedbackUseCase = useMemo(
    () => new SubmitFeedbackUseCase(feedbackRepository, recommendationRepository, eventEmitter),
    [feedbackRepository, recommendationRepository, eventEmitter]
  );

  const updateMetadataWeightsUseCase = useMemo(
    () => new UpdateMetadataWeightsUseCase(metadataService),
    [metadataService]
  );

  // State management
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Set up React Hook Form
  const formMethods = useForm<RecommendationFormValues>({
    defaultValues: {
      category: initialCategory,
      weights: initialWeights,
    },
  });

  const category = formMethods.watch("category");

  // Fetch recommendations
  const fetchRecommendations = useCallback(
    async (forceRefresh = false) => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await getRecommendationsUseCase.execute(userId, category, forceRefresh);
        setRecommendations(result);
        setCurrentIndex(0);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("An unknown error occurred"));
      } finally {
        setIsLoading(false);
      }
    },
    [userId, category, getRecommendationsUseCase]
  );

  // Submit feedback
  const handleSubmitFeedback = useCallback(
    async (data: RecommendationFormValues) => {
      if (!data.feedback) return;

      try {
        await submitFeedbackUseCase.execute(
          userId,
          data.feedback.recommendationId,
          data.feedback.itemId,
          data.feedback.type
        );

        // Move to next recommendation
        if (currentIndex < recommendations.length - 1) {
          setCurrentIndex((prevIndex) => prevIndex + 1);
        }

        // Reset feedback field
        formMethods.setValue("feedback", undefined);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to submit feedback"));
      }
    },
    [userId, currentIndex, recommendations.length, submitFeedbackUseCase, formMethods]
  );

  // Update weights
  const updateWeights = useCallback(
    async (weights: RecommendationFormValues["weights"]) => {
      try {
        await updateMetadataWeightsUseCase.execute(
          userId,
          weights.map((w) => ({ type: w.type, weight: w.weight }))
        );

        // Refresh recommendations after weight update
        await fetchRecommendations(true);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to update weights"));
      }
    },
    [userId, updateMetadataWeightsUseCase, fetchRecommendations]
  );

  // Initial fetch on mount and category change
  useEffect(() => {
    fetchRecommendations();
  }, [category, fetchRecommendations]);

  return {
    formMethods,
    recommendations,
    currentRecommendation: recommendations[currentIndex] || null,
    isLoading,
    error,
    fetchRecommendations,
    handleSubmitFeedback,
    updateWeights,
    currentIndex,
    hasNext: currentIndex < recommendations.length - 1,
    hasPrevious: currentIndex > 0,
    showNextRecommendation: () => {
      if (currentIndex < recommendations.length - 1) {
        setCurrentIndex((prevIndex) => prevIndex + 1);
      }
    },
    showPreviousRecommendation: () => {
      if (currentIndex > 0) {
        setCurrentIndex((prevIndex) => prevIndex - 1);
      }
    },
  };
}
