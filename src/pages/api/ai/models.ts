import { OpenRouterService } from "../../../lib/services/openrouter.service";
import type { APIRoute } from "astro";

export const GET: APIRoute = async () => {
  try {
    // Call OpenRouter service to get all available models
    const models = await OpenRouterService.listModels();

    // Return the API response
    return new Response(
      JSON.stringify({
        models,
        count: models.length,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error fetching AI models:", error);

    // Return appropriate error response
    return new Response(
      JSON.stringify({
        error: "Failed to fetch AI models",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

// Export prerender as false since this is a dynamic API endpoint
export const prerender = false;
