import { TMDB_API_KEY } from "../../env.config";
import { createSupabaseServerInstance } from "../../db/supabase.client";
import type { AstroCookies } from "astro";

interface MovieDetails {
  id: string;
  title: string;
  original_title?: string;
  release_year?: string;
  tmdb_id?: string;
}

// Context type that matches what Supabase client expects
interface RequestContext {
  headers: Headers;
  cookies: AstroCookies;
}

/**
 * Service to handle mappings between movie IDs and titles
 */
export const MovieMappingService = {
  /**
   * Extracts TMDB ID from different ID formats
   * @param movieId The movie ID in various formats
   * @returns The extracted TMDB ID or null if not found
   */
  extractTmdbId(movieId: string): string | null {
    if (!movieId) return null;

    // Try to extract TMDB ID from the ID format
    if (movieId.startsWith("movie_")) {
      // Handle "movie_1234" format
      const withoutPrefix = movieId.substring(6); // Remove "movie_" prefix

      // If it contains dashes (like movie_1234-timestamp-random), extract just the ID part
      if (withoutPrefix.includes("-")) {
        const parts = withoutPrefix.split("-");
        if (parts.length > 0 && !isNaN(Number(parts[0]))) {
          return parts[0]; // Return just the numeric ID
        }
      }

      // If no dashes, just return the ID part if numeric
      if (!isNaN(Number(withoutPrefix))) {
        return withoutPrefix;
      }
    }

    // Handle format like "1233413-1746358501813-2pas4o2" - numbers before first dash
    if (movieId.includes("-")) {
      const parts = movieId.split("-");
      if (parts.length > 0 && !isNaN(Number(parts[0]))) {
        return parts[0]; // Return the numeric part before the first dash
      }
    }

    // Check if entire string is a numeric ID
    if (!isNaN(Number(movieId))) {
      return movieId;
    }

    // Handle IMDB IDs (tt followed by numbers)
    if (movieId.startsWith("tt") && !isNaN(Number(movieId.substring(2)))) {
      // For IMDB IDs, we would ideally look up the TMDB ID, but for now return null
      console.warn(`IMDB ID format detected: ${movieId} - TMDB lookup required`);
      return null;
    }

    return null;
  },

  /**
   * Fetches movie details from TMDB API
   * @param movieId Movie ID in any format
   * @returns Movie details if found, null otherwise
   */
  async fetchMovieFromTMDB(movieId: string): Promise<MovieDetails | null> {
    if (!TMDB_API_KEY) {
      console.error("TMDB API key not set");
      return null;
    }

    // First extract TMDB ID from whatever format it's in
    const tmdbId = this.extractTmdbId(movieId);

    // Validate we got a valid ID
    if (!tmdbId) {
      console.warn(`Could not extract valid TMDB ID from: ${movieId}`);
      return null;
    }

    if (isNaN(Number(tmdbId))) {
      console.warn(`Extracted TMDB ID is not a number: ${tmdbId} (from ${movieId})`);
      return null;
    }

    try {
      console.log(`Fetching TMDB data for ID: ${tmdbId} (from ${movieId})`);

      const response = await fetch(`https://api.themoviedb.org/3/movie/${tmdbId}`, {
        method: "GET",
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${TMDB_API_KEY}`,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.warn(`Movie not found in TMDB database: ${tmdbId}`);
        } else {
          console.error(`Error fetching movie data from TMDB: ${response.status} for ID ${tmdbId}`);
        }
        return null;
      }

      const data = await response.json();

      return {
        id: `movie_${data.id}`,
        title: data.title,
        original_title: data.original_title,
        release_year: data.release_date ? data.release_date.substring(0, 4) : undefined,
        tmdb_id: String(data.id),
      };
    } catch (error) {
      console.error(`Error fetching movie data from TMDB for ID ${tmdbId}:`, error);
      return null;
    }
  },

  /**
   * Gets movie title from movie ID, fetching from TMDB if necessary
   * @param movieId Movie ID
   * @param context Request context for Supabase client
   * @returns Movie title if found, original ID otherwise
   */
  async getMovieTitle(movieId: string, context: RequestContext): Promise<string> {
    if (!movieId) return "Unknown Movie";

    try {
      // Create Supabase client
      const supabase = createSupabaseServerInstance(context);

      // Check if we already have this movie in our mapping table
      const { data: existingMapping } = await supabase
        .from("movies_mapping")
        .select("title")
        .eq("movie_id", movieId)
        .maybeSingle();

      if (existingMapping?.title) {
        return existingMapping.title;
      }

      // No existing mapping, try to fetch from TMDB
      const movieDetails = await this.fetchMovieFromTMDB(movieId);
      if (!movieDetails) {
        // Failed to fetch details, return original ID
        return movieId;
      }

      // Store mapping for future use
      await supabase.from("movies_mapping").insert({
        movie_id: movieDetails.id,
        title: movieDetails.title,
        original_title: movieDetails.original_title,
        release_year: movieDetails.release_year,
        tmdb_id: movieDetails.tmdb_id,
      });

      return movieDetails.title;
    } catch (error) {
      console.error("Error in getMovieTitle:", error);
      return movieId;
    }
  },

  /**
   * Translate movie IDs to titles for API consumption
   * @param movieIds Array of movie IDs
   * @param context Context for Supabase client
   * @returns Array of movie titles
   */
  async translateMovieIdsToTitles(movieIds: string[], context: RequestContext): Promise<string[]> {
    if (!movieIds || movieIds.length === 0) {
      return [];
    }

    try {
      // Filter out invalid IDs
      const validMovieIds = movieIds.filter((id) => id && typeof id === "string");

      if (validMovieIds.length === 0) {
        return [];
      }

      // Process in batches to avoid overwhelming the database or TMDB API
      const batchSize = 5;
      const batches = [];

      for (let i = 0; i < validMovieIds.length; i += batchSize) {
        batches.push(validMovieIds.slice(i, i + batchSize));
      }

      const allTitles: string[] = [];

      for (const batch of batches) {
        // Use Promise.allSettled to continue even if some promises fail
        const results = await Promise.allSettled(
          batch.map((id) => this.getMovieTitle(id, context))
        );

        // Extract successful results and handle failures gracefully
        results.forEach((result, index) => {
          if (result.status === "fulfilled") {
            allTitles.push(result.value);
          } else {
            // For failed title lookups, use the original ID
            console.warn(`Failed to get title for movie ID ${batch[index]}: ${result.reason}`);
            allTitles.push(batch[index]);
          }
        });
      }

      // Filter out duplicates and non-string values
      return [...new Set(allTitles.filter((title) => title && typeof title === "string"))];
    } catch (error) {
      console.error("Error translating movie IDs to titles:", error);
      return movieIds; // Return original IDs on error
    }
  },
};
