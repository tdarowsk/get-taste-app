import { supabaseClient } from "../../db/supabase.client";
import type { CreateRecommendationsCommand, RecommendationDTO } from "../../types";
import type { Database } from "../../db/database.types";

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
        data: data.data,
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
      data: data.data,
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
  async callOpenrouterAPI(preferences: MusicPreferences | FilmPreferences, type: "music" | "film"): Promise<Json> {
    try {
      // TODO: Implementacja rzeczywistego wywołania Openrouter.ai
      // W tej wersji zwracamy przykładowe dane

      if (type === "music") {
        return {
          recommendations: [
            { title: "Przykładowy album 1", artist: "Artysta 1", genre: "Rock" },
            { title: "Przykładowy album 2", artist: "Artysta 2", genre: "Pop" },
            { title: "Przykładowy album 3", artist: "Artysta 3", genre: "Jazz" },
          ],
        };
      } else {
        return {
          recommendations: [
            { title: "Przykładowy film 1", director: "Reżyser 1", genre: "Dramat" },
            { title: "Przykładowy film 2", director: "Reżyser 2", genre: "Komedia" },
            { title: "Przykładowy film 3", director: "Reżyser 3", genre: "Akcja" },
          ],
        };
      }
    } catch (error) {
      console.error(`Błąd podczas komunikacji z Openrouter.ai: ${error}`);
      throw new Error("Nie udało się wygenerować rekomendacji");
    }
  },
};
