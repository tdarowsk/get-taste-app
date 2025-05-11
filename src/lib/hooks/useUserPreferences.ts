import { useQuery } from "@tanstack/react-query";
import type { UserPreferencesDTO } from "../../types";

/**
 * Hook for accessing and managing user preferences
 */
export function useUserPreferences(userId: string) {
  return useQuery<UserPreferencesDTO>({
    queryKey: ["preferences", userId],
    queryFn: async () => {
      if (!userId) {
        console.warn("useUserPreferences called with invalid userId");
        return {
          music: { genres: [], artists: [] },
          film: { genres: [], cast: [], director: null, screenwriter: null },
        };
      }

      try {
        // First, fetch preferences normally
        const response = await fetch(`/api/users/${userId}/preferences`);

        if (!response.ok) {
          throw new Error(`Failed to fetch preferences: ${response.statusText}`);
        }

        const data = await response.json();

        // Check if film preferences exist and have genres
        const hasFilmGenres =
          data.filmPreferences &&
          Array.isArray(data.filmPreferences.genres) &&
          data.filmPreferences.genres.length > 0;

        // If no film genres found but there are liked movies, trigger a refresh to analyze them
        const hasLikedMovies =
          data.filmPreferences &&
          Array.isArray(data.filmPreferences.liked_movies) &&
          data.filmPreferences.liked_movies.length > 0;

        if (!hasFilmGenres && hasLikedMovies) {
          console.log("Detected liked movies but no genres, triggering preference refresh");

          // Call the API with refresh=true to analyze liked movies
          const refreshResponse = await fetch(
            `/api/users/${userId}/preferences?refresh=true&forceUpdate=true`
          );

          if (refreshResponse.ok) {
            return await refreshResponse.json();
          }

          // If refresh fails, return original data
          return data;
        }

        return data;
      } catch (error) {
        console.error("Error fetching user preferences:", error);
        // Return empty preferences object on error
        return {
          music: { genres: [], artists: [] },
          film: { genres: [], cast: [], director: null, screenwriter: null },
        };
      }
    },
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
