import type { APIRoute } from "astro";
import type { RecommendationHistoryDTO, RecommendationWithFeedbackDTO } from "../../../../types";
import { createSupabaseServerInstance } from "../../../../db/supabase.client";

export const prerender = false;

/**
 * API handler for retrieving recommendation history
 * GET /api/users/[id]/recommendation-history
 */
export const GET: APIRoute = async ({ params, cookies, request }) => {
  try {
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

    // Compare user IDs as strings
    if (String(userId) !== String(session.user.id)) {
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
    const limit = parseInt(url.searchParams.get("limit") || "50", 10);
    const offset = parseInt(url.searchParams.get("offset") || "0", 10);

    // For now, return mock data
    const mockData: RecommendationWithFeedbackDTO[] = [];

    const historyData: RecommendationHistoryDTO = {
      data: mockData,
      count: 0,
      limit,
      offset,
    };

    return new Response(JSON.stringify(historyData), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response(
      JSON.stringify({
        error: "An error occurred while retrieving recommendation history",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
