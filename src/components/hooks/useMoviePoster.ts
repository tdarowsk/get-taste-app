import { useState, useEffect } from "react";

// Implementation for MoviePosterService
const MoviePosterService = {
  getMoviePosterUrl: async (title: string): Promise<string | null> => {
    // Fallback implementation
    return `https://placehold.co/240x360?text=${encodeURIComponent(title)}`;
  },

  getMovieBackdropUrl: async (title: string): Promise<string | null> => {
    // Fallback implementation
    return `https://placehold.co/1280x720?text=${encodeURIComponent(title)}`;
  },
};

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
      } catch {
        // console.error("Error loading movie posters");
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
