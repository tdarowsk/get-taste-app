import { supabaseClient } from "../../db/supabase.client";
import type { UpdateUserCommand, UserProfileDTO } from "../../types";

/**
 * Serwis odpowiedzialny za operacje na profilu użytkownika.
 * Obsługuje pobieranie i aktualizację danych użytkownika.
 */
export class UserService {
  /**
   * Pobiera profil użytkownika na podstawie ID.
   *
   * @param userId - UUID użytkownika
   * @returns Obiekt z danymi profilu użytkownika lub null, jeśli użytkownik nie istnieje
   * @throws Error w przypadku błędu bazy danych
   */
  public static async getUserProfile(userId: string): Promise<UserProfileDTO | null> {
    const { data, error } = await supabaseClient
      .from("users")
      .select("id, email, nick, created_at, updated_at")
      .eq("id", userId)
      .single();

    if (error) {
      // Jeśli błąd to "No rows found", oznacza to, że użytkownik nie istnieje
      if (error.code === "PGRST116") {
        return null;
      }
      throw new Error(`Błąd podczas pobierania danych użytkownika: ${error.message}`);
    }

    if (!data) return null;

    // Transformacja ID z string na number zgodnie z DTO
    return {
      id: parseInt(data.id as string, 10), // Konwersja z UUID na number dla API
      email: data.email,
      nick: data.nick,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  }

  /**
   * Aktualizuje profil użytkownika.
   *
   * @param userId - UUID użytkownika
   * @param data - Dane do aktualizacji
   * @returns Zaktualizowany obiekt profilu użytkownika lub null, jeśli użytkownik nie istnieje
   * @throws Error w przypadku błędu bazy danych lub konfliktu unikalności
   */
  public static async updateUserProfile(
    userId: string,
    data: UpdateUserCommand
  ): Promise<UserProfileDTO | null> {
    // Sprawdzenie czy użytkownik istnieje
    const userExists = await this.getUserProfile(userId);
    if (!userExists) return null;

    // Aktualizacja danych użytkownika
    const { data: updatedData, error } = await supabaseClient
      .from("users")
      .update(data)
      .eq("id", userId)
      .select("id, email, nick, created_at, updated_at")
      .single();

    if (error) {
      // Sprawdzanie czy błąd dotyczy duplikatu nicka
      if (error.code === "23505") {
        // unique_violation
        throw new Error("Ten nick jest już zajęty przez innego użytkownika");
      }
      throw new Error(`Błąd podczas aktualizacji danych użytkownika: ${error.message}`);
    }

    if (!updatedData) return null;

    // Transformacja ID z string na number zgodnie z DTO
    return {
      id: parseInt(updatedData.id as string, 10), // Konwersja z UUID na number dla API
      email: updatedData.email,
      nick: updatedData.nick,
      created_at: updatedData.created_at,
      updated_at: updatedData.updated_at,
    };
  }
}
