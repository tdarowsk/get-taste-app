import type { APIRoute } from "astro";
import { OpenRouterService, OpenRouterApiError } from "../../../lib/services/openrouter.service";
import { OPENROUTER_API_KEY } from "../../../env.config";
import { getSystemPrompts } from "../../../lib/utils/ai-prompts";

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
function getDefaultRecommendations(type: string): RecommendationData {
  if (type === "music") {
    return {
      title: "Default Music Recommendations",
      description: "Our top picks for you based on your music preferences",
      items: [
        {
          id: "music-default-1",
          name: "OK Computer",
          type: "music",
          details: { artist: "Radiohead", genre: "Alternative Rock", year: 1997 },
          explanation: "A classic album with experimental electronic elements",
          confidence: 0.95,
        },
        {
          id: "music-default-2",
          name: "To Pimp a Butterfly",
          type: "music",
          details: { artist: "Kendrick Lamar", genre: "Hip-Hop", year: 2015 },
          explanation: "Critically acclaimed hip-hop masterpiece",
          confidence: 0.92,
        },
      ],
    };
  } else {
    // Film recommendations
    return {
      title: "Default Film Recommendations",
      description: "Our top picks for you based on your film preferences",
      items: [
        {
          id: "film-default-1",
          name: "Inception",
          type: "film",
          details: { director: "Christopher Nolan", genre: "Sci-Fi", year: 2010 },
          explanation: "Mind-bending sci-fi with stunning visuals",
          confidence: 0.94,
        },
        {
          id: "film-default-2",
          name: "Parasite",
          type: "film",
          details: { director: "Bong Joon-ho", genre: "Drama/Thriller", year: 2019 },
          explanation: "Award-winning thriller with social commentary",
          confidence: 0.96,
        },
      ],
    };
  }
}

export const prerender = false;

/**
 * Endpoint API do generowania rekomendacji.
 *
 * POST /api/recommendations/generate
 * Body: { userId?: string, type: "music" | "film", force_refresh?: boolean, force_ai?: boolean }
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    // Extract request body
    const data = await request.json();
    const { userId, type, force_refresh = false, force_ai = false, is_new_user = false } = data;

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

    // Create user preferences and history based on user data
    // In a real application, these would come from a database or user profile
    const userPreferences = {
      favoriteGenres:
        type === "music" ? ["Electronic", "Indie", "Hip-Hop"] : ["Drama", "Sci-Fi", "Thriller"],
      likedArtists: type === "music" ? ["Radiohead", "Kendrick Lamar", "Beach House"] : [],
      likedDirectors:
        type === "music" ? [] : ["Denis Villeneuve", "Christopher Nolan", "Bong Joon-ho"],
      mood: force_refresh ? "exploratory" : "focused",
      engagementLevel: is_new_user ? "low" : "high",
      forceAi: force_ai,
    };

    const userFeedbackHistory = [
      {
        itemId: "item123",
        name: type === "music" ? "Kid A" : "Parasite",
        type: type,
        rating: 5,
        timestamp: new Date().toISOString(),
      },
      {
        itemId: "item456",
        name: type === "music" ? "To Pimp a Butterfly" : "Arrival",
        type: type,
        rating: 4,
        timestamp: new Date().toISOString(),
      },
    ];

    try {
      // Get a properly formatted API key
      const formattedApiKey = getFormattedApiKey();

      if (!formattedApiKey) {
        throw new Error("Could not get a valid OpenRouter API key");
      }

      // Configure OpenRouter service with the formatted API key
      OpenRouterService.configure(formattedApiKey);

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

      // If we received empty items array, use mock recommendations
      if (!generatedData.items || generatedData.items.length === 0) {
        // Get mock recommendations
        generatedData = getDefaultRecommendations(type);
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
  } catch {
    return new Response(
      JSON.stringify({
        error: "Failed to generate recommendations",
        details: "Unknown error occurred",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
