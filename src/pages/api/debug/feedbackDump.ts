import type { APIRoute } from "astro";
import { supabaseAdmin } from "../../../db/supabase.admin";
import { supabaseClient } from "../../../db/supabase.client";

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  try {
    const userId = url.searchParams.get("userId");

    if (!userId) {
      return new Response(JSON.stringify({ error: "userId is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log(`Dumping item_feedback for user ${userId}`);

    // Use admin client if available, otherwise use regular client
    const client = supabaseAdmin || supabaseClient;

    const { data: feedback, error } = await client
      .from("item_feedback")
      .select("*")
      .eq("user_id", userId);

    if (error) {
      console.error("Error fetching item_feedback:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Also check the film_preferences table
    const { data: filmPrefs, error: filmError } = await client
      .from("film_preferences")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (filmError && filmError.code !== "PGRST116") {
      console.error("Error fetching film_preferences:", filmError);
    }

    // Get results from UserPreferencesService.getFilmPreferences
    try {
      // Import dynamically to avoid circular dependencies
      const { UserPreferencesService } = await import(
        "../../../lib/services/userPreferences.service"
      );
      const servicePrefs = await UserPreferencesService.getFilmPreferences(userId);
      const metadataItems = await UserPreferencesService.getFilmGenresMetadata(userId);

      return new Response(
        JSON.stringify({
          feedback: {
            count: feedback?.length || 0,
            items: feedback || [],
            sample: feedback?.slice(0, 5) || [],
            genreCount:
              feedback?.filter((item) => item.genre && item.genre.trim() !== "").length || 0,
          },
          filmPrefs,
          servicePrefs,
          metadataItems,
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache, no-store, must-revalidate",
          },
        }
      );
    } catch (e) {
      console.error("Error getting service preferences:", e);
      return new Response(
        JSON.stringify({
          feedback: {
            count: feedback?.length || 0,
            items: feedback || [],
            sample: feedback?.slice(0, 5) || [],
            genreCount:
              feedback?.filter((item) => item.genre && item.genre.trim() !== "").length || 0,
          },
          filmPrefs,
          serviceError: e instanceof Error ? e.message : String(e),
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache, no-store, must-revalidate",
          },
        }
      );
    }
  } catch (error) {
    console.error("Unhandled error in feedbackDump endpoint:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
