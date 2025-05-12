import { supabaseClient } from "../../db/supabase.client";
import { supabaseAdmin } from "../../db/supabase.admin";

/**
 * Serwis do zarządzania preferencjami użytkownika - bez żadnych domyślnych/zahardcodowanych wartości
 */
export class UserPreferencesService {
  /**
   * Pobiera preferencje filmowe użytkownika na podstawie rzeczywistych polubień
   * @param userId ID użytkownika
   * @returns Obiekt z preferencjami filmowymi lub pusty obiekt
   */
  public static async getFilmPreferences(userId: string) {
    try {
      console.log(`Getting film preferences for user ${userId}`);

      // Użyj klienta administratora, jeśli dostępny
      const client = supabaseAdmin || supabaseClient;

      // Pobierz preferencje filmowe z tabeli film_preferences
      const { data: filmPreferences, error: filmError } = await client
        .from("film_preferences")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (filmError && filmError.code !== "PGRST116") {
        console.error("Error fetching film preferences:", filmError);
        throw filmError;
      }

      // Pobierz polubione filmy, aby określić gatunki
      const { data: likedItems, error: likesError } = await client
        .from("item_feedback")
        .select("item_id, genre, feedback_type")
        .eq("user_id", userId)
        .eq("feedback_type", "like");

      if (likesError) {
        console.error("Error fetching liked items:", likesError);
        throw likesError;
      }

      console.log(`Found ${likedItems?.length || 0} liked items for user ${userId}`);

      // Wyodrębnij i przetwórz gatunki z polubionych filmów
      const genreCounts: Record<string, number> = {};
      const likedMovieIds: string[] = [];

      // Zbierz ID polubionych filmów
      likedItems?.forEach((item: any) => {
        if (item.item_id) {
          likedMovieIds.push(item.item_id);
        }

        // Przetwórz gatunki
        if (item.genre) {
          let genres: string[] = [];

          if (typeof item.genre === "string") {
            // Gatunki mogą być oddzielone przecinkami
            genres = item.genre
              .split(/[,;|]/)
              .map((g: any) => g.trim())
              .filter(Boolean);
          }

          // Zliczaj wystąpienia gatunków
          genres.forEach((genre: string) => {
            if (!genre) return;

            // Formatuj nazwę gatunku (kapitalizacja pierwszej litery)
            const formattedGenre = genre.trim().replace(/^\w/, (c: string) => c.toUpperCase());
            genreCounts[formattedGenre] = (genreCounts[formattedGenre] || 0) + 1;
          });
        }
      });

      // Posortuj gatunki według liczby wystąpień (malejąco)
      const sortedGenres = Object.entries(genreCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([genre]) => genre);

      console.log("Sorted genres from feedback:", sortedGenres);

      // Zwróć dane, łącząc istniejące preferencje z danymi z polubionych filmów
      return {
        // Jeśli są zapisane preferencje, użyj ich
        ...(filmPreferences || {}),
        // Zawsze używaj aktualnych gatunków z polubionych filmów
        genres: sortedGenres,
        // Zawsze używaj aktualnej listy polubionych filmów
        liked_movies: likedMovieIds,
      };
    } catch (error) {
      console.error("Error in getFilmPreferences:", error);
      // W przypadku błędu zwróć pusty obiekt zamiast domyślnych wartości
      return {
        genres: [],
        liked_movies: [],
      };
    }
  }

  /**
   * Odświeża preferencje filmowe użytkownika na podstawie polubionych filmów
   * @param userId ID użytkownika
   * @returns true jeśli operacja się powiodła, false w przeciwnym wypadku
   */
  public static async refreshFilmPreferences(userId: string): Promise<boolean> {
    try {
      console.log(`Refreshing film preferences for user ${userId}`);

      // Pobierz aktualne preferencje
      const preferences = await this.getFilmPreferences(userId);

      // Jeśli nie ma gatunków, a nie ma też polubionych filmów, nie ma co zapisywać
      if (
        preferences.genres.length === 0 &&
        (!preferences.liked_movies || preferences.liked_movies.length === 0)
      ) {
        console.log("No genres or liked movies to save");
        return false;
      }

      // Użyj klienta administratora, jeśli dostępny
      const client = supabaseAdmin || supabaseClient;

      // Zapisz preferencje do bazy danych
      const { error } = await client.from("film_preferences").upsert({
        user_id: userId,
        genres: preferences.genres,
        liked_movies: preferences.liked_movies,
        updated_at: new Date().toISOString(),
      });

      if (error) {
        console.error("Error saving film preferences:", error);
        return false;
      }

      console.log(`Successfully saved film preferences for user ${userId}`);
      return true;
    } catch (error) {
      console.error("Error in refreshFilmPreferences:", error);
      return false;
    }
  }

  /**
   * Pobiera metadane gatunków filmowych dla użytkownika
   * @param userId ID użytkownika
   * @returns Tablica metadanych gatunków lub pusta tablica
   */
  public static async getFilmGenresMetadata(userId: string) {
    try {
      console.log(`Getting film genres metadata for user ${userId}`);

      // Pobierz polubione filmy, aby określić gatunki
      const { data: likedItems, error: likesError } = await supabaseClient
        .from("item_feedback")
        .select("item_id, genre, feedback_type")
        .eq("user_id", userId)
        .eq("feedback_type", "like");

      if (likesError) {
        console.error("Error fetching liked items:", likesError);
        return [];
      }

      console.log(`Found ${likedItems?.length || 0} liked items for user ${userId}`);

      // Wyodrębnij i przetwórz gatunki z polubionych filmów
      const genreCounts: Record<string, number> = {};

      // Zliczaj wystąpienia gatunków
      likedItems?.forEach((item: any) => {
        if (item.genre) {
          let genres: string[] = [];

          if (typeof item.genre === "string") {
            // Gatunki mogą być oddzielone przecinkami
            genres = item.genre
              .split(/[,;|]/)
              .map((g: any) => g.trim())
              .filter(Boolean);
          }

          // Zliczaj wystąpienia gatunków
          genres.forEach((genre: string) => {
            if (!genre) return;

            // Formatuj nazwę gatunku (kapitalizacja pierwszej litery)
            const formattedGenre = genre.trim().replace(/^\w/, (c: string) => c.toUpperCase());
            genreCounts[formattedGenre] = (genreCounts[formattedGenre] || 0) + 1;
          });
        }
      });

      // Jeśli nie ma gatunków, zwróć pustą tablicę
      if (Object.keys(genreCounts).length === 0) {
        console.log("No genres found for user");
        return [];
      }

      // Oblicz maksymalną liczbę wystąpień
      const maxCount = Math.max(...Object.values(genreCounts), 1); // Unikaj dzielenia przez zero

      // Utwórz metadane gatunków
      const genresMetadata = Object.entries(genreCounts).map(([name, count]) => {
        // Oblicz znormalizowaną wagę
        const weight = count / maxCount;

        return {
          id: name.toLowerCase().replace(/\s+/g, "-"),
          type: "filmGenre",
          name,
          count,
          weight,
        };
      });

      // Sortuj według wagi (malejąco)
      genresMetadata.sort((a, b) => b.weight - a.weight);

      console.log(`Returning ${genresMetadata.length} film genres metadata items`);
      return genresMetadata;
    } catch (error) {
      console.error("Error in getFilmGenresMetadata:", error);
      return [];
    }
  }
}
