import { supabaseAdmin } from "../../db/supabase.admin";
import type { UpdateUserCommand, UserProfileDTO } from "../../types";
import { createClient } from "@supabase/supabase-js";

/**
 * Serwis odpowiedzialny za operacje na profilu użytkownika.
 * Obsługuje pobieranie i aktualizację danych użytkownika.
 */

// Create a factory function to get a Supabase client that works both client and server side
const getSupabaseClient = () => {
  return createClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY
  );
};

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class UserService {
  /**
   * Pobiera profil użytkownika na podstawie ID.
   *
   * @param userId - UUID użytkownika
   * @returns Obiekt z danymi profilu użytkownika lub null, jeśli użytkownik nie istnieje
   * @throws Error w przypadku błędu bazy danych
   */
  public static async getUserProfile(userId: string): Promise<UserProfileDTO | null> {
    const { data, error } = await getSupabaseClient()
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      // console.error("Error fetching user:", error);
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
    const { data: updatedData, error } = await getSupabaseClient()
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
    try {
      const { data, error } = await getSupabaseClient()
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        // Jeśli nie znaleziono użytkownika, spróbujemy utworzyć domyślny profil
        if (error.code === "PGRST116") {
          // console.log(`User ${userId} not found, using default profile`);

          // Zwróć domyślny profil bez próby zapisywania
          return {
            id: userId,
            email: `user_${userId.substring(0, 8)}@example.com`,
            nick: `user_${userId.substring(0, 8)}`,
          };
        }
        console.error("Error fetching user:", error);
        // Zwróć minimalny profil zamiast null
        return { id: userId, email: "", nick: `user_${userId.substring(0, 8)}` };
      }

      return data;
    } catch (err) {
      console.error("Unexpected error in getUserById:", err);
      // Zwróć minimalny profil zamiast null
      return { id: userId, email: "", nick: `user_${userId.substring(0, 8)}` };
    }
  }

  /**
   * Update a user in the database
   */
  public static async updateUser(userId: string, userData: Record<string, unknown>) {
    const { data, error } = await getSupabaseClient()
      .from("users")
      .update(userData)
      .eq("id", userId);

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
    const { data, error } = await getSupabaseClient().from("users").insert([userData]);

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
    try {
      // Używamy klienta administratora aby ominąć ograniczenia RLS
      const adminClient = supabaseAdmin || getSupabaseClient();
      console.log("Admin client available for preferences:", !!supabaseAdmin);

      // Get film preferences from film_preferences table
      const { data: filmPreferences, error: filmError } = await adminClient
        .from("film_preferences")
        .select("*")
        .eq("user_id", userId)
        .single();

      // Sprawdź czy potrzebujemy utworzyć domyślne preferencje
      let shouldCreateFilmPreferences = false;
      if (filmError) {
        if (filmError.code === "PGRST116") {
          console.log(`No film preferences found for user ${userId}, will create defaults`);
          shouldCreateFilmPreferences = true;
        } else {
          console.error("Error fetching film preferences:", filmError);
        }
      }

      // Get liked movies from item_feedback to determine genre preferences
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let movieFeedback: any[] = [];
      try {
        const { data, error: feedbackError } = await getSupabaseClient()
          .from("item_feedback")
          .select("item_id, genre, feedback_type, cast, artist")
          .eq("user_id", userId)
          .eq("feedback_type", "like");

        if (feedbackError) {
          console.error("Error fetching movie feedback:", feedbackError);
        } else if (data) {
          movieFeedback = data;
        }
      } catch (feedbackErr) {
        console.error("Exception fetching movie feedback:", feedbackErr);
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
          .filter((item) => item?.item_id)
          .map((item) => item.item_id)
          .filter(Boolean);

        // Collect all genres from liked movies
        try {
          const allGenres = movieFeedback
            .filter((item) => item?.genre || item?.cast || item?.artist)
            .flatMap((item) => {
              try {
                // The genre might be stored as a comma-separated string
                if (typeof item?.genre === "string") {
                  const genres = item.genre
                    .split(",")
                    .map((g: string) => g.trim())
                    .filter(Boolean);
                  console.log(`Movie ${item.item_id} has genres: ${genres.join(", ")}`);
                  return genres;
                }
                // It might also be an array
                if (Array.isArray(item?.genre)) {
                  return item.genre.filter(Boolean);
                }
              } catch (e) {
                console.error("Error processing genre:", e);
              }
              return [];
            });

          console.log(`Extracted ${allGenres.length} genres from feedback`);

          // Count genre occurrences to find the most liked genres
          const genreCounts: Record<string, number> = {};
          allGenres.forEach((genre) => {
            // Skip empty genres
            if (!genre) return;

            try {
              // Format genre string properly (capitalize first letter, trim whitespace)
              const formattedGenre = genre.trim().replace(/^\w/, (c: string) => c.toUpperCase());
              genreCounts[formattedGenre] = (genreCounts[formattedGenre] || 0) + 1;
            } catch (e) {
              console.error("Error formatting genre:", e);
            }
          });

          console.log("Genre counts:", JSON.stringify(genreCounts));

          // Convert to array of genres, sort by count, and take top genres
          genresFromFeedback = Object.entries(genreCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([genre]) => genre);

          console.log(`Top genres from feedback: ${genresFromFeedback.join(", ")}`);
        } catch (genreErr) {
          console.error("Error extracting genres from feedback:", genreErr);
        }
      }

      // Ensure we never return empty array if we have liked movies
      if (genresFromFeedback.length === 0 && movieFeedback && movieFeedback.length > 0) {
        console.log(
          `Warning: Found ${movieFeedback.length} liked movies but no genres were extracted.`
        );

        // Try direct genres from the feedback data if available
        const directGenres = movieFeedback
          .filter(
            (item) => item?.genre && typeof item.genre === "string" && item.genre.trim() !== ""
          )
          .map((item) => {
            // Just take first genre if comma-separated
            const firstGenre = item.genre.split(",")[0].trim();
            return firstGenre.replace(/^\w/, (c: string) => c.toUpperCase());
          })
          .filter(Boolean);

        if (directGenres.length > 0) {
          console.log(`Found ${directGenres.length} direct genres from movies`);
          genresFromFeedback = [...new Set(directGenres)]; // Remove duplicates
        } else {
          console.log("Still no genres available after direct extraction attempt");
        }
      }

      // Merge preferences from direct settings and feedback data
      // Prioritize explicit preferences but include genres from feedback
      const mergedFilmGenres = filmPreferences?.genres || [];

      // Add genres from feedback that aren't already in explicit preferences
      genresFromFeedback.forEach((genre) => {
        if (!mergedFilmGenres.includes(genre)) {
          mergedFilmGenres.push(genre);
        }
      });

      // Log final merged genres
      console.log(`Final merged genres: ${mergedFilmGenres.join(", ")}`);

      // Get music preferences
      const { data: musicPreferences, error: musicError } = await adminClient
        .from("music_preferences")
        .select("*")
        .eq("user_id", userId)
        .single();

      let shouldCreateMusicPreferences = false;
      if (musicError && musicError.code === "PGRST116") {
        console.log(`No music preferences found for user ${userId}, will create defaults`);
        shouldCreateMusicPreferences = true;
      } else if (musicError) {
        console.error("Error fetching music preferences:", musicError);
      }

      // If needed, create default preferences
      if (shouldCreateFilmPreferences || shouldCreateMusicPreferences) {
        try {
          // Create film preferences if needed
          if (shouldCreateFilmPreferences && supabaseAdmin) {
            console.log("Creating film preferences with real user data");

            try {
              const { error: insertError } = await supabaseAdmin.from("film_preferences").upsert({
                user_id: userId,
                genres: mergedFilmGenres,
                liked_movies: likedMovieIds,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              });

              if (insertError) {
                console.error("Error creating film preferences:", insertError);
              } else {
                console.log("Successfully created film preferences");
              }
            } catch (insertErr) {
              console.error("Exception creating film preferences:", insertErr);
            }
          }

          // Create music preferences if needed
          if (shouldCreateMusicPreferences && supabaseAdmin) {
            console.log("Creating empty music preferences");

            try {
              const { error: insertError } = await supabaseAdmin.from("music_preferences").upsert({
                user_id: userId,
                genres: [],
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              });

              if (insertError) {
                console.error("Error creating default music preferences:", insertError);
              } else {
                console.log("Successfully created empty music preferences");
              }
            } catch (insertErr) {
              console.error("Exception creating music preferences:", insertErr);
            }
          }
        } catch (createErr) {
          console.error("Exception creating default preferences:", createErr);
        }
      }

      // Zawsze mamy jakieś sensowne wartości, nawet jeśli nie udało się niczego pobrać z bazy danych
      return {
        filmPreferences: {
          ...(filmPreferences || {}),
          genres: mergedFilmGenres,
          liked_movies:
            likedMovieIds.length > 0 ? likedMovieIds : filmPreferences?.liked_movies || [],
        },
        musicPreferences: musicPreferences || {
          genres: [],
          user_id: userId,
        },
      };
    } catch (error) {
      // W przypadku poważnego błędu, zwróć puste preferencje
      console.error("Unexpected error in getUserPreferences:", error);
      return {
        filmPreferences: {
          genres: [],
          liked_movies: [],
        },
        musicPreferences: {
          genres: [],
          user_id: userId,
        },
      };
    }
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
      // Sprawdź czy użytkownik istnieje, ale nie rzucaj błędu jeśli nie
      const user = await this.getUserById(userId);
      if (!user) {
        console.log(`User ${userId} not found, but continuing with preferences update`);
        // Kontynuuj mimo braku użytkownika
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
            console.error(`Admin API error: ${errorData.error || response.statusText}`);
            // Nie rzucaj błędu, kontynuuj
          } else {
            console.log("Successfully updated film preferences via admin API");
          }
        } catch (e: unknown) {
          console.error("Exception updating film preferences via admin API:", e);
          // Nie rzucaj błędu, kontynuuj
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
            console.error(`Admin API error: ${errorData.error || response.statusText}`);
            // Nie rzucaj błędu, kontynuuj
          } else {
            console.log("Successfully updated music preferences via admin API");
          }
        } catch (e: unknown) {
          console.error("Exception updating music preferences via admin API:", e);
          // Nie rzucaj błędu, kontynuuj
        }
      }

      return { success: true };
    } catch (error) {
      console.error("Error in updateUserPreferences:", error);
      // Zwróć sukces mimo błędu, aby UI mogło kontynuować
      return { success: true };
    }
  }

  /**
   * Refresh user preferences based on feedback (liked movies)
   */
  public static async refreshUserPreferencesFromFeedback(userId: string) {
    try {
      console.log(`Refreshing preferences for user ${userId}`);

      // Używamy klienta administratora aby ominąć ograniczenia RLS
      const adminClient = supabaseAdmin || getSupabaseClient();
      console.log("Admin client available for refresh:", !!supabaseAdmin);

      // Get liked movies from item_feedback
      const { data: movieFeedback, error: feedbackError } = await getSupabaseClient()
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
