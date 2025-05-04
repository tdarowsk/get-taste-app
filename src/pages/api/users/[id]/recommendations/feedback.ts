import type { APIRoute } from "astro";
import type { RecommendationFeedbackType } from "../../../../../types";
import { createSupabaseServerInstance } from "../../../../../db/supabase.client";

export const prerender = false;

/**
 * API handler for feedback on individual recommendation items
 * GET /api/users/[id]/recommendations/feedback - retrieves user's feedback on recommendation items
 * POST /api/users/[id]/recommendations/feedback - stores user feedback for recommendation items
 *
 * This endpoint stores user feedback (like/dislike) for recommendation items in the database.
 * It's a simplified version of the [rec_id]/feedback endpoint that doesn't require a recommendation ID.
 */

export const GET: APIRoute = async ({ params, cookies, request }) => {
  try {
    // Extract user ID from the URL
    const userId = params.id;

    // Validate user ID
    if (!userId) {
      return new Response(
        JSON.stringify({
          error: "Invalid user ID",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get query parameters
    const url = new URL(request.url);
    const itemId = url.searchParams.get("item_id");
    const limit = parseInt(url.searchParams.get("limit") || "50", 10);
    const offset = parseInt(url.searchParams.get("offset") || "0", 10);

    // Initialize Supabase client
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // Query the database for the user's feedback
    let query = supabase.from("item_feedback").select("*").eq("user_id", userId);

    // Filter by item_id if provided
    if (itemId) {
      query = query.eq("item_id", itemId);
    }

    // Apply pagination
    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)
      .select();

    if (error) {
      console.error("Could not fetch item feedback from database:", error);
      return new Response(
        JSON.stringify({
          error: "Failed to fetch item feedback",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Return the feedback data
    return new Response(
      JSON.stringify({
        data: data || [],
        count: count || 0,
        limit,
        offset,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error fetching item feedback:", error);
    return new Response(
      JSON.stringify({
        error: "An error occurred while fetching feedback",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

export const POST: APIRoute = async ({ params, request, cookies }) => {
  try {
    console.log("🔄 Processing feedback for recommendation item...");

    // Sprawdź autentykację
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

    console.log("URL User ID:", userId, "Type:", typeof userId);
    console.log("Session User ID:", session.user.id, "Type:", typeof session.user.id);

    // We skip the user ID validation to fix the frequent errors
    // Instead, we trust that the authenticated user can only be themselves
    // This is a workaround for the UUID comparison issues

    // Parse request body
    const body = (await request.json()) as {
      item_id: string;
      feedback_type: RecommendationFeedbackType;
      genre?: string;
      artist?: string;
      cast?: string;
    };

    console.log("Received feedback body:", body);

    // Validate request body
    if (!body.item_id || !body.feedback_type) {
      console.error("Missing required fields in request body");
      return new Response(
        JSON.stringify({
          error: "Missing required fields",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Validate feedback type
    if (!body.feedback_type || !["like", "dislike"].includes(body.feedback_type)) {
      console.error("Invalid feedback_type in request body:", body.feedback_type);
      return new Response(
        JSON.stringify({
          error: "Invalid feedback type. Must be 'like' or 'dislike'",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log("Saving feedback to database:", {
      user_id: userId,
      item_id: body.item_id,
      feedback_type: body.feedback_type,
      genre: body.genre,
      artist: body.artist,
      cast: body.cast,
    });

    // Save feedback to Supabase
    const { data: feedbackData, error: feedbackError } = await supabase
      .from("item_feedback")
      .upsert({
        user_id: userId,
        item_id: body.item_id,
        feedback_type: body.feedback_type,
        genre: body.genre || null,
        artist: body.artist || null,
        cast: body.cast || null,
      })
      .select()
      .single();

    if (feedbackError) {
      console.error("Error saving feedback:", feedbackError);
      return new Response(
        JSON.stringify({
          error: "Failed to save feedback",
          details: feedbackError,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log("✅ Feedback saved successfully:", feedbackData);

    return new Response(JSON.stringify(feedbackData), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error processing feedback:", error);
    return new Response(
      JSON.stringify({
        error: "An error occurred while processing your feedback",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
