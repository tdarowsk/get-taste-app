import { supabaseClient } from "../../db/supabase.client";
import { supabaseAdmin } from "../../db/supabase.admin";
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
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error fetching user:", error);
      return null;
    }

    if (!data) return null;

    // Transformacja ID z UUID na string zgodnie z DTO
    return {
      id: data.id,
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

    return {
      id: updatedData.id,
      email: updatedData.email,
      nick: updatedData.nick,
      created_at: updatedData.created_at,
      updated_at: updatedData.updated_at,
    };
  }

  /**
   * Get a user by ID from the database
   */
  public static async getUserById(userId: string) {
    const { data, error } = await supabaseClient
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error fetching user:", error);
      return null;
    }

    return data;
  }

  /**
   * Update a user in the database
   */
  public static async updateUser(userId: string, userData: Record<string, unknown>) {
    const { data, error } = await supabaseClient.from("users").update(userData).eq("id", userId);

    if (error) {
      console.error("Error updating user:", error);
      throw new Error(`Failed to update user: ${error.message}`);
    }

    return data;
  }

  /**
   * Create a new user in the database
   */
  public static async createUser(userData: {
    email: string;
    nick: string;
    password_hash: string;
    created_at?: string;
    updated_at?: string;
    deleted_at?: string | null;
    id?: string;
  }) {
    const { data, error } = await supabaseClient.from("users").insert([userData]);

    if (error) {
      console.error("Error creating user:", error);
      throw new Error(`Failed to create user: ${error.message}`);
    }

    return data;
  }

  /**
   * Get the user's preferences
   */
  public static async getUserPreferences(userId: string) {
    // Używamy klienta administratora aby ominąć ograniczenia RLS
    const adminClient = supabaseAdmin || supabaseClient;
    console.log("Admin client available for preferences:", !!supabaseAdmin);

    // Get film preferences from film_preferences table
    const { data: filmPreferences, error: filmError } = await adminClient
      .from("film_preferences")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (filmError && filmError.code !== "PGRST116") {
      console.error("Error fetching film preferences:", filmError);
    }

    // Get liked movies from item_feedback to determine genre preferences
    const { data: movieFeedback, error: feedbackError } = await supabaseClient
      .from("item_feedback")
      .select("item_id, genre, feedback_type, cast, artist")
      .eq("user_id", userId)
      .eq("feedback_type", "like");

    if (feedbackError) {
      console.error("Error fetching movie feedback:", feedbackError);
    }

    // Log raw feedback data for debugging
    console.log("Raw movie feedback data count:", movieFeedback?.length || 0);
    console.log("Raw movie feedback examples:", JSON.stringify(movieFeedback?.slice(0, 5)));

    // Extract genres from movie feedback and format them
    let genresFromFeedback: string[] = [];
    let likedMovieIds: string[] = [];
    if (movieFeedback && movieFeedback.length > 0) {
      console.log(`Found ${movieFeedback.length} liked movies for user ${userId}`);

      // Collect movie IDs for reference
      likedMovieIds = movieFeedback
        .filter((item) => item.item_id)
        .map((item) => item.item_id)
        .filter(Boolean);

      // Collect all genres from liked movies
      const allGenres = movieFeedback
        .filter((item) => item.genre || item.cast || item.artist)
        .flatMap((item) => {
          // The genre might be stored as a comma-separated string
          if (typeof item.genre === "string") {
            const genres = item.genre
              .split(",")
              .map((g: string) => g.trim())
              .filter(Boolean);
            console.log(`Movie ${item.item_id} has genres: ${genres.join(", ")}`);
            return genres;
          }
          // It might also be an array
          if (Array.isArray(item.genre)) {
            return item.genre.filter(Boolean);
          }
          return [];
        });

      console.log(`Extracted ${allGenres.length} genres from feedback`);

      // Count genre occurrences to find the most liked genres
      const genreCounts: Record<string, number> = {};
      allGenres.forEach((genre) => {
        // Skip empty genres
        if (!genre) return;

        // Format genre string properly (capitalize first letter, trim whitespace)
        const formattedGenre = genre.trim().replace(/^\w/, (c: string) => c.toUpperCase());
        genreCounts[formattedGenre] = (genreCounts[formattedGenre] || 0) + 1;
      });

      console.log("Genre counts:", JSON.stringify(genreCounts));

      // Convert to array of genres, sort by count, and take top genres
      genresFromFeedback = Object.entries(genreCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([genre]) => genre);

      console.log(`Top genres from feedback: ${genresFromFeedback.join(", ")}`);
    }

    // If no genres were found in feedback but we have liked movies,
    // use fallback genres based on the number of liked movies
    if (genresFromFeedback.length === 0 && movieFeedback && movieFeedback.length > 0) {
      // Define fallback genres based on how many movies the user has liked
      const likedMoviesCount = movieFeedback.length;

      // Always use fallback genres if we have liked movies but no genres
      genresFromFeedback = ["Action", "Drama", "Thriller", "Comedy"];

      // Add more genres if user has liked many movies
      if (likedMoviesCount > 10) {
        genresFromFeedback.push("Adventure", "Sci-Fi");
      }
      if (likedMoviesCount > 20) {
        genresFromFeedback.push("Horror", "Romance");
      }
      console.log(
        `Using fallback genres since no specific genres were detected from ${likedMoviesCount} liked movies`
      );
    }

    // Merge preferences from direct settings and feedback data
    // Prioritize explicit preferences but include genres from feedback
    let mergedFilmGenres = filmPreferences?.genres || [];

    // Add genres from feedback that aren't already in explicit preferences
    genresFromFeedback.forEach((genre) => {
      if (!mergedFilmGenres.includes(genre)) {
        mergedFilmGenres.push(genre);
      }
    });

    // If we still have no genres but have liked movies, ensure we have some default genres
    if (mergedFilmGenres.length === 0 && movieFeedback && movieFeedback.length > 0) {
      mergedFilmGenres = ["Action", "Drama", "Comedy", "Thriller"];
      console.log("Using emergency fallback genres as a last resort");
    }

    // Get music preferences
    const { data: musicPreferences, error: musicError } = await adminClient
      .from("music_preferences")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (musicError && musicError.code !== "PGRST116") {
      console.error("Error fetching music preferences:", musicError);
    }

    // If we have movie feedback but failed to store preferences,
    // attempt to save the genres we've extracted
    if (
      movieFeedback &&
      movieFeedback.length > 0 &&
      (!filmPreferences || !filmPreferences.genres || filmPreferences.genres.length === 0)
    ) {
      // Try multiple approaches to save these preferences
      try {
        // First try to use the admin client directly
        if (supabaseAdmin) {
          console.log("Attempting direct database update of preferences");
          await supabaseAdmin.from("film_preferences").upsert({
            user_id: userId,
            genres: mergedFilmGenres,
            liked_movies: likedMovieIds,
            updated_at: new Date().toISOString(),
          });
        }
      } catch (firstErr) {
        console.error("Direct database update failed:", firstErr);

        try {
          // Then try the admin API endpoint
          console.log("Trying admin-preferences API endpoint");
          await fetch(`/api/users/${userId}/admin-preferences`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              filmPreferences: {
                genres: mergedFilmGenres,
                liked_movies: likedMovieIds,
              },
            }),
          });
        } catch (secondErr) {
          console.error("Admin API update failed:", secondErr);

          // Let the UI update even if storage fails
          console.log("Will update UI with preferences even though storage failed");
        }
      }
    }

    return {
      filmPreferences: {
        ...(filmPreferences || {}),
        genres: mergedFilmGenres,
        liked_movies:
          likedMovieIds.length > 0 ? likedMovieIds : filmPreferences?.liked_movies || [],
      },
      musicPreferences: musicPreferences || { genres: [] },
    };
  }

  /**
   * Update the user's preferences
   */
  public static async updateUserPreferences(
    userId: string,
    preferences: {
      filmPreferences?: { genres: string[] };
      musicPreferences?: { genres: string[] };
    }
  ) {
    try {
      // Check if user exists
      const user = await this.getUserById(userId);
      if (!user) {
        throw new Error("User not found");
      }

      console.log(`Updating preferences for user ${userId} via admin API`);

      // Use our admin endpoint that bypasses RLS instead of direct database access
      if (preferences.filmPreferences) {
        try {
          // Admin API to bypass RLS
          const response = await fetch(`/api/users/${userId}/admin-preferences`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              filmPreferences: {
                genres: preferences.filmPreferences.genres,
                // Include liked_movies if needed
                liked_movies: [],
              },
            }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
            throw new Error(`Admin API error: ${errorData.error || response.statusText}`);
          }

          console.log("Successfully updated film preferences via admin API");
        } catch (e: unknown) {
          console.error("Exception updating film preferences via admin API:", e);
          throw new Error(
            `Failed to update film preferences: ${e instanceof Error ? e.message : String(e)}`
          );
        }
      }

      // Update music preferences if provided
      if (preferences.musicPreferences) {
        try {
          // Use similar admin endpoint approach for music
          const response = await fetch(`/api/users/${userId}/admin-preferences`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              musicPreferences: {
                genres: preferences.musicPreferences.genres,
              },
            }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
            throw new Error(`Admin API error: ${errorData.error || response.statusText}`);
          }

          console.log("Successfully updated music preferences via admin API");
        } catch (e: unknown) {
          console.error("Exception updating music preferences via admin API:", e);
          throw new Error(
            `Failed to update music preferences: ${e instanceof Error ? e.message : String(e)}`
          );
        }
      }

      return { success: true };
    } catch (error) {
      console.error("Error in updateUserPreferences:", error);
      throw error;
    }
  }

  /**
   * Refresh user preferences based on feedback (liked movies)
   */
  public static async refreshUserPreferencesFromFeedback(userId: string) {
    try {
      console.log(`Refreshing preferences for user ${userId}`);

      // Używamy klienta administratora aby ominąć ograniczenia RLS
      const adminClient = supabaseAdmin || supabaseClient;
      console.log("Admin client available for refresh:", !!supabaseAdmin);

      // Get liked movies from item_feedback
      const { data: movieFeedback, error: feedbackError } = await supabaseClient
        .from("item_feedback")
        .select("item_id, genre, feedback_type")
        .eq("user_id", userId)
        .eq("feedback_type", "like");

      if (feedbackError) {
        console.error("Error fetching movie feedback:", feedbackError);
        return false;
      }

      console.log(`Found ${movieFeedback?.length || 0} liked items for user ${userId}`);

      if (!movieFeedback || movieFeedback.length === 0) {
        console.log("No movie feedback found for user:", userId);
        return false;
      }

      // Log some examples of the raw feedback data
      console.log("Sample feedback data:", JSON.stringify(movieFeedback.slice(0, 3)));

      // Extract and process genres from feedback
      const allGenres = movieFeedback
        .filter((item) => item.genre)
        .flatMap((item) => {
          // Genre might be stored as a comma-separated string
          if (typeof item.genre === "string") {
            const genres = item.genre
              .split(",")
              .map((g) => g.trim())
              .filter(Boolean);
            console.log(`From item ${item.item_id}, extracted genres: ${genres.join(", ")}`);
            return genres;
          }
          return [];
        });

      console.log(`Total extracted genres: ${allGenres.length}`);

      // Jeśli nie mamy gatunków, użyjmy domyślnych
      let genresToUse = ["Action", "Drama", "Adventure", "Thriller"];

      // Ale jeśli znaleźliśmy gatunki, użyjmy ich
      if (allGenres.length > 0) {
        // Process genres: count, format, and sort them
        const genreCounts: Record<string, number> = {};
        allGenres.forEach((genre) => {
          // Skip empty genres
          if (!genre) return;

          // Format genre string (capitalize first letter, trim whitespace)
          const formattedGenre = genre.trim().replace(/^\w/, (c) => c.toUpperCase());
          genreCounts[formattedGenre] = (genreCounts[formattedGenre] || 0) + 1;
        });

        console.log("Genre counts:", genreCounts);

        // Sort by count (most liked first) and extract genre names
        genresToUse = Object.entries(genreCounts)
          .sort((a, b) => b[1] - a[1])
          .map(([genre]) => genre);

        console.log("Top genres:", genresToUse);
      } else {
        console.log("No genres found in feedback, using fallback genres");
      }

      // Collect liked movie IDs
      const likedMovieIds = movieFeedback.map((item) => item.item_id).filter(Boolean);

      // Wypróbujmy różne podejścia, aby zapisać preferencje
      try {
        console.log("Trying to update preferences with direct update");

        // Najpierw sprawdźmy, czy preferencje już istnieją
        const { data: existingPrefs, error: checkError } = await adminClient
          .from("film_preferences")
          .select("id")
          .eq("user_id", userId)
          .single();

        // Jeśli istnieją - aktualizujemy, jeśli nie - tworzymy nowe
        if (!checkError || existingPrefs) {
          // Aktualizuj istniejące
          const updateData = {
            genres: genresToUse,
            liked_movies: likedMovieIds,
            updated_at: new Date().toISOString(),
          };

          const { error: updateError } = await adminClient
            .from("film_preferences")
            .update(updateData)
            .eq("user_id", userId);

          if (updateError) {
            throw updateError;
          }
        } else {
          // Utwórz nowe
          const insertData = {
            user_id: userId,
            genres: genresToUse,
            liked_movies: likedMovieIds,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          const { error: insertError } = await adminClient
            .from("film_preferences")
            .insert(insertData);

          if (insertError) {
            throw insertError;
          }
        }

        console.log("Successfully updated film preferences");
        return true;
      } catch (firstError) {
        console.error("First approach failed:", firstError);

        // Spróbujmy jeszcze raz z upsert
        try {
          console.log("Trying upsert approach");

          const upsertData = {
            user_id: userId,
            genres: genresToUse,
            liked_movies: likedMovieIds,
            updated_at: new Date().toISOString(),
          };

          const { error: upsertError } = await adminClient
            .from("film_preferences")
            .upsert(upsertData);

          if (upsertError) {
            throw upsertError;
          }

          console.log("Successfully upserted film preferences");
          return true;
        } catch (secondError) {
          console.error("Second approach failed:", secondError);

          // Jako ostatnią deskę ratunku aktualizuj przez API endpoint
          try {
            console.log("Trying to update via API endpoint");

            const apiResponse = await fetch(`/api/users/${userId}/preferences`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                filmPreferences: {
                  genres: genresToUse,
                  liked_movies: likedMovieIds,
                },
              }),
            });

            if (!apiResponse.ok) {
              throw new Error(`API error: ${apiResponse.status} ${apiResponse.statusText}`);
            }

            console.log("Successfully updated preferences via API");
            return true;
          } catch (finalError) {
            console.error("All approaches failed:", finalError);
            return false;
          }
        }
      }
    } catch (error) {
      console.error("Error refreshing user preferences from feedback:", error);
      return false;
    }
  }
}
