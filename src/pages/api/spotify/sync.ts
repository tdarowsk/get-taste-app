import type { APIRoute } from "astro";
import { z } from "zod";
import { syncSpotifyData } from "../../../lib/services/spotify.service";

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Authentication verification
    const token = cookies.get("sb-token")?.value;
    if (!token) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check request content type
    const contentType = request.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      return new Response(JSON.stringify({ error: "Content-Type must be application/json" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Parse request body
    const requestBody = await request.json();

    // Validate input data using Zod
    const schema = z.object({
      user_id: z.number().positive(),
    });

    try {
      schema.parse(requestBody);
    } catch (validationError: unknown) {
      const errorDetails =
        validationError instanceof z.ZodError ? validationError.errors : "Invalid input data";

      return new Response(
        JSON.stringify({
          error: "Invalid input data",
          details: errorDetails,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Call Spotify service
    const result = await syncSpotifyData(requestBody);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    return new Response(
      JSON.stringify({
        error: "An error occurred while processing the request",
        message: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
