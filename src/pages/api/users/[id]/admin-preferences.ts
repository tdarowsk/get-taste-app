import type { APIRoute } from "astro";
import { supabaseAdmin } from "../../../../db/supabase.admin";
import { SUPABASE_URL, SUPABASE_KEY } from "../../../../env.config";

export const prerender = false;

/**
 * Admin API endpoint to bypass RLS and directly set user preferences
 * POST /api/users/[id]/admin-preferences
 */
export const POST: APIRoute = async ({ params, request }) => {
  try {
    // console.log("Admin preferences API called");
    console.log("SUPABASE_URL:", SUPABASE_URL);
    console.log("SUPABASE_KEY available:", !!SUPABASE_KEY);
    console.log("Admin client available:", !!supabaseAdmin);

    const userId = params.id;

    if (!userId) {
      return new Response(JSON.stringify({ error: "User ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Parse request body
    const body = await request.json();
    console.log(`Setting admin preferences for user ${userId}:`, JSON.stringify(body));

    // Extract film preferences
    const filmPreferences = body.filmPreferences;

    if (!filmPreferences || !Array.isArray(filmPreferences.genres)) {
      return new Response(
        JSON.stringify({ error: "Film preferences with genres array is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Track success state throughout multiple attempts
    let successfulUpdate = false;
    let updateData = null;

    // Attempt #1: Try using supabaseAdmin client (service role)
    if (supabaseAdmin) {
      try {
        console.log("Attempt #1: Using supabaseAdmin client");

        // Check if record exists
        const { data: existingData, error: checkError } = await supabaseAdmin
          .from("film_preferences")
          .select("id")
          .eq("user_id", userId)
          .single();

        if (checkError && checkError.code !== "PGRST116") {
          // console.error("Error checking for existing preferences:", checkError);
        }

        // We'll use raw SQL if possible to completely bypass RLS
        if (existingData) {
          // Update existing record using standard update instead of RPC
          const { data: updatedData, error: updateError } = await supabaseAdmin
            .from("film_preferences")
            .update({
              genres: filmPreferences.genres,
              liked_movies: filmPreferences.liked_movies || [],
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", userId)
            .select("*");

          if (updateError) {
            console.error("Error updating preferences:", updateError);
          } else {
            successfulUpdate = true;
            updateData = updatedData;
            console.log("Updated via standard update:", updateData);
          }
        } else {
          // Insert new record using standard insert
          const { data: insertedData, error: insertError } = await supabaseAdmin
            .from("film_preferences")
            .insert({
              user_id: userId,
              genres: filmPreferences.genres,
              liked_movies: filmPreferences.liked_movies || [],
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .select("*");

          if (insertError) {
            console.error("Error inserting preferences:", insertError);
          } else {
            successfulUpdate = true;
            updateData = insertedData;
            console.log("Inserted via standard insert:", updateData);
          }
        }
      } catch (error) {
        console.error("Admin client approach failed:", error);
      }
    }

    // Attempt #2: Direct fetch API call with service key
    if (!successfulUpdate && SUPABASE_KEY) {
      try {
        console.log("Attempt #2: Using direct fetch API with service key");

        // Check if record exists first
        const checkResponse = await fetch(
          `${SUPABASE_URL}/rest/v1/film_preferences?user_id=eq.${encodeURIComponent(userId)}&select=id`,
          {
            headers: {
              apikey: SUPABASE_KEY,
              Authorization: `Bearer ${SUPABASE_KEY}`,
            },
          }
        );

        const existingRecord = await checkResponse.json();
        const recordExists = Array.isArray(existingRecord) && existingRecord.length > 0;

        if (recordExists) {
          // Update
          const updateResponse = await fetch(
            `${SUPABASE_URL}/rest/v1/film_preferences?user_id=eq.${encodeURIComponent(userId)}`,
            {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                apikey: SUPABASE_KEY,
                Authorization: `Bearer ${SUPABASE_KEY}`,
                Prefer: "return=representation",
              },
              body: JSON.stringify({
                genres: filmPreferences.genres,
                liked_movies: filmPreferences.liked_movies || [],
                updated_at: new Date().toISOString(),
              }),
            }
          );

          if (updateResponse.ok) {
            successfulUpdate = true;
            updateData = await updateResponse.json();
            console.log("Updated via direct fetch API:", updateData);
          } else {
            const errorData = await updateResponse
              .json()
              .catch(() => ({ message: "Unknown error" }));
            console.error("Direct fetch API update failed:", errorData);
          }
        } else {
          // Insert
          const insertResponse = await fetch(`${SUPABASE_URL}/rest/v1/film_preferences`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: SUPABASE_KEY,
              Authorization: `Bearer ${SUPABASE_KEY}`,
              Prefer: "return=representation",
            },
            body: JSON.stringify({
              user_id: userId,
              genres: filmPreferences.genres,
              liked_movies: filmPreferences.liked_movies || [],
              updated_at: new Date().toISOString(),
              created_at: new Date().toISOString(),
            }),
          });

          if (insertResponse.ok) {
            successfulUpdate = true;
            updateData = await insertResponse.json();
            console.log("Inserted via direct fetch API:", updateData);
          } else {
            const errorData = await insertResponse
              .json()
              .catch(() => ({ message: "Unknown error" }));
            console.error("Direct fetch API insert failed:", errorData);
          }
        }
      } catch (error) {
        console.error("Direct fetch API approach failed:", error);
      }
    }

    // Final response - if all attempts failed but we need UI to update
    if (!successfulUpdate) {
      console.log("All database update attempts failed, returning UI-only update");
      return new Response(
        JSON.stringify({
          success: false,
          warning: "Database update failed but UI will be updated",
          message:
            "Failed to persist preferences to database. UI will show preferences temporarily.",
          data: {
            genres: filmPreferences.genres,
            liked_movies: filmPreferences.liked_movies || [],
          },
        }),
        {
          status: 200, // Still return 200 to allow UI update
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Preferences updated successfully",
        data: updateData || {
          genres: filmPreferences.genres,
          liked_movies: filmPreferences.liked_movies || [],
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Unexpected error in admin-preferences API:", error);

    return new Response(
      JSON.stringify({
        error: "Failed to update preferences",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
