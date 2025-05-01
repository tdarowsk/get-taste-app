import { supabaseClient } from "../../db/supabase.client";
import type { CreateRecommendationsCommand, RecommendationDTO, RecommendationDataDetails } from "../../types";
import type { Database } from "../../db/database.types";
import { TMDB_API_KEY } from "../../env.config";

// Define types for TMDB API responses
interface TmdbMovie {
  id: number;
  title: string;
  overview: string | null;
  poster_path: string | null;
  release_date: string;
  vote_average: number;
  original_language: string;
}

interface TmdbCredit {
  job?: string;
  name: string;
}

interface TmdbCast {
  name: string;
}

interface TmdbMovieDetails extends TmdbMovie {
  credits: {
    crew: TmdbCredit[];
    cast: TmdbCast[];
  };
}

interface TmdbTrendingResponse {
  results: TmdbMovie[];
}

type MusicPreferences = Database["public"]["Tables"]["music_preferences"]["Row"];
type FilmPreferences = Database["public"]["Tables"]["film_preferences"]["Row"];
type RecommendationData = Database["public"]["Tables"]["recommendations"]["Insert"];
type Json = Database["public"]["Tables"]["recommendations"]["Row"]["data"];

/**
 * Serwis odpowiedzialny za generowanie i zarządzanie rekomendacjami.
 */
export const RecommendationService = {
  /**
   * Generuje nowe rekomendacje dla użytkownika.
   *
   * @param userId - ID użytkownika
   * @param command - Parametry generowania rekomendacji
   * @returns Wygenerowane rekomendacje
   */
  async generateRecommendations(userId: string, command: CreateRecommendationsCommand): Promise<RecommendationDTO> {
    try {
      console.log("Generating recommendations for user:", userId);
      console.log("Command:", command);

      // Sprawdzenie, czy istnieją aktualne rekomendacje (tylko jeśli force_refresh jest false)
      if (!command.force_refresh) {
        console.log("Checking for existing recommendations");
        const existingRecommendation = await this.getLatestRecommendation(userId, command.type);
        if (existingRecommendation) {
          console.log("Found existing recommendations:", existingRecommendation);
          return existingRecommendation;
        }
      }

      // Pobierz dane preferencji użytkownika
      console.log("Getting user preferences");
      const preferences = await this.getUserPreferences(userId, command.type);
      console.log("User preferences:", preferences);

      // Generowanie rekomendacji przez Openrouter.ai
      console.log("Calling Openrouter API");
      const generatedData = await this.callOpenrouterAPI(preferences, command.type);
      console.log("Generated data:", generatedData);

      // Zapis rekomendacji do bazy danych
      console.log("Saving recommendations to database");
      const recommendationInsert: RecommendationData = {
        user_id: userId,
        type: command.type,
        data: generatedData as Json,
      };

      const { data, error } = await supabaseClient
        .from("recommendations")
        .insert(recommendationInsert)
        .select()
        .single();

      if (error) {
        console.error("Error saving recommendations to database:", error);
        throw new Error(`Błąd podczas zapisywania rekomendacji: ${error.message}`);
      }

      console.log("Saved recommendations to database:", data);

      // Mapowanie danych z bazy do DTO
      return {
        id: data.id,
        user_id: String(data.user_id),
        type: data.type as "music" | "film",
        data: data.data as RecommendationDataDetails,
        created_at: data.created_at,
      };
    } catch (error) {
      console.error("Error generating recommendations:", error);
      throw error;
    }
  },

  /**
   * Pobiera najnowszą rekomendację danego typu dla użytkownika.
   *
   * @param userId - ID użytkownika
   * @param type - Typ rekomendacji ("music" lub "film")
   * @returns Najnowsza rekomendacja lub null
   */
  async getLatestRecommendation(userId: string, type: "music" | "film"): Promise<RecommendationDTO | null> {
    try {
      console.log("Getting latest recommendation for user:", userId);
      console.log("Type:", type);

      const { data, error } = await supabaseClient
        .from("recommendations")
        .select("*")
        .eq("user_id", userId)
        .eq("type", type)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error("Error getting latest recommendation:", error);
        return null;
      }

      if (!data) {
        console.log("No latest recommendation found");
        return null;
      }

      console.log("Found latest recommendation:", data);

      return {
        id: data.id,
        user_id: String(data.user_id),
        type: data.type as "music" | "film",
        data: data.data as RecommendationDataDetails,
        created_at: data.created_at,
      };
    } catch (error) {
      console.error("Error in getLatestRecommendation:", error);
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
  async getUserPreferences(userId: string, type: "music" | "film"): Promise<MusicPreferences | FilmPreferences> {
    try {
      console.log("Getting user preferences for user:", userId);
      console.log("Type:", type);

      const table = type === "music" ? "music_preferences" : "film_preferences";
      console.log("Table:", table);

      const { data, error } = await supabaseClient.from(table).select("*").eq("user_id", userId).single();

      if (error) {
        console.error("Error getting user preferences:", error);
        throw new Error(`Błąd podczas pobierania preferencji użytkownika: ${error.message}`);
      }

      if (!data) {
        console.log("No preferences found for user");
        // Return default preferences if none exist
        return {
          user_id: userId,
          genres: null,
          ...(type === "music"
            ? { artists: null }
            : { director: null, screenwriter: null, cast: null, liked_movies: null }),
        };
      }

      console.log("Found user preferences:", data);
      return data;
    } catch (error) {
      console.error("Error in getUserPreferences:", error);
      throw error;
    }
  },

  /**
   * Wywołuje API Openrouter.ai w celu wygenerowania rekomendacji.
   *
   * @param preferences - Preferencje użytkownika
   * @param type - Typ rekomendacji ("music" lub "film")
   * @returns Dane wygenerowane przez Openrouter.ai
   */
  async callOpenrouterAPI(
    preferences: MusicPreferences | FilmPreferences,
    type: "music" | "film"
  ): Promise<RecommendationDataDetails> {
    try {
      if (type === "film") {
        // Use the API key from env.config.ts
        const tmdbApiKey = TMDB_API_KEY;

        console.log(`Using TMDB API key: ${tmdbApiKey ? "Available" : "Not available"}`);

        // Always try to fetch from the API, no fallback to mock data
        try {
          console.log("Fetching trending movies from TMDB...");
          // Fetch trending movies for the week
          const trendingRes = await fetch(`https://api.themoviedb.org/3/trending/movie/week?language=en-US&page=1`, {
            method: "GET",
            headers: {
              accept: "application/json",
              Authorization: `Bearer ${tmdbApiKey}`,
            },
          });

          if (!trendingRes.ok) {
            const errorText = await trendingRes.text();
            console.error(`TMDB API error: ${trendingRes.status} ${trendingRes.statusText}`, errorText);
            throw new Error(`TMDB API error: ${trendingRes.status} ${trendingRes.statusText} - ${errorText}`);
          }

          const trendingData = (await trendingRes.json()) as TmdbTrendingResponse;
          console.log("TMDB trending data received, found", trendingData.results?.length, "movies");

          if (!trendingData.results || !Array.isArray(trendingData.results)) {
            console.error("Invalid TMDB response:", trendingData);
            throw new Error("Invalid response from TMDB API");
          }

          const movies = trendingData.results.slice(0, 10);
          console.log("Selected", movies.length, "trending movies from TMDB");

          // Fetch details including credits for each movie
          const items = await Promise.all(
            movies.map(async (movie: TmdbMovie) => {
              try {
                console.log(`Fetching details for movie ${movie.id}...`);
                const detailRes = await fetch(
                  `https://api.themoviedb.org/3/movie/${movie.id}?append_to_response=credits`,
                  {
                    method: "GET",
                    headers: {
                      accept: "application/json",
                      Authorization: `Bearer ${tmdbApiKey}`,
                    },
                  }
                );

                if (!detailRes.ok) {
                  const errorText = await detailRes.text();
                  console.error(
                    `TMDB detail API error for movie ${movie.id}: ${detailRes.status} ${detailRes.statusText}`,
                    errorText
                  );
                  throw new Error(`Failed to fetch details for movie ${movie.id}`);
                }

                const detailData = (await detailRes.json()) as TmdbMovieDetails;
                console.log(`Details received for movie ${movie.id}: ${detailData.title}`);

                const director = detailData.credits?.crew?.find((c: TmdbCredit) => c.job === "Director")?.name || null;
                const writers =
                  detailData.credits?.crew
                    ?.filter((c: TmdbCredit) => ["Screenplay", "Writer"].includes(c.job || ""))
                    .map((c: TmdbCredit) => c.name) || [];
                const screenwriter = writers.length ? writers.join(", ") : null;
                const cast = detailData.credits?.cast?.slice(0, 5).map((c: TmdbCast) => c.name) || [];
                const imageUrl = detailData.poster_path
                  ? `https://image.tmdb.org/t/p/w500${detailData.poster_path}`
                  : null;
                const description = detailData.overview || null;

                return {
                  id: String(detailData.id),
                  name: detailData.title,
                  type,
                  details: {
                    director,
                    screenwriter,
                    cast,
                    imageUrl,
                    description,
                    releaseDate: detailData.release_date,
                    voteAverage: detailData.vote_average,
                    originalLanguage: detailData.original_language,
                  },
                };
              } catch (movieError) {
                console.error(`Error processing movie ${movie.id}:`, movieError);
                // Skip this movie if there was an error
                throw movieError;
              }
            })
          );

          console.log(`Successfully processed ${items.length} movies from TMDB API`);
          return {
            title: "Trending Films from TMDB",
            description: "Popular movies this week from The Movie Database",
            items,
          };
        } catch (tmdbError) {
          console.error("Error fetching from TMDB API:", tmdbError);
          // Don't fallback to mock data - throw the error to indicate API failure
          throw new Error(`Failed to fetch data from TMDB API: ${tmdbError}`);
        }
      }

      if (type === "music") {
        // Return mock music recommendations for now
        return {
          title: "Music Recommendations",
          description: "Sample music recommendations",
          items: [
            {
              id: "mock-music-1",
              name: "Mock Artist 1",
              type: "artist",
              details: {
                imageUrl: "https://via.placeholder.com/300x300?text=Artist+1",
              },
            },
            {
              id: "mock-music-2",
              name: "Mock Track 1",
              type: "track",
              details: {
                artist: "Mock Artist 1",
                imageUrl: "https://via.placeholder.com/300x300?text=Track+1",
              },
            },
          ],
        };
      }

      return {
        title: "Recommendations",
        description: "Default recommendations",
        items: [],
      };
    } catch (error) {
      console.error("Error in callOpenrouterAPI:", error);
      // Propagate the error instead of returning fallback data
      throw error;
    }
  },

  /**
   * Pobiera popularne rekomendacje dla nowych użytkowników bez preferencji.
   * Może wykorzystywać zewnętrzne API trendów lub bazę danych najpopularniejszych pozycji.
   *
   * @param type - Typ rekomendacji ("music" lub "film")
   * @returns Rekomendacje popularne w danej kategorii
   */
  async getPopularRecommendations(type: "music" | "film"): Promise<Json> {
    try {
      // TODO: W rzeczywistej implementacji możemy:
      // 1. Skorzystać z API trendów Spotify dla muzyki
      // 2. Skorzystać z API TMDB dla filmów
      // 3. Pobierać dane z naszej bazy najczęściej lubianych pozycji
      // 4. Połączyć kilka źródeł danych

      if (type === "music") {
        return {
          popular: [
            {
              title: "Top Charting Artists",
              description: "The most popular artists loved by millions of listeners worldwide.",
              items: [
                { id: "artist-1", name: "Drake", type: "artist", genres: ["hip hop", "rap"] },
                { id: "artist-2", name: "Beyoncé", type: "artist", genres: ["r&b", "pop"] },
              ],
            },
            {
              title: "Trending Songs Right Now",
              description: "Catch up with what everyone is listening to this week.",
              items: [
                { id: "song-1", name: "Blinding Lights", type: "song", artist: "The Weeknd" },
                { id: "song-2", name: "Bad Guy", type: "song", artist: "Billie Eilish" },
              ],
            },
          ],
        };
      } else {
        return {
          popular: [
            {
              title: "Highest Grossing Films of All Time",
              description: "Blockbusters loved by audiences worldwide that broke box office records.",
              items: [
                { id: "movie-1", name: "Avengers: Endgame", type: "movie", year: 2019 },
                { id: "movie-2", name: "Avatar", type: "movie", year: 2009 },
              ],
            },
            {
              title: "Trending Movies Everyone's Talking About",
              description: "The most talked about films that are making waves in theaters and streaming.",
              items: [
                { id: "movie-3", name: "Dune", type: "movie", year: 2021 },
                { id: "movie-4", name: "The Batman", type: "movie", year: 2022 },
              ],
            },
          ],
        };
      }
    } catch (error) {
      console.error(`Błąd podczas pobierania popularnych rekomendacji: ${error}`);
      throw new Error("Nie udało się pobrać popularnych rekomendacji");
    }
  },

  /**
   * Fetches similar movies for a given movie ID from TMDB.
   */
  async getSimilarMovies(movieId: string): Promise<RecommendationDataDetails> {
    console.log(`Fetching similar movies for movie ID: ${movieId}`);
    const tmdbApiKey = TMDB_API_KEY;
    console.log(`Using TMDB API key for similar movies: ${tmdbApiKey ? "Available" : "Not available"}`);
    const url = `https://api.themoviedb.org/3/movie/${movieId}/similar?language=en-US&page=1`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${tmdbApiKey}`,
      },
    });
    if (!response.ok) {
      throw new Error(`TMDB similar movies request failed: ${response.statusText}`);
    }
    const data = await response.json();
    // Map TMDB results to RecommendationItem format
    const items = (data.results || []).map((movie: TmdbMovie) => ({
      id: movie.id.toString(),
      name: movie.title,
      type: "film",
      details: {
        imageUrl: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : undefined,
        description: movie.overview,
      },
    }));
    return {
      title: `Similar Movies to ${movieId}`,
      description: "Movies similar to your liked title",
      items,
    };
  },
};
