import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "../../../db/supabase.client";

export const prerender = false;

/**
 * GET /api/auth/me
 * Returns information about the currently authenticated user
 */
export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return new Response(
        JSON.stringify({
          error: error?.message || "User not authenticated",
          authenticated: false,
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Return user data without sensitive information
    return new Response(
      JSON.stringify({
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        updated_at: user.updated_at,
        user_metadata: user.user_metadata,
        authenticated: true,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch {
    return new Response(
      JSON.stringify({
        error: "Authentication error",
        authenticated: false,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
