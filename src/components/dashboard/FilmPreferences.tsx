import { useState, useEffect, useCallback } from "react";
import { Button } from "../ui/button";
import { useToast } from "../ui";

interface FilmPreferencesProps {
  userId: string;
  onPreferencesChange?: () => void;
  isNewUser?: boolean;
}

export function FilmPreferences({
  userId,
  onPreferencesChange,
  isNewUser = false,
}: FilmPreferencesProps) {
  const [genres, setGenres] = useState<string[]>([]);
  const [likedMovies, setLikedMovies] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { toast } = useToast();
  const [lastToastTime, setLastToastTime] = useState(0);

  // Funkcja do wyświetlania powiadomień z throttlingiem
  const showToast = useCallback(
    (title: string, description: string, variant: "default" | "destructive" = "default") => {
      const now = Date.now();
      // Ogranicz wyświetlanie powiadomień do maksymalnie 1 na 5 sekund
      if (now - lastToastTime > 5000) {
        toast({ title, description, variant });
        setLastToastTime(now);
      }
    },
    [toast, lastToastTime]
  );

  // Force refresh preferences - Define first to avoid dependency cycles
  const refreshPreferences = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    setIsAutoRefreshing(true);
    setErrorMessage(null);
    try {
      // Add forceUpdate parameter for more aggressive preference detection
      const response = await fetch(
        `/api/users/${userId}/preferences?refresh=true&forceUpdate=true`
      );

      if (response.ok) {
        const data = await response.json();
        // Extract film genres from the response
        if (data.filmPreferences) {
          if (Array.isArray(data.filmPreferences.genres)) {
            setGenres(data.filmPreferences.genres);
          }
          if (Array.isArray(data.filmPreferences.liked_movies)) {
            setLikedMovies(data.filmPreferences.liked_movies);
          }
        }

        showToast(
          "Preferences updated",
          "Your film preferences have been refreshed based on your liked movies."
        );

        // Notify parent component
        if (onPreferencesChange) {
          onPreferencesChange();
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        setErrorMessage(`Failed to refresh preferences: ${errorData.error || response.statusText}`);

        showToast(
          "Error",
          `Failed to refresh preferences: ${errorData.error || response.statusText}`,
          "destructive"
        );
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error occurred";
      setErrorMessage(errorMsg);

      showToast("Error", `Failed to refresh preferences: ${errorMsg}`, "destructive");
    } finally {
      setIsLoading(false);
      setIsAutoRefreshing(false);
    }
  }, [userId, showToast, onPreferencesChange]);

  // Fetch user's film preferences
  useEffect(() => {
    const fetchPreferences = async () => {
      if (!userId) return;

      setIsLoading(true);
      setErrorMessage(null);
      try {
        const response = await fetch(`/api/users/${userId}/preferences`);

        if (response.ok) {
          const data = await response.json();
          // Extract film genres from the response
          if (data.filmPreferences) {
            if (Array.isArray(data.filmPreferences.genres)) {
              setGenres(data.filmPreferences.genres);
            }
            if (Array.isArray(data.filmPreferences.liked_movies)) {
              setLikedMovies(data.filmPreferences.liked_movies);
            }

            // Pomijamy automatycznie odświeżanie dla nowych użytkowników
            // lub jeśli już trwa odświeżanie
            if (
              !isNewUser &&
              !isAutoRefreshing &&
              (!data.filmPreferences.genres || data.filmPreferences.genres.length === 0) &&
              data.filmPreferences.liked_movies &&
              data.filmPreferences.liked_movies.length > 0 &&
              userId
            ) {
              // Set auto-refreshing state
              setIsAutoRefreshing(true);
              // Wait a moment to avoid UI flicker
              setTimeout(() => {
                refreshPreferences();
              }, 500);
            }
          }
        } else {
          const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
          setErrorMessage(`Failed to fetch preferences: ${errorData.error || response.statusText}`);
        }
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Unknown error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPreferences();
  }, [userId, refreshPreferences, isNewUser, isAutoRefreshing]);

  // Use default genres function
  const useDefaultGenres = async () => {
    if (!userId) return;

    setIsLoading(true);
    setErrorMessage(null);

    // Domyślne gatunki do ustawienia
    const defaultGenres = ["Action", "Drama", "Comedy", "Thriller", "Adventure", "Sci-Fi"];

    try {
      const adminResponse = await fetch(`/api/users/${userId}/admin-preferences`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filmPreferences: {
            genres: defaultGenres,
            liked_movies: likedMovies,
          },
        }),
      });

      const adminData = await adminResponse.json();
      // Check if the admin endpoint indicated a warning (UI-only update)
      if (adminData.warning) {
        setGenres(defaultGenres);

        showToast(
          "Preferences displayed",
          adminData.message || "Default film genres have been applied to your profile display."
        );

        if (onPreferencesChange) {
          onPreferencesChange();
        }

        setIsLoading(false);
        return;
      }

      // If the admin endpoint was successful
      if (adminResponse.ok && adminData.success) {
        showToast("Preferences updated", "Default film genres have been applied to your profile.");

        // Use the returned data if available
        if (adminData.data && Array.isArray(adminData.data.genres)) {
          setGenres(adminData.data.genres);
        } else {
          // Otherwise use our default genres
          setGenres(defaultGenres);
        }

        if (onPreferencesChange) {
          onPreferencesChange();
        }

        setIsLoading(false);
        return;
      }

      // If admin endpoint failed but didn't indicate it was a UI-only update
      // Try standard preferences endpoint
      if (!adminResponse.ok) {
        const response = await fetch(`/api/users/${userId}/preferences`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            filmPreferences: {
              genres: defaultGenres,
              liked_movies: likedMovies,
            },
          }),
        });

        if (response.ok) {
          showToast(
            "Preferences updated",
            "Default film genres have been applied to your profile."
          );

          // Use our default genres since the response might not include them
          setGenres(defaultGenres);

          if (onPreferencesChange) {
            onPreferencesChange();
          }

          setIsLoading(false);
          return;
        }

        // Both approaches failed - update UI only as a last resort
        setGenres(defaultGenres);

        showToast(
          "UI Updated (No Backend)",
          "Default genres are only shown in the UI. Backend update failed. Changes will not persist."
        );

        if (onPreferencesChange) {
          onPreferencesChange();
        }
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error));

      showToast(
        "Error",
        `Failed to apply default genres: ${error instanceof Error ? error.message : String(error)}`,
        "destructive"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Funkcja do odświeżania preferencji używając UserPreferencesService
  const refreshFilmPreferences = async () => {
    if (!userId) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      // Wywołaj endpoint odświeżania preferencji
      const response = await fetch(`/api/users/${userId}/refresh-preferences`, {
        method: "POST",
      });

      const data = await response.json();

      if (data.success) {
        showToast(
          "Preferencje zaktualizowane",
          "Twoje preferencje zostały odświeżone na podstawie polubionych filmów."
        );
      } else {
        showToast(
          "Informacja",
          data.message || "Nie znaleziono polubionych filmów do wygenerowania preferencji.",
          "default"
        );
      }

      // Odśwież dane
      await refreshPreferences();

      if (onPreferencesChange) {
        onPreferencesChange();
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error));

      showToast(
        "Błąd",
        `Nie udało się odświeżyć preferencji: ${
          error instanceof Error ? error.message : String(error)
        }`,
        "destructive"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">Your Film Preferences</h3>
        <Button size="sm" onClick={refreshPreferences} disabled={isLoading}>
          {isLoading ? "Refreshing..." : "Refresh Preferences"}
        </Button>
      </div>

      <div className="text-sm text-gray-300 pb-2">
        These preferences are automatically generated based on the movies you&apos;ve liked.
        Continue to like more movies to refine your preferences.
      </div>

      {errorMessage && (
        <div className="bg-red-900/30 border border-red-500/30 rounded p-4 text-red-200 text-sm">
          <p className="font-medium">Error</p>
          <p>{errorMessage}</p>
          <div className="mt-4">
            <Button
              variant="outline"
              size="sm"
              className="bg-red-800/40 border-red-500/30 text-red-100 hover:bg-red-700/60"
              onClick={useDefaultGenres}
              disabled={isLoading}
            >
              {isLoading ? "Updating..." : "Force use default genres"}
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="py-4 text-center text-gray-400">
          {isAutoRefreshing
            ? "Analyzing your liked movies to determine your preferences..."
            : "Loading preferences..."}
        </div>
      ) : genres.length > 0 ? (
        <div className="space-y-4">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-md p-4">
            <h4 className="text-md font-medium text-white mb-2">Your Favorite Genres</h4>
            <div className="flex flex-wrap gap-2">
              {genres.map((genre) => (
                <div
                  key={genre}
                  className="px-3 py-1 bg-gradient-to-r from-purple-900/60 to-blue-900/60 rounded-full text-xs text-white"
                >
                  {genre}
                </div>
              ))}
            </div>
            <div className="mt-3 text-xs text-gray-400">
              <Button
                variant="link"
                size="sm"
                className="text-gray-400 hover:text-gray-300 p-0 h-auto"
                onClick={useDefaultGenres}
              >
                Reset to default genres
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-amber-900/30 border border-amber-500/30 rounded p-4 text-amber-200 text-sm">
          <p className="mb-2 font-medium">No film preferences yet</p>
          <p>
            Like some movies in the recommendations to automatically build your preference profile.
            The more movies you rate, the better your recommendations will become.
          </p>
          {likedMovies.length > 0 && (
            <div className="mt-3 p-3 bg-amber-800/30 rounded">
              <p className="text-xs font-medium">Notice:</p>
              <p className="text-xs">
                You have liked {likedMovies.length} movies but no genres were detected. This can
                happen if the movie data doesn&apos;t include genre information. Try refreshing your
                preferences to attempt detection again.
              </p>
            </div>
          )}
        </div>
      )}

      {likedMovies.length > 0 && genres.length === 0 && (
        <div className="bg-amber-900/30 border border-amber-500/30 rounded p-4 text-amber-200 text-sm mt-4">
          <p className="mb-2 font-medium">Movies detected but genres not found</p>
          <p className="text-xs mb-3">
            Found {likedMovies.length} liked movies, but couldn&apos;t detect genres. This could be
            due to missing metadata or database permission issues.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="bg-amber-800/40 border-amber-500/30 text-amber-100 hover:bg-amber-700/60"
            onClick={useDefaultGenres}
            disabled={isLoading}
          >
            {isLoading ? "Updating..." : "Use default genres"}
          </Button>
        </div>
      )}

      <div className="mt-3 text-xs text-gray-400">
        <Button
          variant="link"
          size="sm"
          className="text-gray-400 hover:text-gray-300 p-0 h-auto"
          onClick={refreshFilmPreferences}
        >
          Odśwież preferencje
        </Button>
      </div>
    </div>
  );
}

// Add default export to support both import methods
export default FilmPreferences;
