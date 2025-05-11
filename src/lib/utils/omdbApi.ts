/**
 * Utilities for fetching movie details from OMDB API
 */
import { OMDB_API_KEY } from "../../env.config";

/**
 * Fetch movie details from OMDB API by title
 */
export async function fetchMovieDetailsByTitle(title: string): Promise<{
  poster: string | null;
  director: string | null;
  year: string | null;
  error?: string;
}> {
  try {
    // Get the API key from environment config
    const apiKey = OMDB_API_KEY;

    if (!apiKey) {
      return {
        poster: null,
        director: null,
        year: null,
        error: "API key missing",
      };
    }

    // Encode the title for the URL
    const encodedTitle = encodeURIComponent(title);

    // Construct the API URL
    const url = `http://www.omdbapi.com/?t=${encodedTitle}&apikey=${apiKey}`;

    // Fetch data from OMDB API
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`OMDB API responded with status ${response.status}`);
    }

    const data = await response.json();

    // Check if the API found the movie
    if (data.Response === "False") {
      return {
        poster: null,
        director: null,
        year: null,
        error: data.Error || "Movie not found",
      };
    }

    // Return the relevant movie details
    return {
      poster: data.Poster && data.Poster !== "N/A" ? data.Poster : null,
      director: data.Director && data.Director !== "N/A" ? data.Director : null,
      year: data.Year && data.Year !== "N/A" ? data.Year : null,
    };
  } catch (error) {
    return {
      poster: null,
      director: null,
      year: null,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Cache for OMDB API responses to avoid redundant requests
 */
const omdbCache = new Map<
  string,
  {
    poster: string | null;
    director: string | null;
    year: string | null;
    error?: string;
  }
>();

/**
 * Fetch movie details with caching to minimize API requests
 */
export async function fetchMovieDetailsWithCache(title: string): Promise<{
  poster: string | null;
  director: string | null;
  year: string | null;
  error?: string;
}> {
  // Check if we already have this title in cache
  const cachedResult = omdbCache.get(title);
  if (cachedResult) {
    return cachedResult;
  }

  // Fetch from API if not in cache
  const details = await fetchMovieDetailsByTitle(title);

  // Store in cache for future use
  omdbCache.set(title, details);

  return details;
}
