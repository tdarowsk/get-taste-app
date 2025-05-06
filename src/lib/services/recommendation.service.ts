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

// Add type definitions for TMDB API responses
interface TmdbCrewMember {
  id: number;
  name: string;
  job: string;
}

interface TmdbCastMember {
  id: number;
  name: string;
  character: string;
}

interface TmdbGenre {
  id: number;
  name: string;
}

interface TmdbMovieDetails {
  id: number;
  title: string;
  genres?: TmdbGenre[];
  credits?: {
    crew?: TmdbCrewMember[];
    cast?: TmdbCastMember[];
  };
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
        console.error("TMDB API key not configured");
        return this.getFallbackMovieRecommendations("Popular Movies (Fallback)", "API key missing");
      }

      // Fetch trending movies from TMDB - using discover to get more data
      console.log("Fetching movie recommendations from TMDB API");
      const trendingRes = await fetch(
        `https://api.themoviedb.org/3/discover/movie?include_adult=false&include_video=false&page=1&sort_by=popularity.desc`,
        {
          method: "GET",
          headers: {
            accept: "application/json",
            Authorization: `Bearer ${tmdbApiKey}`,
          },
        }
      );

      if (!trendingRes.ok) {
        console.error(`Cannot connect to TMDB API (status: ${trendingRes.status})`);
        return this.getFallbackMovieRecommendations(
          "Popular Movies (Fallback)",
          `TMDB API error: ${trendingRes.status}`
        );
      }

      const trendingData = await trendingRes.json();

      // Map the results to our recommendation format
      if (!trendingData.results || !Array.isArray(trendingData.results)) {
        console.error("Invalid response from TMDB API", trendingData);
        return this.getFallbackMovieRecommendations(
          "Popular Movies (Fallback)",
          "Invalid TMDB response"
        );
      }

      console.log(
        `[getTMDBRecommendations] Fetched ${trendingData.results.length} movies from TMDB`
      );

      // Ensure all items have complete information
      const items = await Promise.all(
        trendingData.results.slice(0, 10).map(async (movie: TmdbTrendingMovie) => {
          console.log(`[getTMDBRecommendations] Processing movie ${movie.id}: ${movie.title}`);

          // Fetch additional movie details to get director and cast
          let director = "Unknown Director";
          let cast: string[] = ["Unknown Cast"];
          let genres: string[] = [];

          try {
            console.log(`[getTMDBRecommendations] Fetching details for movie ${movie.id}`);
            const movieDetailsRes = await fetch(
              `https://api.themoviedb.org/3/movie/${movie.id}?append_to_response=credits`,
              {
                method: "GET",
                headers: {
                  accept: "application/json",
                  Authorization: `Bearer ${tmdbApiKey}`,
                },
              }
            );

            if (movieDetailsRes.ok) {
              const movieDetails = await movieDetailsRes.json();
              console.log(
                `[getTMDBRecommendations] Got details for movie ${movie.id}, has credits: ${!!movieDetails.credits}`
              );

              // Extract director
              const directors = movieDetails.credits?.crew?.filter(
                (person: TmdbCrewMember) => person.job === "Director"
              );
              if (directors && directors.length > 0) {
                director = directors[0].name || "Unknown Director";
                console.log(
                  `[getTMDBRecommendations] Found director for movie ${movie.id}: ${director}`
                );
              } else {
                console.log(`[getTMDBRecommendations] No director found for movie ${movie.id}`);
              }

              // Extract cast
              if (movieDetails.credits?.cast && movieDetails.credits.cast.length > 0) {
                cast = movieDetails.credits.cast
                  .slice(0, 5)
                  .map((actor: TmdbCastMember) => actor.name || "Unknown Actor")
                  .filter((name: string) => name !== "Unknown Actor");

                console.log(
                  `[getTMDBRecommendations] Found ${cast.length} cast members for movie ${movie.id}`
                );

                // Ensure we have at least one cast member
                if (cast.length === 0) {
                  cast = ["Unknown Cast"];
                  console.log(
                    `[getTMDBRecommendations] No valid cast members found for movie ${movie.id}, using default`
                  );
                }
              } else {
                console.log(`[getTMDBRecommendations] No cast information for movie ${movie.id}`);
              }

              // Extract genres
              if (movieDetails.genres && movieDetails.genres.length > 0) {
                genres = movieDetails.genres.map((genre: TmdbGenre) => genre.name);
                console.log(
                  `[getTMDBRecommendations] Found genres for movie ${movie.id}: ${genres.join(", ")}`
                );
              } else if (movie.genre_ids && movie.genre_ids.length > 0) {
                genres = movie.genre_ids.map((id) => String(id));
                console.log(
                  `[getTMDBRecommendations] Using numeric genre IDs for movie ${movie.id}: ${genres.join(", ")}`
                );
              } else {
                console.log(`[getTMDBRecommendations] No genres found for movie ${movie.id}`);
              }
            } else {
              console.warn(
                `[getTMDBRecommendations] Failed to fetch details for movie ${movie.id}: ${movieDetailsRes.status}`
              );
            }
          } catch (error) {
            console.error(
              `[getTMDBRecommendations] Error fetching details for movie ${movie.id}:`,
              error
            );
          }

          // Ensure we have genres
          if (genres.length === 0) {
            genres = ["Drama", "Action"];
            console.log(`[getTMDBRecommendations] Using fallback genres for movie ${movie.id}`);
          }

          // Ensure we have a valid title
          const title = movie.title || "Unknown Title";

          // Ensure we have a valid description
          const description = movie.overview || "No description available";

          // Calculate release year with fallback
          const releaseYear = movie.release_date
            ? movie.release_date.substring(0, 4)
            : new Date().getFullYear().toString();

          // Ensure we have an image URL with fallback
          const imageUrl = movie.poster_path
            ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
            : "https://placehold.it/500x750?text=No+Image+Available";

          const movieData = {
            id: `movie_${movie.id}`,
            name: title,
            type: "film" as const,
            details: {
              genres: genres,
              director: director,
              cast: cast,
              year: releaseYear,
              imageUrl: imageUrl,
              description: description,
              releaseDate: movie.release_date || "Unknown release date",
              voteAverage: movie.vote_average || 0,
            },
            explanation: "This is a trending movie on TMDB",
            confidence: 0.8,
          };

          console.log(
            `[getTMDBRecommendations] Finished processing movie ${movie.id} with data:`,
            JSON.stringify({
              id: movieData.id,
              name: movieData.name,
              director: movieData.details.director,
              cast: movieData.details.cast.length > 0 ? movieData.details.cast[0] + "..." : "none",
              genres: movieData.details.genres.join(", "),
              hasImage: !!movie.poster_path,
            })
          );

          return movieData;
        })
      );

      // Make sure we have at least a few items - if not, add fallbacks
      const finalItems =
        items.length >= 3
          ? items
          : [
              ...items,
              ...this.getFallbackMovieRecommendations(
                "Popular Movies (Fallback)",
                "Not enough recommendations"
              ).items.slice(0, 5 - items.length),
            ];

      console.log(`[getTMDBRecommendations] Processed ${finalItems.length} movies successfully`);

      return {
        title: "Trending Movies",
        description: "Popular movies trending this week",
        items: finalItems,
      };
    } catch (error) {
      // Log the error for debugging
      console.error("[getTMDBRecommendations] Error:", error);

      // Return a placeholder with generic movies
      return this.getFallbackMovieRecommendations(
        "Popular Movies",
        "Error fetching recommendations"
      );
    }
  },

  /**
   * Provides fallback movie recommendations when API calls fail
   */
  getFallbackMovieRecommendations(title: string, reason: string): RecommendationDataDetails {
    console.log(`Using fallback movie recommendations: ${reason}`);

    return {
      title: title,
      description: `${title} (fallback recommendations)`,
      items: [
        {
          id: `movie_popular_1`,
          name: "The Shawshank Redemption",
          type: "film",
          details: {
            genres: ["Drama"],
            director: "Frank Darabont",
            cast: ["Tim Robbins", "Morgan Freeman"],
            year: "1994",
            imageUrl: "https://placehold.it/500x750?text=Shawshank+Redemption",
            description:
              "Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.",
            releaseDate: "1994-09-23",
            voteAverage: 8.7,
          },
          explanation: "Classic highly-rated drama",
          confidence: 0.9,
        },
        {
          id: `movie_popular_2`,
          name: "The Godfather",
          type: "film",
          details: {
            genres: ["Crime", "Drama"],
            director: "Francis Ford Coppola",
            cast: ["Marlon Brando", "Al Pacino"],
            year: "1972",
            imageUrl: "https://placehold.it/500x750?text=The+Godfather",
            description:
              "The aging patriarch of an organized crime dynasty transfers control of his clandestine empire to his reluctant son.",
            releaseDate: "1972-03-24",
            voteAverage: 8.7,
          },
          explanation: "Classic crime drama",
          confidence: 0.9,
        },
        {
          id: `movie_popular_3`,
          name: "The Dark Knight",
          type: "film",
          details: {
            genres: ["Action", "Crime", "Drama"],
            director: "Christopher Nolan",
            cast: ["Christian Bale", "Heath Ledger"],
            year: "2008",
            imageUrl: "https://placehold.it/500x750?text=Dark+Knight",
            description:
              "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.",
            releaseDate: "2008-07-18",
            voteAverage: 9.0,
          },
          explanation: "Popular superhero movie",
          confidence: 0.9,
        },
      ],
    };
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
                imageUrl: "https://placehold.it/500x750?text=API+Key+Missing",
                description: "Cannot fetch similar movies because TMDB API key is not configured",
              },
              explanation: "Cannot fetch similar movies because TMDB API key is not configured",
              confidence: 0.1,
            },
          ],
        };
      }

      // Extract numeric ID from string if it contains a prefix
      const numericId = movieId.replace(/^movie_/, "");

      console.log(`[getSimilarMovies] Fetching similar movies for ${numericId}`);

      // Call the TMDB API to get similar movies
      const similarRes = await fetch(`https://api.themoviedb.org/3/movie/${numericId}/similar`, {
        method: "GET",
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${TMDB_API_KEY}`,
        },
      });

      if (!similarRes.ok) {
        console.error(`[getSimilarMovies] API error: ${similarRes.status}`);
        // Fallback to trending movies if the similar endpoint fails
        return this.getTMDBRecommendations("film");
      }

      const similarData = await similarRes.json();

      if (!similarData.results || similarData.results.length === 0) {
        console.log("[getSimilarMovies] No similar movies found, falling back to trending");
        return this.getTMDBRecommendations("film");
      }

      console.log(`[getSimilarMovies] Found ${similarData.results.length} similar movies`);

      // Process each movie to ensure we have complete details
      const items = await Promise.all(
        similarData.results.slice(0, 10).map(async (movie: TmdbSimilarMovie) => {
          // Fetch additional movie details to get director and cast
          let director = "Unknown Director";
          let cast: string[] = ["Unknown Cast"];
          let genres: string[] = [];

          try {
            const movieDetailsRes = await fetch(
              `https://api.themoviedb.org/3/movie/${movie.id}?append_to_response=credits`,
              {
                method: "GET",
                headers: {
                  accept: "application/json",
                  Authorization: `Bearer ${TMDB_API_KEY}`,
                },
              }
            );

            if (movieDetailsRes.ok) {
              const movieDetails = await movieDetailsRes.json();

              // Extract director
              const directors = movieDetails.credits?.crew?.filter(
                (person: TmdbCrewMember) => person.job === "Director"
              );
              if (directors && directors.length > 0) {
                director = directors[0].name || "Unknown Director";
              }

              // Extract cast
              if (movieDetails.credits?.cast && movieDetails.credits.cast.length > 0) {
                cast = movieDetails.credits.cast
                  .slice(0, 5)
                  .map((actor: TmdbCastMember) => actor.name || "Unknown Actor")
                  .filter((name: string) => name !== "Unknown Actor");

                // Ensure we have at least one cast member
                if (cast.length === 0) {
                  cast = ["Unknown Cast"];
                }
              }

              // Extract genres
              if (movieDetails.genres && movieDetails.genres.length > 0) {
                genres = movieDetails.genres.map((genre: TmdbGenre) => genre.name);
              } else if (movie.genre_ids && movie.genre_ids.length > 0) {
                genres = movie.genre_ids.map((id: number) => String(id));
              }
            }
          } catch (error) {
            console.error(
              `[getSimilarMovies] Error fetching details for movie ${movie.id}:`,
              error
            );
          }

          // Ensure we have genres
          if (genres.length === 0) {
            genres = ["Drama", "Action"];
          }

          // Ensure we have valid title
          const title = movie.title || "Unknown Title";

          // Ensure we have a description
          const description = movie.overview || "No description available";

          // Ensure we have a release year
          const releaseYear = movie.release_date
            ? movie.release_date.substring(0, 4)
            : new Date().getFullYear().toString();

          // Ensure we have an image URL
          const imageUrl = movie.poster_path
            ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
            : "https://placehold.it/500x750?text=No+Image+Available";

          return {
            id: `movie_${movie.id}`,
            name: title,
            type: "film",
            details: {
              genres: genres,
              director: director,
              cast: cast,
              year: releaseYear,
              imageUrl: imageUrl,
              description: description,
              releaseDate: movie.release_date || "Unknown release date",
              voteAverage: movie.vote_average || 0,
            },
            explanation: `This movie is similar to one you liked`,
            confidence: 0.9,
          };
        })
      );

      // Make sure we have at least a few items
      if (items.length < 3) {
        console.log("[getSimilarMovies] Not enough movies, adding fallbacks");
        const fallbacks = (await this.getTMDBRecommendations("film")).items;
        items.push(...fallbacks.slice(0, 5 - items.length));
      }

      return {
        title: "Similar Movies",
        description: "Movies similar to ones you've liked",
        items,
      };
    } catch (error) {
      console.error("[getSimilarMovies] Error:", error);
      // Fallback to trending recommendations if there's an error
      return this.getTMDBRecommendations("film");
    }
  },
};
