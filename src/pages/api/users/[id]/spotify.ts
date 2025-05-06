import type { APIRoute } from "astro";
import { getSpotifyData } from "../../../../lib/services/spotify.service";

export const GET: APIRoute = async ({ params, request, cookies }) => {
  try {
    // Authentication verification
    const token = cookies.get("sb-token")?.value;
    if (!token) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get user ID from URL parameters
    const userId = params.id;
    if (!userId) {
      return new Response(JSON.stringify({ error: "User ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get pagination parameters from query string
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const offset = parseInt(url.searchParams.get("offset") || "0");

    // Validate pagination parameters
    if (isNaN(limit) || limit < 1 || limit > 100) {
      return new Response(
        JSON.stringify({ error: "Parameter 'limit' must be a number between 1 and 100" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (isNaN(offset) || offset < 0) {
      return new Response(
        JSON.stringify({ error: "Parameter 'offset' must be a non-negative number" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get Spotify data
    const spotifyData = await getSpotifyData(userId, limit, offset);

    // Check if data exists
    if (spotifyData.data.length === 0 && offset === 0) {
      return new Response(
        JSON.stringify({ error: "No Spotify data found for the specified user" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(JSON.stringify(spotifyData), {
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
