import type { APIRoute } from "astro";
import { RecommendationService } from "../../../lib/services/recommendation.service";

export const GET: APIRoute = async () => {
  try {
    // Use the recommendation service to get TMDB recommendations
    const tmdbRecommendations = await RecommendationService.getTMDBRecommendations("film");

    // Return the recommendations
    return new Response(JSON.stringify(tmdbRecommendations), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "max-age=3600", // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error("Error fetching TMDB recommendations:", error);

    return new Response(
      JSON.stringify({
        error: "Failed to fetch TMDB recommendations",
        message: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};
