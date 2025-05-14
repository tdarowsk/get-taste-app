import type {
  FilmPreferencesDTO,
  MusicPreferencesDTO,
  UpdateFilmPreferencesCommand,
  UpdateMusicPreferencesCommand,
  UserPreferencesDTO,
} from "../../types";
import { createClient } from "@supabase/supabase-js";

// Create a factory function to get a Supabase client that works both client and server side
const getSupabaseClient = () => {
  return createClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY
  );
};

/**
 * Serwis odpowiedzialny za operacje na preferencjach użytkownika.
 * Obsługuje pobieranie i aktualizację preferencji muzycznych i filmowych.
 */

/**
 * Pobiera połączone preferencje użytkownika (muzyczne i filmowe).
 *
 * @param userId - UUID użytkownika
 * @returns Obiekt z preferencjami użytkownika lub pusty obiekt, jeśli preferencje nie istnieją
 * @throws Error w przypadku błędu bazy danych
 */
export async function getUserPreferences(userId: string): Promise<UserPreferencesDTO> {
  const response: UserPreferencesDTO = {};

  // Pobieranie preferencji muzycznych
  const { data: musicData, error: musicError } = await getSupabaseClient()
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
  const { data: filmData, error: filmError } = await getSupabaseClient()
    .from("film_preferences")
    .select("genres, director, cast, screenwriter, liked_movies")
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
      liked_movies: filmData.liked_movies || [],
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
export async function updateMusicPreferences(
  userId: string,
  data: UpdateMusicPreferencesCommand
): Promise<MusicPreferencesDTO> {
  // Sprawdzenie czy rekord już istnieje
  const { data: existingData } = await getSupabaseClient()
    .from("music_preferences")
    .select("id")
    .eq("user_id", userId)
    .single();

  let result;

  if (existingData) {
    // Aktualizacja istniejącego rekordu
    const { data: updatedData, error } = await getSupabaseClient()
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
    const { data: newData, error } = await getSupabaseClient()
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
export async function updateFilmPreferences(
  userId: string,
  data: UpdateFilmPreferencesCommand
): Promise<FilmPreferencesDTO> {
  // Sprawdzenie czy rekord już istnieje
  const { data: existingData } = await getSupabaseClient()
    .from("film_preferences")
    .select("id")
    .eq("user_id", userId)
    .single();

  let result;

  if (existingData) {
    // Aktualizacja istniejącego rekordu
    const { data: updatedData, error } = await getSupabaseClient()
      .from("film_preferences")
      .update(data)
      .eq("user_id", userId)
      .select("genres, director, cast, screenwriter, liked_movies")
      .single();

    if (error) {
      throw new Error(`Błąd podczas aktualizacji preferencji filmowych: ${error.message}`);
    }

    result = updatedData;
  } else {
    // Tworzenie nowego rekordu
    const { data: newData, error } = await getSupabaseClient()
      .from("film_preferences")
      .insert({ user_id: userId, ...data })
      .select("genres, director, cast, screenwriter, liked_movies")
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
    liked_movies: result?.liked_movies || [],
  };
}
