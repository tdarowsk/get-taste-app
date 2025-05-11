import type { APIRoute } from "astro";
import { OpenRouterService, OpenRouterApiError } from "../../../lib/services/openrouter.service";
import { OPENROUTER_API_KEY, TMDB_API_KEY } from "../../../env.config";
import { getSystemPrompts } from "../../../lib/utils/ai-prompts";
import { createSupabaseServerInstance } from "../../../db/supabase.client";
import { RecommendationService } from "../../../lib/services/recommendation.service";
import { MovieMappingService } from "../../../lib/services/movie-mapping.service";

// Define recommendation data types to use locally
interface RecommendationData {
  title: string;
  description: string;
  items: RecommendationItem[];
  [key: string]: unknown;
}

interface RecommendationItem {
  id: string;
  name: string;
  type: string;
  details: Record<string, unknown>;
  explanation: string;
  confidence: number;
}

// Format API key - resolves issues with malformed .env files
function getFormattedApiKey(): string {
  if (!OPENROUTER_API_KEY) {
    return "";
  }

  // Clean the API key by removing any surrounding whitespace or quotes
  let cleanKey = OPENROUTER_API_KEY.trim();

  // Sometimes .env parsing can leave quotes
  if (
    (cleanKey.startsWith('"') && cleanKey.endsWith('"')) ||
    (cleanKey.startsWith("'") && cleanKey.endsWith("'"))
  ) {
    cleanKey = cleanKey.slice(1, -1);
  }

  // Remove any line breaks or weird characters
  cleanKey = cleanKey.replace(/[\r\n\t]/g, "");

  return cleanKey;
}

// Define default recommendations to use if API fails
async function getDefaultRecommendations(type: "music" | "film"): Promise<RecommendationData> {
  if (type === "film" && TMDB_API_KEY) {
    try {
      // Use TMDB API to get trending movies
      const tmdbRecommendations = await RecommendationService.getTMDBRecommendations(type);

      // Ensure type compatibility by processing items
      return {
        title: tmdbRecommendations.title,
        description: tmdbRecommendations.description,
        items: tmdbRecommendations.items.map((item) => ({
          id: item.id || `fallback-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          name: item.name || "Unknown",
          type: item.type || "film",
          details: item.details || {},
          explanation: item.explanation || "Recommended from trending movies",
          confidence: item.confidence || 0.7,
        })),
      };
    } catch (error) {
      console.error("[API] Error fetching TMDB recommendations:", error);
    }
  }

  // Fallback to empty recommendations if TMDB fails or for music
  return {
    title: `${type === "music" ? "Music" : "Film"} Recommendations`,
    description: `Personalized ${type} recommendations based on your preferences`,
    items: [],
  };
}

export const prerender = false;

/**
 * Endpoint API do generowania rekomendacji.
 *
 * POST /api/recommendations/generate
 * Body: { userId?: string, type: "music" | "film", force_refresh?: boolean, force_ai?: boolean }
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Extract request body
    const data = await request.json();
    const { userId, type, force_refresh = false, force_ai = false, is_new_user = false } = data;

    console.info(`[API] Generating ${type} recommendations for user ${userId}`);

    // Validate parameters
    if (!userId) {
      return new Response(JSON.stringify({ error: "Missing userId parameter" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!type || (type !== "music" && type !== "film")) {
      return new Response(
        JSON.stringify({ error: "Invalid type parameter (must be 'music' or 'film')" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Initialize Supabase client
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // Fetch real user preferences from the database
    const table = type === "music" ? "music_preferences" : "film_preferences";
    const { data: userPrefsData, error: prefsError } = await supabase
      .from(table)
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (prefsError) {
      console.error(`[API] Error fetching user preferences: ${prefsError.message}`);
    }

    // Fetch user feedback history
    interface FeedbackItem {
      recommendation_id?: string;
      content_id?: string;
      feedback_type?: string;
      created_at?: string;
      [key: string]: unknown;
    }

    let feedbackItems: FeedbackItem[] = [];
    try {
      // Try with content_id and content_type columns
      const { data, error } = await supabase
        .from("recommendation_feedback")
        .select("recommendation_id, content_id, feedback_type, created_at")
        .eq("user_id", userId)
        .eq("content_type", type)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) {
        // If there's an error, it might be because the columns don't exist
        console.error(`[API] Error fetching user feedback: ${error.message}`);

        // Try again without content_id and content_type
        const { data: fallbackData, error: fallbackError } = await supabase
          .from("recommendation_feedback")
          .select("recommendation_id, feedback_type, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(10);

        if (fallbackError) {
          console.error(`[API] Error fetching user feedback (fallback): ${fallbackError.message}`);
        } else if (Array.isArray(fallbackData)) {
          feedbackItems = fallbackData as unknown as FeedbackItem[];
        }
      } else if (Array.isArray(data)) {
        // Convert to unknown first to satisfy TypeScript's type checking
        feedbackItems = data as unknown as FeedbackItem[];
      }
    } catch (error) {
      console.error("[API] Exception in feedback query:", error);
    }

    // Format user preferences based on database data
    const userPreferences = {
      favoriteGenres: userPrefsData?.genres || [],
      likedArtists:
        type === "music"
          ? userPrefsData && "artists" in userPrefsData
            ? userPrefsData.artists || []
            : []
          : [],
      likedDirectors:
        type === "film"
          ? userPrefsData && "director" in userPrefsData
            ? userPrefsData.director
              ? [userPrefsData.director]
              : []
            : []
          : [],
      likedActors:
        type === "film"
          ? userPrefsData && "cast" in userPrefsData
            ? userPrefsData.cast || []
            : []
          : [],
      likedScreenwriters:
        type === "film"
          ? userPrefsData && "screenwriter" in userPrefsData
            ? userPrefsData.screenwriter
              ? [userPrefsData.screenwriter]
              : []
            : []
          : [],
      likedMovies:
        type === "film"
          ? userPrefsData && "liked_movies" in userPrefsData
            ? userPrefsData.liked_movies || []
            : []
          : [],
      mood: force_refresh ? "exploratory" : "focused",
      engagementLevel: is_new_user ? "low" : "high",
      forceAi: force_ai,
    };

    // Jeśli to są rekomendacje filmowe, pobierz dodatkowe dane o zalajkowanych filmach
    if (type === "film") {
      try {
        // Pobierz dodatkowe dane o filmach, które użytkownik polubił z tabeli item_feedback
        const { data: movieFeedback, error: feedbackError } = await supabase
          .from("item_feedback")
          .select("item_id")
          .eq("user_id", userId)
          .eq("feedback_type", "like");

        if (!feedbackError && movieFeedback && movieFeedback.length > 0) {
          // Dodaj identyfikatory filmów z feedbacku do tablicy likedMovies
          const likedMovieIds = movieFeedback.map((item) => item.item_id).filter(Boolean);

          // Połącz z istniejącymi wartościami usuwając duplikaty
          if (likedMovieIds.length > 0) {
            const existingLikedMovies = userPreferences.likedMovies || [];
            userPreferences.likedMovies = [...new Set([...existingLikedMovies, ...likedMovieIds])];
            console.log(`[API] Added ${likedMovieIds.length} liked movies from feedback history`);
          }
        }
      } catch (err) {
        console.error("[API] Error fetching additional liked movies:", err);
      }
    }

    // If this is a film recommendation, translate movie IDs to actual titles
    if (type === "film" && userPreferences.likedMovies.length > 0) {
      try {
        // Convert movie IDs to actual movie titles
        const movieTitles = await MovieMappingService.translateMovieIdsToTitles(
          userPreferences.likedMovies,
          { headers: request.headers, cookies }
        );

        if (movieTitles.length > 0) {
          console.log(
            `[API] Translated ${movieTitles.length} movie IDs to titles for recommendation context`
          );
          userPreferences.likedMovies = movieTitles;
        }
      } catch (err) {
        console.error("[API] Error translating movie IDs to titles:", err);
        // Keep using the IDs if the translation fails
      }
    }

    console.log(`[API] User preferences for ${type}: ${JSON.stringify(userPreferences)}`);

    // Format user feedback history
    const userFeedbackHistory =
      feedbackItems.length > 0
        ? feedbackItems.map((item) => ({
            itemId: item.content_id || `item-${Math.random().toString(36).substring(2, 9)}`,
            feedbackType: item.feedback_type || "like",
            timestamp: item.created_at || new Date().toISOString(),
          }))
        : [];

    try {
      // Get a properly formatted API key
      const formattedApiKey = getFormattedApiKey();

      if (!formattedApiKey) {
        throw new Error("Could not get a valid OpenRouter API key");
      }

      // Configure OpenRouter service with the formatted API key
      OpenRouterService.configure(formattedApiKey);

      console.log("[API] Sending request to OpenRouter for recommendations");

      // Generate real AI recommendations using OpenRouter
      let generatedData = await OpenRouterService.generateRecommendations<RecommendationData>(
        userPreferences,
        userFeedbackHistory,
        type,
        {
          systemPrompt: getSystemPrompts().recommendationGenerator
            ? getSystemPrompts().recommendationGenerator(type)
            : undefined,
          temperature: force_refresh ? 0.8 : 0.7, // Higher temperature for more variety when forcing refresh
          maxTokens: 2000,
        }
      );

      // Enhanced AI recommendation logging
      console.log(
        `\x1b[32m[API] OpenRouter response received with ${generatedData?.items?.length || 0} items\x1b[0m`
      );

      // Log the first few items in the console
      if (generatedData?.items?.length > 0) {
        console.log(`\x1b[32m[API] AI Generated ${type.toUpperCase()} RECOMMENDATIONS:\x1b[0m`);
        generatedData.items.slice(0, 3).forEach((item, index) => {
          console.log(`\x1b[32m[AI Item ${index + 1}] ${item.name}\x1b[0m`);
          console.log(`\x1b[32m  - ID: ${item.id}\x1b[0m`);
          console.log(`\x1b[32m  - Type: ${item.type}\x1b[0m`);
          console.log(
            `\x1b[32m  - Details: ${JSON.stringify(item.details).substring(0, 200)}...\x1b[0m`
          );
          console.log(`\x1b[32m  - Explanation: ${item.explanation}\x1b[0m`);
          console.log(`\x1b[32m  - Image URL: ${item.details.imageUrl || "None"}\x1b[0m`);
        });

        // Log debug info with full data structure of first item
        console.log(`\x1b[32m[API] DEBUG - Full structure of the first AI-generated item:\x1b[0m`);
        console.log(JSON.stringify(generatedData.items[0], null, 2));
      }

      // If we received empty items array, use TMDB recommendations
      if (!generatedData.items || generatedData.items.length === 0) {
        console.log("[API] Empty items received, using TMDB recommendations");
        // Get TMDB recommendations
        generatedData = await getDefaultRecommendations(type);
      }

      // Filtruj rekomendacje aby usunąć już polubione filmy/utwory
      if (generatedData.items && generatedData.items.length > 0) {
        // Pobierz listę polubionych ID
        const { data: likedItems } = await supabase
          .from("item_feedback")
          .select("item_id")
          .eq("user_id", userId)
          .eq("feedback_type", "like");

        const likedItemIds = new Set(likedItems?.map((item) => item.item_id) || []);

        // Utwórz mapowanie ID - nazwa dla polubionych filmów
        const likedItemsByName = new Set(userPreferences.likedMovies || []);

        // Filtruj rekomendacje, usuwając już polubione elementy
        const originalCount = generatedData.items.length;
        generatedData.items = generatedData.items.filter((item) => {
          // Sprawdź czy nie występuje w polubionych ID
          if (likedItemIds.has(item.id)) {
            return false;
          }

          // Sprawdź czy nazwa nie pokrywa się z już polubionymi elementami
          if (type === "film" && likedItemsByName.has(item.name)) {
            return false;
          }

          return true;
        });

        // Jeśli usunęliśmy jakieś elementy, zapisz informację w logach
        if (generatedData.items.length < originalCount) {
          console.log(
            `[API] Filtered out ${originalCount - generatedData.items.length} already liked items from recommendations`
          );
        }
      }

      // Create response object
      const recommendationResponse = {
        id: Date.now(),
        user_id: userId,
        type: type,
        created_at: new Date().toISOString(),
        data: generatedData,
        ai_generated: true,
        ai_version: "Neural Recommendation System v4.7",
        force_refreshed: force_refresh,
      };

      return new Response(JSON.stringify(recommendationResponse), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      // Return a fallback response with error information
      console.error("[API] Error generating recommendations:", error);

      // Try to extract more detailed information from the error
      let errorMessage = "Unknown error";
      let errorDetails = {};

      if (error instanceof Error) {
        errorMessage = error.message;
        errorDetails = {
          message: error.message,
          stack: error.stack,
          name: error.name,
        };

        // Check if it's an OpenRouter error with additional properties
        if (error.name === "OpenRouterApiError" && "statusCode" in error) {
          const openRouterError = error as OpenRouterApiError;
          errorDetails = {
            ...errorDetails,
            statusCode: openRouterError.statusCode,
            response: openRouterError.response,
          };
        }
      } else {
        errorDetails = String(error);
      }

      // Get default recommendations from the OpenRouter service
      try {
        // Force it to use the default recommendations by requesting with an invalid model
        const defaultData = await OpenRouterService.generateRecommendations<RecommendationData>(
          userPreferences,
          userFeedbackHistory,
          type,
          { model: "invalid-model-to-trigger-defaults" }
        );

        // Return the default recommendations
        const fallbackResponse = {
          id: Date.now(),
          user_id: userId,
          type: type,
          created_at: new Date().toISOString(),
          data: defaultData,
          ai_generated: false,
          error_occurred: true,
          error_message: errorMessage,
        };

        return new Response(JSON.stringify(fallbackResponse), {
          status: 200, // Still return 200 to prevent UI breakage
          headers: { "Content-Type": "application/json" },
        });
      } catch {
        // Last resort fallback with empty items array
        const fallbackResponse = {
          id: Date.now(),
          user_id: userId,
          type: type,
          created_at: new Date().toISOString(),
          data: {
            title: `AI ${type === "music" ? "Music" : "Film"} Recommendations`,
            description: "An error occurred while generating recommendations",
            error: errorMessage,
            error_details: errorDetails,
            items: [],
          },
        };

        return new Response(JSON.stringify(fallbackResponse), {
          status: 200, // Still return 200 to prevent UI breakage
          headers: { "Content-Type": "application/json" },
        });
      }
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
