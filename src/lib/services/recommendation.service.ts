import { supabaseClient } from "../../db/supabase.client";
import type { CreateRecommendationsCommand, RecommendationDTO, RecommendationDataDetails } from "../../types";
import type { Database } from "../../db/database.types";

// Define types for TMDB API responses
interface TmdbTrendingResponse {
  results: { id: number }[];
}
interface TmdbMovieDetail {
  id: number;
  title: string;
  credits: {
    crew: { job: string; name: string }[];
    cast: { name: string }[];
  };
  poster_path: string | null;
  overview: string | null;
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
      // Sprawdzenie, czy istnieją aktualne rekomendacje (tylko jeśli force_refresh jest false)
      if (!command.force_refresh) {
        const existingRecommendation = await this.getLatestRecommendation(userId, command.type);
        if (existingRecommendation) {
          return existingRecommendation;
        }
      }

      // Pobierz dane preferencji użytkownika
      const preferences = await this.getUserPreferences(userId, command.type);

      // Generowanie rekomendacji przez Openrouter.ai
      const generatedData = await this.callOpenrouterAPI(preferences, command.type);

      // Zapis rekomendacji do bazy danych
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
        throw new Error(`Błąd podczas zapisywania rekomendacji: ${error.message}`);
      }

      // Mapowanie danych z bazy do DTO
      return {
        id: data.id,
        user_id: Number(data.user_id), // Konwersja string ID na number zgodnie z DTO
        type: data.type as "music" | "film",
        data: data.data as RecommendationDataDetails,
        created_at: data.created_at,
      };
    } catch (error) {
      console.error(`Błąd podczas generowania rekomendacji: ${error}`);
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
    const { data, error } = await supabaseClient
      .from("recommendations")
      .select("*")
      .eq("user_id", userId)
      .eq("type", type)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      user_id: Number(userId),
      type: data.type as "music" | "film",
      data: data.data as RecommendationDataDetails,
      created_at: data.created_at,
    };
  },

  /**
   * Pobiera preferencje użytkownika odpowiednie dla danego typu rekomendacji.
   *
   * @param userId - ID użytkownika
   * @param type - Typ rekomendacji ("music" lub "film")
   * @returns Preferencje użytkownika
   */
  async getUserPreferences(userId: string, type: "music" | "film"): Promise<MusicPreferences | FilmPreferences> {
    const table = type === "music" ? "music_preferences" : "film_preferences";
    const { data, error } = await supabaseClient.from(table).select("*").eq("user_id", userId).single();

    if (error) {
      throw new Error(`Błąd podczas pobierania preferencji użytkownika: ${error.message}`);
    }

    return data;
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
        const tmdbApiKey = import.meta.env.TMDB_API_KEY;
        if (!tmdbApiKey) {
          throw new Error("TMDB_API_KEY is not set in environment variables");
        }
        // Fetch trending movies for the week
        const trendingRes = await fetch(`https://api.themoviedb.org/3/trending/movie/week?api_key=${tmdbApiKey}`);
        if (!trendingRes.ok) {
          throw new Error(`TMDB API error: ${trendingRes.statusText}`);
        }
        const trendingData = (await trendingRes.json()) as TmdbTrendingResponse;
        const movies = trendingData.results.slice(0, 10);

        // Fetch details including credits for each movie
        const items = await Promise.all(
          movies.map(async (movie) => {
            const detailRes = await fetch(
              `https://api.themoviedb.org/3/movie/${movie.id}?api_key=${tmdbApiKey}&append_to_response=credits`
            );
            if (!detailRes.ok) {
              throw new Error(`TMDB detail API error for movie ${movie.id}: ${detailRes.statusText}`);
            }
            const detailData = (await detailRes.json()) as TmdbMovieDetail;
            const director = detailData.credits.crew.find((c) => c.job === "Director")?.name || null;
            const writers = detailData.credits.crew
              .filter((c) => ["Screenplay", "Writer"].includes(c.job))
              .map((c) => c.name);
            const screenwriter = writers.length ? writers.join(", ") : null;
            const cast = detailData.credits.cast.slice(0, 5).map((c) => c.name);
            const imageUrl = detailData.poster_path ? `https://image.tmdb.org/t/p/w500${detailData.poster_path}` : null;
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
              },
            };
          })
        );

        return {
          title: "Trending Films",
          description: "Popular movies this week",
          items,
        };
      }

      if (type === "music") {
        // Stub for music - implement external API later
        return {
          title: "Music Recommendations",
          description: "Sample music recommendations",
          items: [],
        };
      }

      return { items: [] };
    } catch (error) {
      console.error(`Błąd podczas komunikacji z TMDB/API: ${error}`);
      throw new Error("Nie udało się wygenerować rekomendacji");
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
};
