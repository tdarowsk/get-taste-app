import { useState, useEffect } from "react";
import { MoviePosterService } from "@/lib/services/movie-poster.service";

interface UseMoviePosterResult {
  posterUrl: string | null;
  backdropUrl: string | null;
  isLoading: boolean;
  error: boolean;
}

export function useMoviePoster(title: string): UseMoviePosterResult {
  const [posterUrl, setPosterUrl] = useState<string | null>(null);
  const [backdropUrl, setBackdropUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchPosters = async () => {
      if (!title) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(false);

        const [poster, backdrop] = await Promise.all([
          MoviePosterService.getMoviePosterUrl(title),
          MoviePosterService.getMovieBackdropUrl(title),
        ]);

        setPosterUrl(poster);
        setBackdropUrl(backdrop);
      } catch (err) {
        console.error("Error loading movie posters:", err);
        setError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosters();
  }, [title]);

  return {
    posterUrl,
    backdropUrl,
    isLoading,
    error,
  };
}
