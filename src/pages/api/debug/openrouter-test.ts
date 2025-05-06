import type { APIRoute } from "astro";
import { OPENROUTER_API_KEY } from "../../../env.config";

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
 * Debug endpoint to test OpenRouter API connectivity.
 * GET /api/debug/openrouter-test
 */
export const GET: APIRoute = async () => {
  try {
    // Get formatted API key
    const apiKey = getFormattedApiKey();

    if (!apiKey) {
      throw new Error("No valid API key found");
    }

    // Test API connectivity
    const response = await fetch("https://openrouter.ai/api/v1/auth/key", {
      method: "HEAD",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://gettaste.app",
        "X-Title": "GetTaste App",
      },
    });

    // Get list of available models as a more complete test
    if (response.ok) {
      const modelsResponse = await fetch("https://openrouter.ai/api/v1/models", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": "https://gettaste.app",
          "X-Title": "GetTaste App",
        },
      });

      const models = await modelsResponse.json();

      return new Response(
        JSON.stringify({
          status: "success",
          message: "OpenRouter API connection successful",
          api_key_valid: true,
          connection_test: {
            status: response.status,
            ok: response.ok,
          },
          models_test: {
            status: modelsResponse.status,
            ok: modelsResponse.ok,
            models_count: models.length || 0,
          },
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // If auth test fails
    return new Response(
      JSON.stringify({
        status: "error",
        message: `OpenRouter API connection failed with status ${response.status}`,
        api_key_valid: false,
        api_key_length: apiKey.length,
        api_key_last4: apiKey.slice(-4),
        connection_test: {
          status: response.status,
          ok: response.ok,
        },
      }),
      {
        status: 200, // Still return 200 for debugging
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        status: "error",
        message: "Failed to test OpenRouter API",
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
