import type { APIRoute } from "astro";
import { OpenRouterService } from "../../../lib/services/openrouter.service";
import { OPENROUTER_API_KEY } from "../../../env.config";

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

export const prerender = false;

/**
 * Endpoint API do pobierania najnowszych rekomendacji.
 *
 * GET /api/recommendations/latest?userId={userId}&type={type}
 */
export const GET: APIRoute = async ({ request }) => {
  try {
    // Parse query parameters
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");
    const type = url.searchParams.get("type") as "music" | "film" | null;

    // Validate parameters
    if (!userId) {
      return new Response(JSON.stringify({ error: "Missing userId parameter" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Set final type with default
    const finalType = type || "film"; // Default to film if no type specified

    try {
      // Get a properly formatted API key
      const formattedApiKey = getFormattedApiKey();

      if (!formattedApiKey) {
        throw new Error("Could not get a valid OpenRouter API key");
      }

      // Configure OpenRouter service with the formatted API key
      OpenRouterService.configure(formattedApiKey);

      // Create mock user preferences and history for demonstration
      const userPreferences = {
        favoriteGenres:
          finalType === "music"
            ? ["Electronic", "Indie", "Hip-Hop"]
            : ["Drama", "Sci-Fi", "Thriller"],
        likedArtists: finalType === "music" ? ["Radiohead", "Kendrick Lamar", "Beach House"] : [],
        likedDirectors:
          finalType === "music" ? [] : ["Denis Villeneuve", "Christopher Nolan", "Bong Joon-ho"],
        mood: "exploratory",
        engagementLevel: "high",
      };

      const userFeedbackHistory = [
        {
          itemId: "item123",
          name: finalType === "music" ? "Kid A" : "Parasite",
          type: finalType,
          rating: 5,
          timestamp: new Date().toISOString(),
        },
        {
          itemId: "item456",
          name: finalType === "music" ? "To Pimp a Butterfly" : "Arrival",
          type: finalType,
          rating: 4,
          timestamp: new Date().toISOString(),
        },
      ];

      // Generate real AI recommendations using OpenRouter
      const generatedData = await OpenRouterService.generateRecommendations<RecommendationData>(
        userPreferences,
        userFeedbackHistory,
        finalType,
        {
          temperature: 0.7,
          maxTokens: 2000,
          systemPrompt: `Generate ${finalType} recommendations in JSON format with title, description, and array of items. Each item should have id, name, type, details, explanation, and confidence.`,
        }
      );

      // Create the full response object with indicators of AI-generated content
      const recommendationResponse = {
        id: Date.now(),
        user_id: userId,
        type: finalType,
        created_at: new Date().toISOString(),
        data: generatedData,
        ai_generated: true,
        ai_version: "Neural Recommendation System v4.7",
        confidence_score: 0.95,
      };

      return new Response(JSON.stringify(recommendationResponse), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      // Return a fallback response with error information
      const fallbackResponse = {
        id: Date.now(),
        user_id: userId,
        type: finalType,
        created_at: new Date().toISOString(),
        data: {
          title: `AI ${finalType === "music" ? "Music" : "Film"} Recommendations`,
          description: "An error occurred while generating real AI recommendations",
          error: error instanceof Error ? error.message : String(error),
          items: [],
        },
      };

      return new Response(JSON.stringify(fallbackResponse), {
        status: 200, // Still return 200 to prevent UI breakage
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch {
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
