import { useState, useCallback, useEffect, useRef } from "react";
import { useUserPreferences } from "./useUserPreferences";
import { useRecommendations } from "./useRecommendations";
import { useUpdatePreferences } from "./useUpdatePreferences";
import { useGenerateRecommendations } from "./useGenerateRecommendations";
import type { UpdateMusicPreferencesCommand, UpdateFilmPreferencesCommand } from "../../types";

export function useDashboard(userId: string) {
  const [activeType, setActiveType] = useState<"music" | "film">("music");
  const [isMobilePreferencesOpen, setMobilePreferencesOpen] = useState(false);
  const [isNewUser, setIsNewUser] = useState(true);
  const lastRefreshTimeRef = useRef<number>(0);

  const preferencesQuery = useUserPreferences(userId);

  // Check if this is a new user based on preferences
  useEffect(() => {
    if (preferencesQuery.data) {
      const hasMusic =
        preferencesQuery.data.music &&
        (preferencesQuery.data.music.genres?.length > 0 || preferencesQuery.data.music.artists?.length > 0);

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

  const recommendationsQuery = useRecommendations({
    userId,
    type: activeType,
    isNewUser,
  });

  const updatePreferencesMutation = useUpdatePreferences();
  const generateRecommendationsMutation = useGenerateRecommendations();

  const refreshRecommendations = useCallback(() => {
    // Prevent multiple refreshes within 5 seconds
    const now = Date.now();
    if (now - lastRefreshTimeRef.current < 5000) {
      console.log("Skipping refresh, too soon since last refresh");
      return;
    }

    lastRefreshTimeRef.current = now;
    generateRecommendationsMutation.mutate({
      userId,
      type: activeType,
      force_refresh: true,
      is_new_user: isNewUser,
    });
  }, [userId, activeType, isNewUser, generateRecommendationsMutation]);

  const handlePreferencesUpdate = useCallback(
    async (type: "music" | "film", data: UpdateMusicPreferencesCommand | UpdateFilmPreferencesCommand) => {
      await updatePreferencesMutation.mutateAsync({
        userId,
        type,
        data,
      });
      // After updating preferences, user is no longer new
      setIsNewUser(false);
      refreshRecommendations();
    },
    [userId, updatePreferencesMutation, refreshRecommendations]
  );

  return {
    activeType,
    setActiveType,
    isMobilePreferencesOpen,
    setMobilePreferencesOpen,
    preferences: preferencesQuery.data,
    isPreferencesLoading: preferencesQuery.isLoading,
    recommendations: recommendationsQuery.data,
    isRecommendationsLoading: recommendationsQuery.isLoading,
    refreshRecommendations,
    handlePreferencesUpdate,
    isUpdatingPreferences: updatePreferencesMutation.isPending,
    isGeneratingRecommendations: generateRecommendationsMutation.isPending,
    isNewUser,
  };
}
