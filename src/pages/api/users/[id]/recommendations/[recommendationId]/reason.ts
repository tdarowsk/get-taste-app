import type { APIRoute } from "astro";
import type { RecommendationReason } from "../../../../../../types/recommendations";
import { createSupabaseServerInstance } from "../../../../../../db/supabase.client";

export const GET: APIRoute = async ({ params, request, cookies }) => {
  try {
    console.log("========== REASON API START ==========");
    // Extract user ID and recommendation ID from URL
    const userId = params.id;
    const recommendationId = Array.isArray(params.recommendationId)
      ? parseInt(params.recommendationId[0] || "")
      : parseInt(params.recommendationId || "");

    console.log("URL parameters:", { userId, recommendationId });

    // Validate parameters
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

    if (isNaN(recommendationId)) {
      console.error("Invalid recommendation ID:", params.recommendationId);
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

    console.log("URL User ID:", userId, "Type:", typeof userId);
    console.log("Session User ID:", session.user.id, "Type:", typeof session.user.id);
    console.log("Comparing:", String(userId), "vs", String(session.user.id));
    console.log("Are they equal?", String(userId) === String(session.user.id));

    // TODO: W przyszłości zaimplementować rzeczywistą logikę generowania powodów
    const reason: RecommendationReason = {
      primaryReason: "Dopasowano na podstawie Twoich preferencji",
      detailedReasons: [
        "Podobne do treści, które lubisz",
        "Popularne w Twojej kategorii wiekowej",
        "Wysoko oceniane przez użytkowników o podobnym guście",
      ],
      relatedItems: [
        {
          id: "1",
          name: "Przykładowa powiązana pozycja",
          similarity: 0.85,
        },
      ],
    };

    console.log("Returning reason data:", reason);
    console.log("========== REASON API END ==========");

    return new Response(JSON.stringify(reason), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error retrieving recommendation reason:", error);

    // Return fallback data on error
    const fallbackReason = {
      primaryReason: "Recommended for you",
      detailedReasons: ["This content might interest you"],
      relatedItems: [],
    };

    return new Response(JSON.stringify(fallbackReason), {
      status: 200, // Still return 200 with fallback data
      headers: { "Content-Type": "application/json" },
    });
  }
};
