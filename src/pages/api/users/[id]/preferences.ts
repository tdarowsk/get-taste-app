import type { APIRoute } from "astro";
import { UserService } from "../../../../lib/services/user.service";

// Define types for user preferences
interface FilmPreferences {
  genres: string[];
}

interface MusicPreferences {
  genres: string[];
}

// Define interface for query parameters
interface PreferencesQueryParams {
  refresh?: string;
  forceUpdate?: string;
}

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
    console.log("Preferences API called");

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
        const refreshResult = await UserService.refreshUserPreferencesFromFeedback(userId);
        console.log(`Refresh result: ${refreshResult ? "success" : "failed"}`);

        // If refresh failed and forceUpdate is true, create preferences with default genres
        if (!refreshResult && forceUpdate) {
          console.log("Force updating preferences with defaults");
          try {
            await UserService.updateUserPreferences(userId, {
              filmPreferences: {
                genres: ["Action", "Drama", "Comedy", "Thriller", "Adventure", "Sci-Fi"],
              },
            });
            console.log("Default preferences successfully applied");
          } catch (updateError) {
            console.error("Error applying default preferences:", updateError);
            return new Response(
              JSON.stringify({
                error: "Failed to set default preferences",
                details: updateError instanceof Error ? updateError.message : String(updateError),
              }),
              {
                status: 500,
                headers: { "Content-Type": "application/json" },
              }
            );
          }
        }
      } catch (refreshError) {
        console.error("Error during preference refresh:", refreshError);
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

    // Get user preferences using the UserService
    try {
      const preferences = await UserService.getUserPreferences(userId);
      console.log(`Returning preferences for user ${userId}: ${JSON.stringify(preferences)}`);

      return new Response(JSON.stringify(preferences), {
        status: 200,
        headers: { "Content-Type": "application/json" },
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

    try {
      // Update user preferences using the UserService
      await UserService.updateUserPreferences(userId, body);

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
