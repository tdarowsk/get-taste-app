import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "../../../../../../db/supabase.client";

export const GET: APIRoute = async ({ params, request, cookies }) => {
  try {
    // Extract user ID and recommendation ID from URL
    const userId = params.id;
    const recommendationId = Array.isArray(params.recommendationId)
      ? parseInt(params.recommendationId[0] || "")
      : parseInt(params.recommendationId || "");

    // Validate parameters
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

    if (isNaN(recommendationId)) {
      return new Response(
        JSON.stringify({
          error: "Invalid recommendation ID",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

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

    // Mock data for metadata insights
    const metadataInsight = {
      recommendationId: recommendationId,
      primaryFactors: [
        {
          type: "genre",
          name: "Main Genre",
          weight: 0.8,
          relevance: "High relevance to your preferences",
        },
        {
          type: "artist",
          name: "Featured Artist",
          weight: 0.7,
          relevance: "Based on your listening history",
        },
      ],
      secondaryFactors: [
        {
          type: "mood",
          name: "Current Mood",
          weight: 0.5,
          relevance: "Matches your current mood preferences",
        },
        {
          type: "tempo",
          name: "Musical Tempo",
          weight: 0.4,
          relevance: "Similar to content you enjoy",
        },
      ],
      uniqueFactors: [
        {
          type: "discovery",
          name: "New Discovery",
          weight: 0.6,
          relevance: "Something new we think you'll enjoy",
        },
      ],
    };

    // Return the mock metadata
    return new Response(JSON.stringify(metadataInsight), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    // Return fallback data on error
    const fallbackMetadata = {
      recommendationId: 0,
      primaryFactors: [
        {
          type: "general",
          name: "General Recommendation",
          weight: 0.5,
          relevance: "Based on general popularity",
        },
      ],
      secondaryFactors: [],
      uniqueFactors: [],
    };

    return new Response(JSON.stringify(fallbackMetadata), {
      status: 200, // Still return 200 with fallback data
      headers: { "Content-Type": "application/json" },
    });
  }
};
