import type { APIRoute } from "astro";
import { OPENROUTER_API_KEY } from "../../../env.config";

export const prerender = false;

/**
 * Debug endpoint to test connectivity with OpenRouter API
 *
 * GET /api/debug/openrouter
 */
export const GET: APIRoute = async () => {
  try {
    if (!OPENROUTER_API_KEY) {
      return new Response(JSON.stringify({ error: "OpenRouter API key is not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Simple connectivity test

    const response = await fetch("https://openrouter.ai/api/v1/models", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://api.openrouter.ai/",
        "X-Title": "getTaste",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();

      return new Response(
        JSON.stringify({
          status: "error",
          statusCode: response.status,
          message: `API responded with ${response.status}`,
          details: errorText,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const data = await response.json();

    return new Response(
      JSON.stringify({
        status: "success",
        message: "Successfully connected to OpenRouter API",
        models_count: data.length || 0,
        data: data,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        status: "error",
        message: "Failed to connect to OpenRouter API",
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
