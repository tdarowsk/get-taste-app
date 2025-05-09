import { supabaseClient } from "../../db/supabase.client";
import type {
  FilmPreferencesDTO,
  MusicPreferencesDTO,
  UpdateFilmPreferencesCommand,
  UpdateMusicPreferencesCommand,
  UserPreferencesDTO,
} from "../../types";

/**
 * Serwis odpowiedzialny za operacje na preferencjach użytkownika.
 * Obsługuje pobieranie i aktualizację preferencji muzycznych i filmowych.
 */
export class PreferencesService {
  /**
   * Pobiera połączone preferencje użytkownika (muzyczne i filmowe).
   *
   * @param userId - UUID użytkownika
   * @returns Obiekt z preferencjami użytkownika lub pusty obiekt, jeśli preferencje nie istnieją
   * @throws Error w przypadku błędu bazy danych
   */
  public static async getUserPreferences(userId: string): Promise<UserPreferencesDTO> {
    const response: UserPreferencesDTO = {};

    // Pobieranie preferencji muzycznych
    const { data: musicData, error: musicError } = await supabaseClient
      .from("music_preferences")
      .select("genres, artists")
      .eq("user_id", userId)
      .single();

    if (musicError && musicError.code !== "PGRST116") {
      throw new Error(`Błąd podczas pobierania preferencji muzycznych: ${musicError.message}`);
    }

    if (musicData) {
      response.music = {
        genres: musicData.genres || [],
        artists: musicData.artists || [],
      };
    }

    // Pobieranie preferencji filmowych
    const { data: filmData, error: filmError } = await supabaseClient
      .from("film_preferences")
      .select("genres, director, cast, screenwriter")
      .eq("user_id", userId)
      .single();

    if (filmError && filmError.code !== "PGRST116") {
      throw new Error(`Błąd podczas pobierania preferencji filmowych: ${filmError.message}`);
    }

    if (filmData) {
      response.film = {
        genres: filmData.genres || [],
        director: filmData.director,
        cast: filmData.cast || [],
        screenwriter: filmData.screenwriter,
      };
    }

    return response;
  }

  /**
   * Aktualizuje preferencje muzyczne użytkownika.
   *
   * @param userId - UUID użytkownika
   * @param data - Dane do aktualizacji preferencji muzycznych
   * @returns Zaktualizowane preferencje muzyczne
   * @throws Error w przypadku błędu bazy danych
   */
  public static async updateMusicPreferences(
    userId: string,
    data: UpdateMusicPreferencesCommand
  ): Promise<MusicPreferencesDTO> {
    // Sprawdzenie czy rekord już istnieje
    const { data: existingData } = await supabaseClient
      .from("music_preferences")
      .select("id")
      .eq("user_id", userId)
      .single();

    let result;

    if (existingData) {
      // Aktualizacja istniejącego rekordu
      const { data: updatedData, error } = await supabaseClient
        .from("music_preferences")
        .update(data)
        .eq("user_id", userId)
        .select("genres, artists")
        .single();

      if (error) {
        throw new Error(`Błąd podczas aktualizacji preferencji muzycznych: ${error.message}`);
      }

      result = updatedData;
    } else {
      // Tworzenie nowego rekordu
      const { data: newData, error } = await supabaseClient
        .from("music_preferences")
        .insert({ user_id: userId, ...data })
        .select("genres, artists")
        .single();

      if (error) {
        throw new Error(`Błąd podczas tworzenia preferencji muzycznych: ${error.message}`);
      }

      result = newData;
    }

    return {
      genres: result?.genres || [],
      artists: result?.artists || [],
    };
  }

  /**
   * Aktualizuje preferencje filmowe użytkownika.
   *
   * @param userId - UUID użytkownika
   * @param data - Dane do aktualizacji preferencji filmowych
   * @returns Zaktualizowane preferencje filmowe
   * @throws Error w przypadku błędu bazy danych
   */
  public static async updateFilmPreferences(
    userId: string,
    data: UpdateFilmPreferencesCommand
  ): Promise<FilmPreferencesDTO> {
    // Sprawdzenie czy rekord już istnieje
    const { data: existingData } = await supabaseClient
      .from("film_preferences")
      .select("id")
      .eq("user_id", userId)
      .single();

    let result;

    if (existingData) {
      // Aktualizacja istniejącego rekordu
      const { data: updatedData, error } = await supabaseClient
        .from("film_preferences")
        .update(data)
        .eq("user_id", userId)
        .select("genres, director, cast, screenwriter")
        .single();

      if (error) {
        throw new Error(`Błąd podczas aktualizacji preferencji filmowych: ${error.message}`);
      }

      result = updatedData;
    } else {
      // Tworzenie nowego rekordu
      const { data: newData, error } = await supabaseClient
        .from("film_preferences")
        .insert({ user_id: userId, ...data })
        .select("genres, director, cast, screenwriter")
        .single();

      if (error) {
        throw new Error(`Błąd podczas tworzenia preferencji filmowych: ${error.message}`);
      }

      result = newData;
    }

    return {
      genres: result?.genres || [],
      director: result?.director,
      cast: result?.cast || [],
      screenwriter: result?.screenwriter,
    };
  }
}
