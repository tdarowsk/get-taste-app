import type { APIRoute } from "astro";
import { UserPreferencesService } from "../../../../lib/services/userPreferences.service";

export const prerender = false;

/**
 * API handler for refreshing user preferences based on feedback data
 * POST /api/users/[id]/refresh-preferences - Refresh preferences based on liked items
 */
export const POST: APIRoute = async ({ params }) => {
  // console.log("Refresh preferences API called");

  try {
    const userId = params.id;

    if (!userId) {
      return new Response(JSON.stringify({ error: "User ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log(`Refreshing preferences for user ${userId}`);

    // Get current feedback data for debugging
    const feedbackData = await UserPreferencesService.getFilmPreferences(userId);
    console.log(
      `Current data: ${feedbackData.liked_movies.length} liked movies, ${feedbackData.genres.length} genres`
    );

    // Refresh preferences using UserPreferencesService
    const success = await UserPreferencesService.refreshFilmPreferences(userId);

    if (success) {
      // Get updated data for response
      const updatedData = await UserPreferencesService.getFilmPreferences(userId);
      console.log(
        `Updated data: ${updatedData.liked_movies.length} liked movies, ${updatedData.genres.length} genres`
      );

      // Get metadata as well
      const metadata = await UserPreferencesService.getFilmGenresMetadata(userId);

      return new Response(
        JSON.stringify({
          success: true,
          message: "Preferences refreshed successfully",
          data: {
            liked_movies_count: updatedData.liked_movies.length,
            genres: updatedData.genres,
            metadata: metadata,
          },
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache, no-store, must-revalidate",
          },
        }
      );
    } else {
      // If refresh failed, check if we have any liked movies
      if (feedbackData.liked_movies.length > 0) {
        console.log(
          `Refresh failed but user has ${feedbackData.liked_movies.length} liked movies. Investigating...`
        );

        // Try to get metadata directly for debugging
        const metadata = await UserPreferencesService.getFilmGenresMetadata(userId);

        return new Response(
          JSON.stringify({
            success: false,
            message: "Failed to refresh preferences, but found liked movies",
            data: {
              liked_movies_count: feedbackData.liked_movies.length,
              genres: feedbackData.genres,
              metadata: metadata,
            },
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // No liked movies found
      return new Response(
        JSON.stringify({
          success: false,
          message: "No liked movies found to generate preferences from",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    // console.error("Error in refresh preferences API:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to refresh preferences",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
