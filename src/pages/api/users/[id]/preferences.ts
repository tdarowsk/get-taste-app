import type { APIRoute } from "astro";
import type { UserPreferencesDTO } from "../../../../types";
import { createSupabaseServerInstance } from "../../../../db/supabase.client";

export const prerender = false;

/**
 * API handler for user preferences
 * GET /api/users/[id]/preferences - Get user preferences for music and film
 */
export const GET: APIRoute = async ({ params, request, cookies }) => {
  try {
    console.log("Fetching preferences for user:", params.id);

    // Extract user ID from the URL
    const userId = params.id;

    // Validate user ID
    if (!userId) {
      console.error("Missing user ID in URL");
      return new Response(
        JSON.stringify({
          error: "Missing user ID",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Initialize Supabase client
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    console.log(`Fetching music preferences for user ${userId}`);
    // Try to fetch real preferences from database
    const { data: musicPrefs, error: musicError } = await supabase
      .from("music_preferences")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (musicError) {
      console.error("Error fetching music preferences:", musicError);
    }

    console.log(`Fetching film preferences for user ${userId}`);
    const { data: filmPrefs, error: filmError } = await supabase
      .from("film_preferences")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (filmError) {
      console.error("Error fetching film preferences:", filmError);
    }

    // Define mock preferences for new users or if real data is unavailable
    const mockMusicPrefs = {
      genres: ["rock", "pop", "jazz", "classical"],
      artists: ["Coldplay", "The Beatles", "Adele"],
    };

    const mockFilmPrefs = {
      genres: ["drama", "action", "sci-fi", "comedy"],
      director: "Christopher Nolan",
      cast: ["Tom Hanks", "Leonardo DiCaprio"],
      screenwriter: "Aaron Sorkin",
      liked_movies: ["Inception", "The Dark Knight"],
    };

    // Construct the response using real data if available, otherwise mock data
    const userPreferences: UserPreferencesDTO = {
      music: !musicPrefs
        ? mockMusicPrefs
        : {
            genres: musicPrefs.genres || [],
            artists: musicPrefs.artists || [],
          },
      film: !filmPrefs
        ? mockFilmPrefs
        : {
            genres: filmPrefs.genres || [],
            director: filmPrefs.director || null,
            cast: filmPrefs.cast || [],
            screenwriter: filmPrefs.screenwriter || null,
            liked_movies: filmPrefs.liked_movies || [],
          },
    };

    console.log("Returning preferences:", {
      hasMusicPrefs: !!musicPrefs,
      hasFilmPrefs: !!filmPrefs,
      musicGenresCount: userPreferences.music?.genres?.length || 0,
      filmGenresCount: userPreferences.film?.genres?.length || 0,
    });

    // Return success response with the preferences
    return new Response(JSON.stringify(userPreferences), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error processing preferences request:", error);
    return new Response(
      JSON.stringify({
        error: "An error occurred while retrieving user preferences",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

/**
 * API handler for updating user preferences
 * POST /api/users/[id]/preferences - Update user preferences
 */
export const POST: APIRoute = async ({ params, request, cookies }) => {
  try {
    console.log("Updating preferences for user:", params.id);

    // Check authentication
    const supabase = createSupabaseServerInstance({
      headers: request.headers,
      cookies: cookies,
    });

    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession();

    if (!session || authError) {
      console.error("Authentication error:", authError);
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Extract user ID from the URL
    const userId = params.id;

    // Validate user ID
    if (!userId) {
      console.error("Missing user ID in URL");
      return new Response(
        JSON.stringify({
          error: "Missing user ID",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Parse request body
    const body = await request.json();
    console.log("Received preferences update:", body);

    // Validate that at least one of music or film is provided
    if (!body.music && !body.film) {
      return new Response(
        JSON.stringify({
          error: "At least one of music or film preferences must be provided",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const updates: UserPreferencesDTO = {};

    // Update music preferences if provided
    if (body.music) {
      console.log("Updating music preferences");
      const { error: musicError } = await supabase
        .from("music_preferences")
        .upsert({
          user_id: userId,
          genres: body.music.genres || [],
          artists: body.music.artists || [],
          updated_at: new Date().toISOString(),
        })
        .select();

      if (musicError) {
        console.error("Error updating music preferences:", musicError);
        return new Response(
          JSON.stringify({
            error: "Failed to update music preferences",
            details: musicError,
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      updates.music = {
        genres: body.music.genres || [],
        artists: body.music.artists || [],
      };
    }

    // Update film preferences if provided
    if (body.film) {
      console.log("Updating film preferences");
      const { error: filmError } = await supabase
        .from("film_preferences")
        .upsert({
          user_id: userId,
          genres: body.film.genres || [],
          director: body.film.director || null,
          cast: body.film.cast || [],
          screenwriter: body.film.screenwriter || null,
          liked_movies: body.film.liked_movies || [],
          updated_at: new Date().toISOString(),
        })
        .select();

      if (filmError) {
        console.error("Error updating film preferences:", filmError);
        return new Response(
          JSON.stringify({
            error: "Failed to update film preferences",
            details: filmError,
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      updates.film = {
        genres: body.film.genres || [],
        director: body.film.director || null,
        cast: body.film.cast || [],
        screenwriter: body.film.screenwriter || null,
        liked_movies: body.film.liked_movies || [],
      };
    }

    console.log("Preferences updated successfully");

    // Return success response with the updated preferences
    return new Response(
      JSON.stringify({
        message: "Preferences updated successfully",
        data: updates,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error updating preferences:", error);
    return new Response(
      JSON.stringify({
        error: "An error occurred while updating preferences",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
