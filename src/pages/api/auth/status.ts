import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "../../../db/supabase.client";

export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    return new Response(
      JSON.stringify({
        success: true,
        user: user
          ? {
              id: user.id,
              email: user.email,
            }
          : null,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Błąd sprawdzania statusu autentykacji:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Wystąpił błąd podczas sprawdzania statusu autentykacji",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};
