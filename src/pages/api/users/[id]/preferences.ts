import type { APIRoute } from "astro";
import { UserPreferencesService } from "../../../../lib/services/userPreferences.service";

export const prerender = false;

/**
 * API handler for user preferences
 * GET /api/users/[id]/preferences - Get user preferences for music and film
 * Query params:
 *   refresh=true - Force refresh preferences from feedback data
 *   forceUpdate=true - Force update preferences in the database
 */
export const GET: APIRoute = async ({ params, request }) => {
  try {
    // console.log("Preferences API called");

    const userId = params.id;

    if (!userId) {
      return new Response(JSON.stringify({ error: "User ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if refresh parameter is set to true
    const url = new URL(request.url);
    const shouldRefresh = url.searchParams.get("refresh") === "true";
    const forceUpdate = url.searchParams.get("forceUpdate") === "true";

    console.log(
      `Preferences request for user ${userId} - refresh: ${shouldRefresh}, forceUpdate: ${forceUpdate}`
    );

    // If refresh is requested, build the latest user preferences from liked movies
    if (shouldRefresh) {
      console.log(`Refreshing preferences for user ${userId}`);
      try {
        const refreshResult = await UserPreferencesService.refreshFilmPreferences(userId);
        console.log(`Refresh result: ${refreshResult ? "success" : "failed"}`);

        // Even if refresh "failed", it means we at least tried to process the feedback data
        // No need to use any default genres anymore
      } catch (refreshError) {
        // console.error("Error during preference refresh:", refreshError);
        return new Response(
          JSON.stringify({
            error: "Failed to refresh preferences",
            details: refreshError instanceof Error ? refreshError.message : String(refreshError),
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    // Get user preferences using the new UserPreferencesService
    try {
      const filmPreferences = await UserPreferencesService.getFilmPreferences(userId);

      // Format the response to match expected structure
      const preferences = {
        filmPreferences: filmPreferences,
        musicPreferences: {
          genres: [],
          user_id: userId,
        },
      };

      console.log(`Returning preferences for user ${userId}:`, JSON.stringify(preferences));

      return new Response(JSON.stringify(preferences), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      });
    } catch (getError) {
      console.error("Error getting user preferences:", getError);
      return new Response(
        JSON.stringify({
          error: "Failed to get user preferences",
          details: getError instanceof Error ? getError.message : String(getError),
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("Error in preferences API:", error);

    return new Response(
      JSON.stringify({
        error: "Failed to fetch user preferences",
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
export const POST: APIRoute = async ({ params, request }) => {
  try {
    const userId = params.id;

    if (!userId) {
      return new Response(JSON.stringify({ error: "User ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Parse request body
    const body = await request.json();

    console.log(`Updating preferences for user ${userId}: ${JSON.stringify(body)}`);

    // Use admin client to update preferences directly with the right data service
    try {
      const { filmPreferences } = body;

      // If film preferences are provided, save them
      if (filmPreferences) {
        // Use supabase admin to update preferences
        const { supabaseAdmin } = await import("../../../../db/supabase.admin");

        if (supabaseAdmin) {
          const { error } = await supabaseAdmin.from("film_preferences").upsert({
            user_id: userId,
            genres: filmPreferences.genres || [],
            liked_movies: filmPreferences.liked_movies || [],
            updated_at: new Date().toISOString(),
          });

          if (error) {
            throw new Error(`Failed to update film preferences: ${error.message}`);
          }
        } else {
          // console.warn("Admin client not available for preferences update");
        }
      }

      return new Response(
        JSON.stringify({ success: true, message: "Preferences updated successfully" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (updateError) {
      console.error("Error updating user preferences:", updateError);
      return new Response(
        JSON.stringify({
          error: "Failed to update user preferences",
          details: updateError instanceof Error ? updateError.message : String(updateError),
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("Error in preferences update API:", error);

    return new Response(
      JSON.stringify({
        error: "Failed to update user preferences",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
