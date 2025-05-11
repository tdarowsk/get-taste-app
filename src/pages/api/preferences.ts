import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "../../db/supabase.client";

/**
 * Endpoint for fetching user preferences in the format expected by the dashboard
 * GET /api/preferences?userId=XXX
 */
export const GET: APIRoute = async ({ request, url, cookies }) => {
  console.info("==================== PREFERENCES ROOT API CALLED ====================");
  console.info("Request URL:", url.toString());
  console.info("Request query params:", Object.fromEntries(url.searchParams.entries()));

  // Get parameters from query string
  const userId = url.searchParams.get("userId");

  if (!userId) {
    console.error("[API/preferences] Missing user ID");
    return new Response(JSON.stringify({ error: "Missing user ID" }), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  try {
    const supabase = createSupabaseServerInstance({
      headers: request.headers,
      cookies,
    });

    // Query the database for film preferences
    const { data: filmPreferencesData, error: filmPreferencesError } = await supabase
      .from("film_preferences")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (filmPreferencesError) {
      console.error(`[API/preferences] Film preferences error: ${filmPreferencesError.message}`);
    }

    // Query the database for music preferences
    const { data: musicPreferencesData, error: musicPreferencesError } = await supabase
      .from("music_preferences")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (musicPreferencesError) {
      console.error(`[API/preferences] Music preferences error: ${musicPreferencesError.message}`);
    }

    // Query feedback items to build list of liked movies
    const { data: likedMovies, error: likedMoviesError } = await supabase
      .from("item_feedback")
      .select("item_id, genre")
      .eq("user_id", userId)
      .eq("feedback_type", "like");

    if (likedMoviesError) {
      console.error(`[API/preferences] Error fetching liked movies: ${likedMoviesError.message}`);
    }

    // Extract movie IDs - remove 'movie_' prefix if present
    const likedMovieIds = likedMovies
      ? likedMovies.map((item) => {
          const id = item.item_id;
          return typeof id === "string" && id.startsWith("movie_")
            ? id.substring(6) // Remove 'movie_' prefix
            : id;
        })
      : [];

    // Extract film genres from liked movies
    const filmGenres = new Set<string>();

    // Add genres from film_preferences if they exist
    if (
      filmPreferencesData &&
      filmPreferencesData.genres &&
      Array.isArray(filmPreferencesData.genres)
    ) {
      filmPreferencesData.genres.forEach((genre) => {
        if (typeof genre === "string" && genre.trim()) {
          filmGenres.add(genre);
        }
      });
    }

    // Add genres from liked movies
    if (likedMovies) {
      likedMovies.forEach((item) => {
        if (item.genre && typeof item.genre === "string") {
          item.genre.split(/[,;|]/).forEach((genre) => {
            const trimmedGenre = genre.trim();
            if (trimmedGenre) {
              // Capitalize first letter of each word
              const formattedGenre = trimmedGenre
                .split(" ")
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(" ");
              filmGenres.add(formattedGenre);
            }
          });
        }
      });
    }

    // Extract music genres from music preferences
    const musicGenres = new Set<string>();
    if (
      musicPreferencesData &&
      musicPreferencesData.genres &&
      Array.isArray(musicPreferencesData.genres)
    ) {
      musicPreferencesData.genres.forEach((genre) => {
        if (typeof genre === "string" && genre.trim()) {
          musicGenres.add(genre);
        }
      });
    }

    // Return the user preferences in the expected format
    const response = {
      filmPreferences: {
        genres: Array.from(filmGenres),
        liked_movies: likedMovieIds,
        user_id: userId,
      },
      musicPreferences: {
        genres: Array.from(musicGenres),
        user_id: userId,
      },
    };

    console.log(
      `[API/preferences] Returning preferences for user ${userId}:`,
      JSON.stringify(response, null, 2)
    );

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error(
      "[API/preferences] Error:",
      error instanceof Error ? error.message : String(error)
    );

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
        status: "error",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
};
