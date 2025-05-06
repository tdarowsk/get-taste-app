// import { supabaseClient } from "../../db/supabase.client";
// import { createClient } from "@supabase/supabase-js";
import type {
  CreateRecommendationsCommand,
  RecommendationDTO,
  RecommendationDataDetails,
} from "../../types";
import type { Database } from "../../db/database.types";
import { TMDB_API_KEY, OPENROUTER_API_KEY } from "../../env.config";
import { OpenRouterService } from "./openrouter.service";
import { getSystemPrompts } from "../utils/ai-prompts";
import { FeedbackService } from "./feedback.service";
import { UniqueRecommendationsService } from "./uniqueRecommendations.service";
import { supabaseAdmin } from "../../db/supabase.admin";

// Create admin supabase client with service role key to bypass RLS
// Note: This is now imported from supabase.admin.ts
// const supabaseAdmin = createClient<Database>(SUPABASE_URL, SUPABASE_KEY, {
//   auth: {
//     persistSession: false,
//     autoRefreshToken: false,
//   },
// });

/**
 * Interface for the TMDB similar movies API response
 */
interface TmdbSimilarMovie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  release_date: string;
  vote_average: number;
  genre_ids: number[];
}

/**
 * Interface for the TMDB trending movies API response
 */
interface TmdbTrendingMovie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  release_date: string;
  vote_average: number;
  genre_ids: number[];
}

type MusicPreferences = Database["public"]["Tables"]["music_preferences"]["Row"];
type FilmPreferences = Database["public"]["Tables"]["film_preferences"]["Row"];
type Json = Database["public"]["Tables"]["recommendations"]["Row"]["data"];
type RecommendationData = Database["public"]["Tables"]["recommendations"]["Insert"];

/**
 * Serwis odpowiedzialny za generowanie i zarządzanie rekomendacjami.
 */
export const RecommendationService = {
  /**
   * Helper function to ensure userId is always a valid string
   * @private
   */
  _ensureStringUserId(userId: unknown): string {
    if (userId === undefined || userId === null) {
      throw new Error("User ID cannot be null or undefined");
    }

    // Convert to string
    const strUserId = String(userId);

    // Check if the string is empty or 'undefined'
    if (!strUserId || strUserId.trim() === "" || strUserId === "undefined") {
      throw new Error("User ID cannot be empty or 'undefined'");
    }

    return strUserId;
  },

  /**
   * Tests OpenRouter connectivity to determine if AI recommendations can be generated
   * @private
   */
  async _testOpenRouterConnectivity(): Promise<boolean> {
    if (!OPENROUTER_API_KEY) {
      return false;
    }

    try {
      // Test connectivity with a HEAD request
      const testResponse = await fetch("https://openrouter.ai/api/v1/auth/key", {
        method: "HEAD",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "HTTP-Referer": "https://gettaste.app", // Adding HTTP referer for tracking
          "X-Title": "GetTaste App",
        },
      });

      return testResponse.ok;
    } catch {
      // Error connecting to OpenRouter API
      return false;
    }
  },

  /**
   * Generuje nowe rekomendacje dla użytkownika.
   *
   * @param userId - ID użytkownika
   * @param command - Parametry generowania rekomendacji
   * @returns Wygenerowane rekomendacje
   */
  async generateRecommendations(
    userId: unknown,
    command: CreateRecommendationsCommand & { force_ai?: boolean }
  ): Promise<RecommendationDTO> {
    // Always convert userId to string
    const userIdStr = this._ensureStringUserId(userId);

    // Check if Supabase admin client is available
    if (!supabaseAdmin) {
      throw new Error("Error generating recommendations: Supabase admin client not available");
    }

    // Check for existing recommendations (only if force_refresh is false)
    if (!command.force_refresh) {
      const existingRecommendation = await this.getLatestRecommendation(userIdStr, command.type);
      if (existingRecommendation) {
        return existingRecommendation;
      }
    }

    // Get user preferences data
    const preferences = await this.getUserPreferences(userIdStr, command.type);

    // Get user feedback history
    const feedbackHistory = await FeedbackService.getUserFeedbackHistory(
      userIdStr,
      command.type,
      10
    );

    // Generate recommendations using OpenRouter.ai
    let generatedData: RecommendationDataDetails;

    // Test OpenRouter connectivity first
    const canConnectToOpenRouter = await this._testOpenRouterConnectivity();

    // Check if OpenRouter API is available and accessible
    if (!canConnectToOpenRouter) {
      // Force AI fallback case - go to TMDB
      generatedData = await this.getTMDBRecommendations(command.type);
    } else {
      // Configure OpenRouter with API key
      OpenRouterService.configure(OPENROUTER_API_KEY);

      try {
        // Poprawne wywołanie generateRecommendations zgodne z API serwisu
        generatedData = await OpenRouterService.generateRecommendations<RecommendationDataDetails>(
          preferences,
          feedbackHistory,
          command.type,
          {
            systemPrompt: getSystemPrompts().recommendationGenerator(command.type),
            temperature: 0.7,
            maxTokens: 2000,
          }
        );
      } catch {
        // If OpenRouter call fails, fall back to TMDB
        generatedData = await this.getTMDBRecommendations(command.type);
      }
    }

    // Filter unique recommendations to avoid duplicates
    const uniqueItems = await UniqueRecommendationsService.filterUniqueItems(
      userIdStr,
      generatedData.items || [],
      command.type
    );

    // Update recommendations with unique items
    generatedData.items = uniqueItems;

    // Create a proper recommendation data object
    const properData = {
      title:
        generatedData.title || `${command.type === "music" ? "Music" : "Film"} Recommendations`,
      description: generatedData.description || `Personalized ${command.type} recommendations`,
      items: Array.isArray(generatedData.items) ? generatedData.items : [],
    };

    // Create the insert data for the database
    const insertData: RecommendationData = {
      user_id: userIdStr,
      type: command.type,
      data: properData as unknown as Json, // Required to satisfy TypeScript
    };

    try {
      // Insert into the database
      const { data: insertedData, error: insertError } = await supabaseAdmin
        .from("recommendations")
        .insert(insertData)
        .select("*")
        .single();

      if (insertError) {
        // Create a fallback object with a timestamp-based ID
        return {
          id: Date.now(),
          user_id: userIdStr,
          type: command.type,
          data: properData,
          created_at: new Date().toISOString(),
        };
      }

      if (!insertedData) {
        // Create a fallback object with a timestamp-based ID
        return {
          id: Date.now(),
          user_id: userIdStr,
          type: command.type,
          data: properData,
          created_at: new Date().toISOString(),
        };
      }

      // Return the successfully saved recommendation
      return {
        id: typeof insertedData.id === "string" ? parseInt(insertedData.id, 10) : insertedData.id,
        user_id: String(insertedData.user_id),
        type: insertedData.type as "music" | "film",
        data: insertedData.data as unknown as RecommendationDataDetails,
        created_at: insertedData.created_at,
      };
    } catch {
      // Database error, return fallback object
      return {
        id: Date.now(),
        user_id: userIdStr,
        type: command.type,
        data: properData,
        created_at: new Date().toISOString(),
      };
    }
  },

  /**
   * Pobiera najnowszą rekomendację danego typu dla użytkownika.
   *
   * @param userId - ID użytkownika
   * @param type - Typ rekomendacji ("music" lub "film")
   * @returns Najnowsza rekomendacja lub null
   */
  async getLatestRecommendation(
    userId: unknown,
    type: "music" | "film"
  ): Promise<RecommendationDTO | null> {
    try {
      // Always convert userId to string
      const userIdStr = this._ensureStringUserId(userId);

      if (!supabaseAdmin) {
        return null;
      }

      const { data, error } = await supabaseAdmin
        .from("recommendations")
        .select("*")
        .eq("user_id", userIdStr)
        .eq("type", type)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error) {
        return null;
      }

      if (!data) {
        return null;
      }

      // Fix the user_id if it's "undefined"
      if (data.user_id === "undefined") {
        data.user_id = userIdStr;
      }

      // Create the recommendation DTO
      const recommendationDTO: RecommendationDTO = {
        id: data.id,
        user_id: String(data.user_id), // Ensure it's a string
        type: data.type as "music" | "film",
        data: data.data as unknown as RecommendationDataDetails,
        created_at: data.created_at,
      };

      // Additional check for undefined user_id in the data structure
      if (recommendationDTO.data && typeof recommendationDTO.data === "object") {
        // Check if there's a user_id in the data property that needs fixing
        if ("user_id" in recommendationDTO.data && recommendationDTO.data.user_id === "undefined") {
          recommendationDTO.data.user_id = userIdStr;
        }
      }

      return recommendationDTO;
    } catch {
      // Error occurred during retrieval
      return null;
    }
  },

  /**
   * Pobiera preferencje użytkownika odpowiednie dla danego typu rekomendacji.
   *
   * @param userId - ID użytkownika
   * @param type - Typ rekomendacji ("music" lub "film")
   * @returns Preferencje użytkownika
   */
  async getUserPreferences(
    userId: unknown,
    type: "music" | "film"
  ): Promise<MusicPreferences | FilmPreferences> {
    // Always convert userId to string
    const userIdStr = this._ensureStringUserId(userId);

    const table = type === "music" ? "music_preferences" : "film_preferences";

    if (!supabaseAdmin) {
      throw new Error(`Error getting user preferences: Supabase admin client not available`);
    }

    // Ensure we always use a string for user_id in the query
    const { data, error } = await supabaseAdmin
      .from(table)
      .select("*")
      .eq("user_id", userIdStr)
      .limit(1);

    if (error) {
      throw new Error(`Error getting user preferences: ${error.message}`);
    }

    if (!data || data.length === 0) {
      // Return default preferences if none exist
      return {
        user_id: userIdStr,
        genres: null,
        ...(type === "music"
          ? { artists: null }
          : { director: null, screenwriter: null, cast: null, liked_movies: null }),
      };
    }

    return data[0];
  },

  /**
   * Gets recommendations from TMDB API as a fallback.
   *
   * @param type - Recommendation type ("music" or "film")
   * @returns Generated recommendations
   */
  async getTMDBRecommendations(type: "music" | "film"): Promise<RecommendationDataDetails> {
    try {
      // For music, we need to handle differently since TMDB doesn't provide music data
      if (type === "music") {
        return {
          title: "Music Recommendations Unavailable",
          description: "Unable to provide music recommendations at this time",
          items: [
            {
              id: `unavailable_${Date.now()}`,
              name: "Music recommendations unavailable",
              type: "message",
              details: {
                genres: ["N/A"],
                artist: "N/A",
                year: new Date().getFullYear().toString(),
              },
              explanation:
                "Music recommendations are temporarily unavailable. Please try again later.",
              confidence: 0.1,
            },
          ],
        };
      }

      // Use TMDB API key from configuration
      const tmdbApiKey = TMDB_API_KEY;

      if (!tmdbApiKey) {
        return {
          title: "Popular Movies",
          description: "A selection of popular movies (API fallback)",
          items: [
            {
              id: `movie_${Date.now()}_1`,
              name: "Unable to fetch film recommendations",
              type: "film",
              details: {
                genres: ["Unknown"],
                director: "Please enable TMDB API or OpenRouter API",
                cast: [],
                year: new Date().getFullYear().toString(),
              },
              explanation:
                "Film recommendation service not available. Please configure TMDB or OpenRouter API.",
              confidence: 0.5,
            },
          ],
        };
      }

      // Fetch trending movies from TMDB
      const trendingRes = await fetch(
        `https://api.themoviedb.org/3/trending/movie/week?language=en-US&page=1`,
        {
          method: "GET",
          headers: {
            accept: "application/json",
            Authorization: `Bearer ${tmdbApiKey}`,
          },
        }
      );

      if (!trendingRes.ok) {
        throw new Error(`Cannot connect to TMDB API (status: ${trendingRes.status})`);
      }

      const trendingData = await trendingRes.json();

      // Map the results to our recommendation format
      if (!trendingData.results || !Array.isArray(trendingData.results)) {
        throw new Error("Invalid response from TMDB API");
      }

      const items = trendingData.results.slice(0, 10).map((movie: TmdbTrendingMovie) => ({
        id: `movie_${movie.id}`,
        name: movie.title,
        type: "film",
        details: {
          genres: movie.genre_ids ? movie.genre_ids.map((id: number) => String(id)) : [],
          director: "Unknown", // TMDB trending endpoint doesn't provide director
          cast: [], // TMDB trending endpoint doesn't provide cast
          year: movie.release_date ? movie.release_date.substring(0, 4) : "",
          imageUrl: movie.poster_path
            ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
            : null,
          description: movie.overview,
        },
        explanation: "This is a trending movie on TMDB",
        confidence: 0.8,
      }));

      return {
        title: "Trending Movies",
        description: "Popular movies trending this week",
        items,
      };
    } catch {
      // Return a placeholder with error information
      return {
        title: "Recommendation Error",
        description: "There was an error fetching recommendations",
        items: [
          {
            id: `error_${Date.now()}`,
            name: "Error fetching recommendations",
            type: "film",
            details: {
              genres: ["Error"],
              director: "Error",
              cast: [],
              year: new Date().getFullYear().toString(),
            },
            explanation: "An error occurred while fetching recommendations",
            confidence: 0.1,
          },
        ],
      };
    }
  },

  /**
   * Fetches similar movies for a given movie ID using TMDB API.
   * @param movieId - The ID of the movie to find similar films for
   * @returns Recommendation data with similar movies
   */
  async getSimilarMovies(movieId: string): Promise<RecommendationDataDetails> {
    try {
      // Make sure we have a TMDB API key
      if (!TMDB_API_KEY) {
        return {
          title: "Similar Movies",
          description: "Cannot fetch similar movies - API key missing",
          items: [
            {
              id: `error_${Date.now()}`,
              name: "TMDB API key not configured",
              type: "film",
              details: {
                genres: ["Error"],
                director: "Missing API Key",
                cast: [],
                year: new Date().getFullYear().toString(),
              },
              explanation: "Cannot fetch similar movies because TMDB API key is not configured",
              confidence: 0.1,
            },
          ],
        };
      }

      // Call the TMDB API to get similar movies
      const similarRes = await fetch(`https://api.themoviedb.org/3/movie/${movieId}/similar`, {
        method: "GET",
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${TMDB_API_KEY}`,
        },
      });

      if (!similarRes.ok) {
        // Fallback to trending movies if the similar endpoint fails
        return this.getTMDBRecommendations("film");
      }

      const similarData = await similarRes.json();

      // Map the TMDB response to our format
      const items = similarData.results.slice(0, 10).map((movie: TmdbSimilarMovie) => ({
        id: `movie_${movie.id}`,
        name: movie.title,
        type: "film",
        details: {
          genres: movie.genre_ids ? movie.genre_ids.map((id: number) => String(id)) : [],
          director: "", // TMDB doesn't provide director in this endpoint
          cast: [], // TMDB doesn't provide cast in this endpoint
          year: movie.release_date ? movie.release_date.substring(0, 4) : "",
          imageUrl: movie.poster_path
            ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
            : null,
          description: movie.overview,
          releaseDate: movie.release_date,
          voteAverage: movie.vote_average,
        },
        explanation: `This movie is similar to one you liked`,
        confidence: 0.9,
      }));

      return {
        title: "Similar Movies",
        description: "Movies similar to ones you've liked",
        items,
      };
    } catch {
      // Fallback to trending recommendations if there's an error
      return this.getTMDBRecommendations("film");
    }
  },
};
