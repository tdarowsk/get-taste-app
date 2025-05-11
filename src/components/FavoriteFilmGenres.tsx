import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import type { MetadataItem } from "../types/recommendations";
import { MetadataType } from "../types/recommendations";

interface FavoriteFilmGenresProps {
  userId: string;
  onRefresh?: () => void;
}

interface GenreData {
  name: string;
  count: number;
  weight: number;
}

export function FavoriteFilmGenres({ userId, onRefresh }: FavoriteFilmGenresProps) {
  const [favoriteGenres, setFavoriteGenres] = useState<GenreData[]>([]);

  // Pobieramy dane o gatunkach filmowych z API
  const { data, isLoading, error, refetch } = useQuery<MetadataItem[]>({
    queryKey: ["favoriteFilmGenres", userId],
    queryFn: async () => {
      const response = await fetch(`/api/users/${userId}/preferences/genres?type=film`);
      if (!response.ok) {
        throw new Error("Nie udało się pobrać ulubionych gatunków");
      }
      return response.json();
    },
    staleTime: 60 * 1000, // 1 minuta - zmniejszono czas, aby dane częściej się odświeżały
  });

  useEffect(() => {
    if (data && data.length > 0) {
      // Sortujemy gatunki według liczby wystąpień (malejąco)
      const sortedGenres = data
        .filter((item) => item.type === MetadataType.FILM_GENRE)
        .map((item) => ({
          name: item.name,
          count: item.count,
          weight: item.weight,
        }))
        .sort((a, b) => b.count - a.count);

      setFavoriteGenres(sortedGenres);
    } else {
      setFavoriteGenres([]);
    }
  }, [data]);

  const handleRefresh = async () => {
    try {
      // Najpierw wywołaj endpoint odświeżania preferencji
      const response = await fetch(`/api/users/${userId}/refresh-preferences`, {
        method: "POST",
      });

      const result = await response.json();

      if (result.success) {
        console.log("Preferencje zostały pomyślnie odświeżone");
      } else {
        console.warn("Nie udało się odświeżyć preferencji:", result.message);
      }

      // Następnie pobierz zaktualizowane dane
      refetch();

      // Wywołaj funkcję onRefresh jeśli została przekazana
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error("Błąd podczas odświeżania preferencji:", error);
      // Mimo błędu, próbujemy odświeżyć dane
      refetch();
    }
  };

  // Funkcja do określania koloru gradientu na podstawie wagi gatunku
  const getGenreGradient = (weight: number) => {
    if (weight > 0.8) {
      return "from-purple-700/80 to-blue-700/80"; // Bardzo popularne
    } else if (weight > 0.6) {
      return "from-purple-800/70 to-blue-800/70"; // Popularne
    } else if (weight > 0.4) {
      return "from-purple-900/60 to-blue-900/60"; // Średnio popularne
    } else if (weight > 0.2) {
      return "from-purple-900/50 to-blue-900/50"; // Mniej popularne
    } else {
      return "from-purple-900/40 to-blue-900/40"; // Najmniej popularne
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <h3 className="text-2xl font-bold text-white">Your Film Preferences</h3>
        <Button
          variant="outline"
          className="self-end bg-neutral-800 text-sm border-0"
          onClick={handleRefresh}
          disabled={isLoading}
        >
          Refresh Preferences
        </Button>
      </div>

      <div className="text-sm text-gray-300">
        These preferences are automatically generated based on the movies you&apos;ve liked.
        Continue to like more movies to refine your preferences.
      </div>

      {isLoading ? (
        <div className="py-4 text-center text-gray-400">Loading preferences...</div>
      ) : error ? (
        <div className="py-4 text-center text-red-400">
          Error loading preferences. Please try again.
        </div>
      ) : favoriteGenres.length > 0 ? (
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-md p-4">
          <ScrollArea className="h-full max-h-52">
            <div className="flex flex-wrap gap-2">
              {favoriteGenres.map((genre) => (
                <div
                  key={genre.name}
                  className={`px-3 py-1 bg-gradient-to-r ${getGenreGradient(genre.weight)} rounded-full text-xs text-white`}
                  title={`Popularity: ${Math.round(genre.weight * 100)}%`}
                >
                  {genre.name}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      ) : (
        <div className="bg-amber-900/30 border border-amber-500/30 rounded p-4 text-amber-200 text-sm">
          <p className="font-medium">No film preferences yet</p>
          <p>
            Like some movies in the recommendations to automatically build your preference profile.
            The more movies you rate, the better your recommendations will become.
          </p>
          <div className="mt-4">
            <Button
              variant="outline"
              size="sm"
              className="bg-amber-800/40 border-amber-500/30 text-amber-100 hover:bg-amber-700/60"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              {isLoading ? "Refreshing..." : "Check again"}
            </Button>
          </div>
        </div>
      )}

      {/* Dodajemy przycisk do czyszczenia preferencji */}
      <div className="mt-4">
        <Button
          variant="outline"
          size="sm"
          className="bg-red-950/40 border-red-800/30 text-red-200 hover:bg-red-900/60"
          onClick={async () => {
            if (!userId) return;

            if (
              !confirm(
                "Are you sure you want to clear all genre preferences? This action cannot be undone."
              )
            ) {
              return;
            }

            try {
              // Wywołaj endpoint czyszczenia preferencji
              const response = await fetch(`/api/users/${userId}/admin-preferences`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  filmPreferences: {
                    genres: [], // Pusta tablica zamiast domyślnych gatunków
                  },
                }),
              });

              if (response.ok) {
                console.log("Preferences cleared successfully");
                // Odśwież dane
                refetch();

                if (onRefresh) {
                  onRefresh();
                }
              } else {
                console.error("Failed to clear preferences");
              }
            } catch (error) {
              console.error("Error clearing preferences:", error);
            }
          }}
        >
          Clear all genre preferences
        </Button>
        <p className="text-xs text-gray-400 mt-1">
          This option removes all genre preferences and lets you start fresh without any default
          genres.
        </p>
      </div>
    </div>
  );
}
