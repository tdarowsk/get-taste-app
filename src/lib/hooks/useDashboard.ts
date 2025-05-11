import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useUserPreferences } from "./useUserPreferences";
import { useRecommendations } from "./useRecommendations";
import { useUpdatePreferences } from "./useUpdatePreferences";
import { useGenerateRecommendations } from "./useGenerateRecommendations";
import { useQuery } from "@tanstack/react-query";
import type {
  UpdateMusicPreferencesCommand,
  UpdateFilmPreferencesCommand,
  RecommendationDTO,
} from "../../types";

export function useDashboard(userId: string) {
  const [activeType, setActiveType] = useState<"music" | "film">("music");
  const [isMobilePreferencesOpen, setMobilePreferencesOpen] = useState(false);
  const [isNewUser, setIsNewUser] = useState(true);
  const lastRefreshTimeRef = useRef<number>(0);

  // Ensure userId is valid and never "undefined" string
  const validUserId = useMemo(() => {
    // Check if userId is valid
    if (!userId || userId === "undefined" || userId === undefined) {
      return null;
    }

    return userId;
  }, [userId]);

  const preferencesQuery = useUserPreferences(validUserId || "");

  // Check if this is a new user based on preferences
  useEffect(() => {
    if (preferencesQuery.data) {
      const hasMusic =
        preferencesQuery.data.music &&
        (preferencesQuery.data.music.genres?.length > 0 ||
          preferencesQuery.data.music.artists?.length > 0);

      const hasFilm =
        preferencesQuery.data.film &&
        (preferencesQuery.data.film.genres?.length > 0 ||
          preferencesQuery.data.film.cast?.length > 0 ||
          preferencesQuery.data.film.director ||
          preferencesQuery.data.film.screenwriter);

      // User is not new if they have any preferences set
      setIsNewUser(!(hasMusic || hasFilm));
    }
  }, [preferencesQuery.data]);

  const updatePreferencesMutation = useUpdatePreferences();
  const generateRecommendationsMutation = useGenerateRecommendations();

  // Create the refresh function that will be used by both the UI and the query
  const generateNewRecommendations = useCallback(() => {
    // Validate userId
    if (!validUserId) {
      return Promise.reject(new Error("Invalid user ID for recommendation generation"));
    }

    // Prevent multiple refreshes within 5 seconds
    const now = Date.now();
    if (now - lastRefreshTimeRef.current < 5000) {
      return Promise.resolve(false);
    }

    lastRefreshTimeRef.current = now;

    return generateRecommendationsMutation
      .mutateAsync({
        userId: validUserId,
        type: activeType,
        force_refresh: true,
        is_new_user: isNewUser,
      })
      .then((result) => {
        return result;
      })
      .catch((error) => {
        // If error contains "OpenRouter" and "403", it's likely an API key issue
        const errorMessage = String(error);
        if (
          errorMessage.includes("OpenRouter") &&
          (errorMessage.includes("403") || errorMessage.includes("Forbidden"))
        ) {
          // Don't throw the error - this allows the UI to continue functioning with previously cached data
          return false;
        }

        throw error;
      });
  }, [validUserId, activeType, isNewUser, generateRecommendationsMutation]);

  // Fetch the latest recommendations directly
  const latestRecommendationsQuery = useQuery<RecommendationDTO | RecommendationDTO[]>({
    queryKey: ["latestRecommendations", validUserId, activeType],
    queryFn: async () => {
      try {
        // Make sure we have a valid userId
        if (!validUserId) {
          throw new Error("Invalid user ID");
        }

        // Use our dedicated latest recommendations endpoint
        const url = new URL(`/api/recommendations/latest`, window.location.origin);
        url.searchParams.append("userId", validUserId);
        // Add type parameter to avoid 400 error
        url.searchParams.append("type", activeType);

        const response = await fetch(url.toString());

        if (response.status === 404) {
          // If no recommendations exist, generate new ones
          await generateNewRecommendations();
          return null;
        }

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Failed to fetch latest recommendations: ${errorText}`);
          throw new Error(`Failed to fetch latest recommendations: ${response.statusText}`);
        }

        const data = await response.json();

        // Validate that we have received valid data
        if (!data) {
          throw new Error("Invalid recommendation data received");
        }

        return data;
      } catch (error) {
        // If we fail to get recommendations, try to generate new ones
        try {
          await generateNewRecommendations();
        } catch (genError) {
          console.error("Error generating new recommendations:", genError);
        }

        throw error;
      }
    },
    enabled: !!validUserId, // Only run the query if userId is valid
    refetchOnWindowFocus: false,
    staleTime: 60 * 1000, // 1 minute
    retry: 1, // Only retry once
  });

  // Keep the original recommendations query as fallback
  const recommendationsQuery = useRecommendations({
    userId: validUserId || "",
    type: activeType,
    isNewUser,
  });

  // Public refresh function that will be exposed to UI components
  const refreshRecommendations = useCallback(() => {
    generateNewRecommendations();
  }, [generateNewRecommendations]);

  const handlePreferencesUpdate = useCallback(
    async (
      type: "music" | "film",
      data: UpdateMusicPreferencesCommand | UpdateFilmPreferencesCommand
    ) => {
      if (!validUserId) {
        return;
      }

      await updatePreferencesMutation.mutateAsync({
        userId: validUserId,
        type,
        data,
      });
      // After updating preferences, user is no longer new
      setIsNewUser(false);
      refreshRecommendations();
    },
    [validUserId, updatePreferencesMutation, refreshRecommendations]
  );

  // Use the latestRecommendationsQuery data if available, otherwise fall back to recommendationsQuery
  const recommendations = useMemo(() => {
    // Check if we have data from latestRecommendationsQuery
    if (latestRecommendationsQuery.data) {
      // If data is an array, return it directly
      if (Array.isArray(latestRecommendationsQuery.data)) {
        return latestRecommendationsQuery.data;
      }

      // If it's a single recommendation, wrap it in an array
      return [latestRecommendationsQuery.data];
    }

    // Fall back to recommendationsQuery data
    return recommendationsQuery.data || [];
  }, [latestRecommendationsQuery.data, recommendationsQuery.data]);

  const isRecommendationsLoading =
    latestRecommendationsQuery.isLoading || recommendationsQuery.isLoading;

  return {
    activeType,
    setActiveType,
    isMobilePreferencesOpen,
    setMobilePreferencesOpen,
    preferences: preferencesQuery.data,
    isPreferencesLoading: preferencesQuery.isLoading,
    recommendations,
    isRecommendationsLoading,
    refreshRecommendations,
    handlePreferencesUpdate,
    isUpdatingPreferences: updatePreferencesMutation.isPending,
    isGeneratingRecommendations:
      generateRecommendationsMutation.isPending || latestRecommendationsQuery.isFetching,
    isNewUser,
    validUserId,
  };
}
