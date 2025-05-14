import type { APIRoute } from "astro";
import { TasteService } from "../../../../lib/services/taste.service";

export const prerender = false;

/**
 * GET /api/users/:userId/taste
 * Returns a user's taste profile
 */
export const GET: APIRoute = async ({ params }) => {
  try {
    const userId = params.userId;

    if (!userId) {
      return new Response(
        JSON.stringify({
          error: "User ID is required",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Use the TasteService to get the user's taste profile
    const tasteProfile = await TasteService.getUserTaste(userId);

    return new Response(JSON.stringify(tasteProfile), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching taste profile:", error);

    return new Response(
      JSON.stringify({
        error: "Failed to fetch taste profile",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
