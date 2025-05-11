import type { APIRoute } from "astro";
import { OpenRouterService } from "../../../lib/services/openrouter.service";
import { OPENROUTER_API_KEY } from "../../../env.config";
import { RecommendationService } from "../../../lib/services/recommendation.service";
import { MovieMappingService } from "../../../lib/services/movie-mapping.service";

export const prerender = false;

/**
 * Endpoint API do pobierania najnowszych rekomendacji.
 *
 * GET /api/recommendations/latest?userId={userId}&type={type}
 */
export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    // Parse query parameters
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");
    const type = url.searchParams.get("type") as "music" | "film" | null;

    // Validate parameters
    if (!userId) {
      return new Response(JSON.stringify({ error: "Missing userId parameter" }), {
        status: 400,
      });
    }

    if (!type || (type !== "music" && type !== "film")) {
      return new Response(
        JSON.stringify({ error: "Invalid type parameter (must be 'music' or 'film')" }),
        {
          status: 400,
        }
      );
    }

    // Convert to a music or film type
    const finalType = type as "music" | "film";

    try {
      // Get real user preferences from database
      const userPreferences = await RecommendationService.getUserPreferences(userId, finalType);

      // Get user feedback history - wrap in try/catch for safety
      let userFeedbackHistory = [];
      try {
        const feedbackUrl = `${request.url.split("/api/")[0]}/api/users/${userId}/item-feedback`;
        console.log(`[API] Fetching user feedback from: ${feedbackUrl}`);

        const feedbackResult = await fetch(feedbackUrl);

        if (feedbackResult.ok) {
          // Check content type to make sure we're getting JSON
          const contentType = feedbackResult.headers.get("content-type");
          if (!contentType || !contentType.includes("application/json")) {
            console.warn(`[API] Unexpected content type from feedback API: ${contentType}`);
            // Continue with empty feedback
          } else {
            // Try to parse the JSON safely
            try {
              const feedbackText = await feedbackResult.text();
              // Simple validation to check if it looks like JSON before parsing
              if (feedbackText.trim().startsWith("{") || feedbackText.trim().startsWith("[")) {
                const feedbackData = JSON.parse(feedbackText);
                if (feedbackData && feedbackData.items && Array.isArray(feedbackData.items)) {
                  userFeedbackHistory =
                    feedbackData.items
                      .filter((item: { feedback_type: string }) => item.feedback_type === "like")
                      .slice(0, 10) || []; // Use most recent 10 liked items
                  console.log(
                    `[API] Successfully fetched ${userFeedbackHistory.length} feedback items`
                  );
                }
              } else {
                console.warn(
                  `[API] Feedback API returned non-JSON response: ${feedbackText.substring(0, 100)}...`
                );
              }
            } catch (parseError) {
              console.error("[API] Error parsing feedback JSON:", parseError);
              // Continue with empty feedback
            }
          }
        } else {
          console.warn(`[API] Failed to fetch user feedback, status: ${feedbackResult.status}`);
        }
      } catch (feedbackError) {
        console.error("[API] Error fetching user feedback:", feedbackError);
        // Continue with empty feedback
      }

      // If this is a film recommendation, translate movie IDs to titles - wrapped in a try/catch
      if (
        finalType === "film" &&
        "liked_movies" in userPreferences &&
        userPreferences.liked_movies &&
        Array.isArray(userPreferences.liked_movies) &&
        userPreferences.liked_movies.length > 0
      ) {
        try {
          // Convert movie IDs to actual movie titles for better context
          const movieTitles = await MovieMappingService.translateMovieIdsToTitles(
            userPreferences.liked_movies,
            { headers: request.headers, cookies }
          );

          if (movieTitles && movieTitles.length > 0) {
            console.log(`[API] Translated ${movieTitles.length} movie IDs to titles for context`);
            userPreferences.liked_movies = movieTitles;
          }
        } catch (translateError) {
          console.error("[API] Error translating movie IDs to titles:", translateError);
          // Continue with IDs if translation fails - no need to modify preferences
        }
      }

      // Configure OpenRouter service
      OpenRouterService.configure(OPENROUTER_API_KEY || "");

      // Generate recommendations
      const generatedData = await OpenRouterService.generateRecommendations(
        userPreferences,
        userFeedbackHistory,
        finalType
      );

      // Create response object
      const recommendationResponse = {
        id: Date.now(),
        user_id: userId,
        type: finalType,
        created_at: new Date().toISOString(),
        data: generatedData,
        ai_generated: true,
      };

      return new Response(JSON.stringify(recommendationResponse), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("[API] Error generating recommendations:", error);

      // Return a fallback response with error information
      const fallbackResponse = {
        id: Date.now(),
        user_id: userId,
        type: finalType,
        created_at: new Date().toISOString(),
        data: {
          title: `${finalType === "music" ? "Music" : "Film"} Recommendations`,
          description: `${finalType === "music" ? "Music" : "Film"} recommendations based on your preferences`,
          items: [],
        },
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };

      return new Response(JSON.stringify(fallbackResponse), {
        status: 200, // Still return 200 to prevent UI breakage
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    console.error("[API] Global error in recommendation generation:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to generate recommendations",
        details: error instanceof Error ? error.message : "Unknown error occurred",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
